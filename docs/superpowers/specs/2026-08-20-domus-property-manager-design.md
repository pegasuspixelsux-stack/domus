# Domus Admin System — Property Manager (sub-project 2 of 5)

## Context

Sub-project 1 (Foundation) shipped Firebase Auth, server-verified session
cookies, RBAC, and a role-gated dashboard shell with stub pages. This is
sub-project 2: replace the `/dashboard/properties` stub with full CRUD on
the `properties` Firestore collection, admin-only.

Remaining sub-projects: 3 (Lead Pipeline), 4 (User Management), 5 (Public
Property Detail page — depends on real property data existing, so it
comes after this one).

## Decisions (confirmed with user)

- **Form flow**: separate pages — list, `/new`, `/[id]/edit` — not a modal.
- **List view**: table (title, price, status, updated date, actions), no
  interactive column sorting in this phase (YAGNI — default order
  `updatedAt desc`).
- **Features input**: tag input — type a feature, Enter adds it as a
  removable chip.
- **Delete**: hard delete (permanently removes the Firestore doc), behind
  a confirmation dialog. No soft-delete/archive state.
- **Images**: URL fields (per the Foundation spec — no Firebase Storage
  upload in this phase). Multiple images per property, add/remove rows.
- **Mutations**: Next.js Server Actions, not new API routes. Each action
  independently calls `requireRole(["admin"])` before touching Firestore
  — mirrors the Foundation's per-route independent-enforcement principle,
  applied to writes.
- **Scope boundary**: this sub-project does not touch the public
  marketing site's Showcase section (`components/sections/showcase.tsx`,
  still static/hardcoded) — that wiring is sub-project 5.

## Data model

Already specified in the Foundation spec, reproduced here as the
authoritative shape for this sub-project's code:

```
properties/{id}
  title: string
  description: string
  price: number              // > 0
  currency: string           // e.g. "USD"
  location: string
  tag: string                 // e.g. "Frente al Mar"
  status: "available" | "reserved" | "sold"
  images: string[]            // ≥ 1 URL
  features: string[]
  bedrooms: number
  bathrooms: number
  areaM2: number
  createdAt, updatedAt: Timestamp
  createdBy: string           // uid
```

## Validation rules

`lib/properties/validation.ts` exports `validatePropertyInput(input)`,
returning either `{ valid: true, data: PropertyInput }` or
`{ valid: false, errors: Record<string, string> }` (field name → Spanish
error message, since the rest of the admin UI is in Spanish). Rules:

- `title`: required, non-empty after trim.
- `description`: required, non-empty after trim.
- `price`: required, finite number, `> 0`.
- `currency`: required, non-empty (e.g. `"USD"`).
- `location`: required, non-empty.
- `tag`: required, non-empty.
- `status`: required, one of `"available" | "reserved" | "sold"`.
- `images`: required, array with at least 1 non-empty string entry.
- `features`: array (may be empty — a property can have zero listed
  features).
- `bedrooms`, `bathrooms`: required, integer, `>= 0`.
- `areaM2`: required, finite number, `> 0`.

This function is pure (no Firestore/session access) and fully unit-tested.

## Server Actions

`lib/properties/actions.ts`:

- `createProperty(formData: FormData)`: `requireRole(["admin"])` →
  extract + `validatePropertyInput` → on failure, return
  `{ errors }` for `useActionState`; on success, write to Firestore with
  `createdBy: session.uid`, `createdAt`/`updatedAt: FieldValue.serverTimestamp()`
  → `revalidatePath("/dashboard/properties")` → `redirect("/dashboard/properties")`.
- `updateProperty(id: string, formData: FormData)`: same guard +
  validation → Firestore `update()` with `updatedAt: FieldValue.serverTimestamp()`
  (does not touch `createdBy`/`createdAt`) → revalidate + redirect.
- `deleteProperty(id: string)`: `requireRole(["admin"])` → Firestore
  `delete()` → `revalidatePath("/dashboard/properties")`. Called from a
  confirmation-gated client control on the list page, not a page of its
  own.

## Data access

`lib/properties/data.ts`:

- `getProperties(): Promise<Property[]>` — Admin SDK, `properties`
  collection ordered by `updatedAt desc`.
- `getProperty(id: string): Promise<Property | null>` — Admin SDK single
  doc read; `null` if missing.

Both are server-only (Admin SDK), consistent with the Foundation's
architecture (no client Firestore SDK reads anywhere in the dashboard).

## Pages

- `app/(dashboard)/dashboard/properties/page.tsx` (replaces the stub):
  `requireRole(["admin"])`, `getProperties()`, renders a table with a
  "Nueva Propiedad" button linking to `/new`, each row linking to
  `/[id]/edit`, and a delete control per row (client-side confirm, calls
  the `deleteProperty` action).
- `app/(dashboard)/dashboard/properties/new/page.tsx`: `requireRole(["admin"])`,
  renders `<PropertyForm mode="create" action={createProperty} />`.
- `app/(dashboard)/dashboard/properties/[id]/edit/page.tsx`:
  `requireRole(["admin"])`, `getProperty(id)` (404-equivalent — call
  Next's `notFound()` — if missing), renders
  `<PropertyForm mode="edit" property={property} action={updateProperty.bind(null, id)} />`.

## Form component

`components/dashboard/property-form.tsx` (Client Component):

- Uses React 19's `useActionState` bound to the passed Server Action for
  submit/pending/error state.
- Plain text/number inputs for title, description, price, currency,
  location, tag, bedrooms, bathrooms, areaM2 — styled with the existing
  underline-input pattern (`border-b`, `focus-visible:border-accent`)
  already used in `login-form.tsx` and `cta-footer.tsx`.
- `status`: a `<select>` with the three enum values.
- `features`: tag input — text field + Enter-to-add, chips with an ×
  remove button, backed by local `useState<string[]>`, submitted as
  repeated hidden inputs or a joined value the action re-splits (exact
  serialization is an implementation-plan detail, not a design
  decision).
- `images`: repeatable URL input rows with add/remove buttons, same
  serialization approach as `features`.
- Displays field-level errors from `useActionState`'s error state next to
  each input.

## Testing

- **Unit-tested**: `validatePropertyInput` — every rule above gets a test
  case (valid input passes; each required-field-missing case fails with
  the right error key; price/areaM2 boundary cases; bedrooms/bathrooms
  negative/non-integer cases; images empty-array case; status enum
  rejection case).
- **Manually verified** (no Firestore emulator in this project — real
  `domus-e117e` project, same practical approach as the Foundation): as
  an admin, create a property, confirm it appears in the list; edit it,
  confirm changes persist; delete it, confirm it's gone from the list and
  Firestore; attempt to reach any of the three properties routes as a
  `sales`-role session, confirm redirect to `/dashboard/pipeline` (RBAC
  regression check — this sub-project must not weaken sub-project 1's
  guarantees).
