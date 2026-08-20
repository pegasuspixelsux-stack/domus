# Domus Admin System — Lead Pipeline (sub-project 3 of 5)

## Context

Sub-projects 1 (Foundation) and 2 (Property Manager) are complete and merged.
This is sub-project 3: replace the `/dashboard/pipeline` stub with a Kanban
board for tracking leads through a sales pipeline, accessible to both
`admin` and `sales` roles (per the Foundation's RBAC design — Sales is
restricted to this route only; Admin has full access everywhere).

Remaining after this: sub-project 4 (User Management), sub-project 5
(Public Property Detail page).

## Decisions (confirmed with user)

- **View**: Kanban only — 7 columns, one per `LeadStatus` value, drag-and-drop
  to change status. No separate table view.
- **New dependency**: `@dnd-kit/core` — accessible (keyboard + touch),
  actively maintained, the current standard for React drag-and-drop. No
  drag-and-drop library exists in the project yet. `@dnd-kit/sortable` is
  **not** needed — cards don't need persisted ordering within a column,
  only their status (column) matters.
- **Lead visibility**: `sales` sees and manages only leads where
  `assignedTo === session.uid`. `admin` sees and manages all leads.
  Enforced at the data-fetch layer (query filter for sales) **and**
  independently inside every mutation (an action must not trust that the
  UI only shows a sales user their own leads — a direct action call with
  someone else's lead ID must still be rejected).
- **Activity logging**: manual, timestamped notes only (`type: "call" |
  "whatsapp" | "email" | "note" | "status_change"` + free-text `note`).
  No WhatsApp Business API, no telephony integration — matches the
  Foundation spec's `activities` subcollection exactly.
- **Lead creation**: both `admin` and `sales` can create a lead; it is
  always auto-assigned to the creator (`assignedTo = session.uid`), even
  when the creator is an admin.
- **Reassignment**: `admin`-only. A separate action from creation — an
  admin creates a lead (auto-assigned to themselves) and can reassign it
  afterward via a dedicated control.
- **Detail/create UX**: modals, not separate pages. Clicking a card opens
  a detail modal (activity timeline, add-activity form, status dropdown
  as a non-drag alternative, reassign control for admins). "+ Nuevo Lead"
  opens a create modal. This differs deliberately from Property Manager's
  page-per-action pattern — a Kanban board's scroll position and column
  layout are worth preserving, which a full-page navigation would lose.

## Data model

Already specified in the Foundation spec, reproduced here as the
authoritative shape for this sub-project's code:

```
leads/{id}
  name: string
  email: string
  phone: string
  source: string
  status: "new" | "contacted" | "qualified" | "visit_scheduled"
        | "negotiation" | "won" | "lost"
  assignedTo: string           // uid
  propertyId?: string          // optional, references properties/{id}; not
                                 // set by any UI in this sub-project — the
                                 // field exists for a future sub-project to
                                 // link a lead to the property they're
                                 // interested in
  createdAt, updatedAt: Timestamp

leads/{id}/activities/{activityId}
  type: "call" | "whatsapp" | "email" | "note" | "status_change"
  note: string
  createdAt: Timestamp
  createdBy: string            // uid
```

Column order / labels (Spanish, matching the rest of the dashboard):

| status | label |
|---|---|
| `new` | Nuevo |
| `contacted` | Contactado |
| `qualified` | Calificado |
| `visit_scheduled` | Visita Agendada |
| `negotiation` | Negociación |
| `won` | Ganado |
| `lost` | Perdido |

## Validation rules

`lib/leads/validation.ts` exports `validateLeadInput(input)`, returning
`{ valid: true; data: LeadInput } | { valid: false; errors: Record<string,string> }`
(Spanish error messages). Rules:

- `name`: required, non-empty after trim.
- `email`: required, must match a basic email shape (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`).
- `phone`: required, non-empty after trim (no format enforcement — phone
  formats vary too much internationally to validate strictly here).
- `source`: required, non-empty after trim (free text — e.g. "Instagram",
  "Referido", "Sitio Web").
- `status`: not part of creation input — every new lead starts at `"new"`,
  hardcoded, not user-selectable at creation time.

Pure function, no Firestore/session access, fully unit-tested.

## Server Actions

`lib/leads/actions.ts`, all `"use server"`:

- `createLead(prevState, formData)`: `requireRole(["admin","sales"])` →
  validate → Firestore `.add()` with `status: "new"`, `assignedTo:
  session.uid`, `createdAt`/`updatedAt: FieldValue.serverTimestamp()` →
  `revalidatePath("/dashboard/pipeline")` → returns success (the modal
  closes client-side on success; no redirect, since this stays on the
  board).
- `updateLeadStatus(leadId, newStatus)`: `requireRole(["admin","sales"])`
  → fetch the lead → if `session.role === "sales"` and
  `lead.assignedTo !== session.uid`, reject → Firestore `.update({
  status: newStatus, updatedAt: FieldValue.serverTimestamp() })` → **also**
  writes an `activities` doc with `type: "status_change"`, `note:
  "<old label> → <new label>"`, `createdBy: session.uid` → `revalidatePath`.
- `addActivity(leadId, type, note)`: same ownership check as above →
  writes to `leads/{id}/activities` → `revalidatePath`.
- `reassignLead(leadId, newAssigneeUid)`: `requireRole(["admin"])` only →
  Firestore `.update({ assignedTo: newAssigneeUid, updatedAt:
  FieldValue.serverTimestamp() })` → `revalidatePath`.

Every mutation re-checks role/ownership independently — never trusts that
the calling UI only exposes actions the user is allowed to take, matching
the Foundation and Property Manager's established pattern.

## Data access

`lib/leads/data.ts`:

- `getLeads(session: Session): Promise<Lead[]>` — Admin SDK; if
  `session.role === "sales"`, query `.where("assignedTo", "==",
  session.uid)`; if `"admin"`, no filter (all leads).
- `getLead(id: string): Promise<Lead | null>`.
- `getActivities(leadId: string): Promise<Activity[]>` — ordered by
  `createdAt desc` (most recent first).

`lib/team/data.ts` (minimal, read-only — full CRUD is sub-project 4):

- `getTeamMembers(): Promise<{ uid: string; displayName: string; role:
  Role }[]>` — reads every doc in the `users` collection. Used only to
  populate the reassignment dropdown with real names instead of raw
  UIDs.

All server-only (Admin SDK), consistent with the established architecture
— no client Firestore SDK reads anywhere in the dashboard.

## Pages and components

- `app/(dashboard)/dashboard/pipeline/page.tsx` (replaces the stub):
  `requireRole(["admin","sales"])`, `getLeads(session)`, `getTeamMembers()`
  (only actually used by admins, but fetched once here and passed down —
  cheap enough not to gate behind role), renders `<PipelineBoard leads=
  {...} teamMembers={...} currentRole={session.role} />`.
- `components/dashboard/pipeline-board.tsx` (Client Component): dnd-kit
  `DndContext`, one droppable column per status, cards grouped
  client-side from the `leads` prop. On drop, optimistically moves the
  card and calls `updateLeadStatus`; reverts on failure. "+ Nuevo Lead"
  button opens `NewLeadModal`. Clicking a card opens `LeadDetailModal`
  for that lead.
- `components/dashboard/lead-card.tsx`: draggable (`useDraggable`) card
  showing name, source, a truncated look at the most recent activity if
  any.
- `components/dashboard/lead-detail-modal.tsx`: activity timeline (newest
  first), a form to add a new activity (type select + note textarea), a
  status `<select>` as a non-drag way to change status, and — only when
  `currentRole === "admin"` — a reassign `<select>` populated from
  `teamMembers`.
- `components/dashboard/new-lead-modal.tsx`: name/email/phone/source
  form, calls `createLead`.

## Testing

- **Unit-tested**: `validateLeadInput` — valid input passes; each
  required-field-missing case fails with the right error key; malformed
  email rejected; valid email formats accepted (a few realistic
  variants).
- **Manually verified** (same practical approach as prior sub-projects —
  real `domus-e117e` project, no emulator):
  - As admin: create a lead, confirm it appears in the "Nuevo" column
    assigned to the admin's own name.
  - Drag a card between columns, confirm the status persists on reload
    and a `status_change` activity was logged.
  - Open a card, add a manual activity (e.g. "call"), confirm it appears
    in the timeline.
  - Reassign a lead to a different team member as admin, confirm it
    updates.
  - As a `sales` user: confirm only their assigned leads appear on the
    board; confirm there is no reassign control in the detail modal;
    attempt to call `reassignLead` isn't reachable from the UI (server-side
    rejection is the real guarantee, verified by code review of the
    action, not by attempting to bypass the UI manually).
  - RBAC regression check: sales hitting `/dashboard/properties` or
    `/dashboard/users` directly by URL still redirects to
    `/dashboard/pipeline` (this sub-project must not weaken sub-project
    1's guarantees).
