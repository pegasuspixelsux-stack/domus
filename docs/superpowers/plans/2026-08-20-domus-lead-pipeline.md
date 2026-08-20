# Domus Lead Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/dashboard/pipeline` stub with a Kanban board for tracking leads through a 7-stage sales pipeline, with per-role visibility (sales sees only their own leads, admin sees all), activity logging, and admin-only reassignment.

**Architecture:** A Client Component board (`@dnd-kit/core`) receives its initial leads from a Server Component page and holds them in local state for optimistic drag-and-drop; every mutation goes through a Server Action that independently re-checks role and lead ownership, never trusting the UI. Lead detail and creation are modals, not pages, to preserve the board's scroll/state.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind CSS v4, `firebase-admin`, `@dnd-kit/core` (new), Vitest.

**Spec:** `docs/superpowers/specs/2026-08-20-domus-lead-pipeline-design.md`

## Global Constraints

- `LeadStatus` is exactly `"new" | "contacted" | "qualified" | "visit_scheduled" | "negotiation" | "won" | "lost"`, in that column order.
- Sales staff see and manage only leads where `assignedTo === session.uid`; Admin sees/manages all. Enforced both in the data-fetch query AND independently inside every mutation.
- `reassignLead` is Admin-only; `createLead`, `updateLeadStatus`, `addActivity` are usable by both roles (subject to the ownership check above).
- New leads always start at `status: "new"` and `assignedTo: session.uid`, regardless of who creates them.
- `updateLeadStatus` must also write a `status_change` activity documenting the transition.
- Activities are manual log entries only — no WhatsApp/telephony API integration.
- UI copy is in Spanish, matching the rest of the dashboard.
- Reuse existing design tokens/components: underline inputs, uppercase-tracked labels, `@/components/ui/button`'s `Button`.
- Path alias `@/*` maps to the repo root.
- All Firestore access goes through `getFirebaseAdminFirestore()` — never the client Firestore SDK.

---

### Task 1: Lead types and validation

**Files:**
- Create: `lib/leads/types.ts`
- Create: `lib/leads/validation.ts`
- Test: `lib/leads/validation.test.ts`

**Interfaces:**
- Produces:
  - `type LeadStatus = "new" | "contacted" | "qualified" | "visit_scheduled" | "negotiation" | "won" | "lost"`
  - `interface Lead { id, name, email, phone, source, status: LeadStatus, assignedTo, propertyId?: string, createdAt: string, updatedAt: string }`
  - `interface LeadInput { name, email, phone, source }`
  - `type ActivityType = "call" | "whatsapp" | "email" | "note" | "status_change"`
  - `interface Activity { id, type: ActivityType, note, createdAt: string, createdBy }`
  - `type LeadValidationErrors = Partial<Record<keyof LeadInput, string>>`
  - `type LeadValidationResult = { valid: true; data: LeadInput } | { valid: false; errors: LeadValidationErrors }`
  - `validateLeadInput(input): LeadValidationResult`

- [ ] **Step 1: Create the types file**

Create `lib/leads/types.ts`:

```ts
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "visit_scheduled"
  | "negotiation"
  | "won"
  | "lost";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  assignedTo: string;
  propertyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadInput {
  name: string;
  email: string;
  phone: string;
  source: string;
}

export type ActivityType = "call" | "whatsapp" | "email" | "note" | "status_change";

export interface Activity {
  id: string;
  type: ActivityType;
  note: string;
  createdAt: string;
  createdBy: string;
}
```

- [ ] **Step 2: Write the failing validation tests**

Create `lib/leads/validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validateLeadInput } from "./validation";

function validInput() {
  return {
    name: "Marcela Ibarra",
    email: "marcela@example.com",
    phone: "+598 99 123 456",
    source: "Instagram",
  };
}

describe("validateLeadInput", () => {
  it("accepts valid input and trims fields", () => {
    const result = validateLeadInput({ ...validInput(), name: "  Marcela Ibarra  " });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.name).toBe("Marcela Ibarra");
    }
  });

  it("rejects an empty name", () => {
    const result = validateLeadInput({ ...validInput(), name: "   " });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.name).toBeDefined();
  });

  it("rejects an empty email", () => {
    const result = validateLeadInput({ ...validInput(), email: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.email).toBeDefined();
  });

  it("rejects a malformed email (no @)", () => {
    const result = validateLeadInput({ ...validInput(), email: "notanemail" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.email).toBeDefined();
  });

  it("rejects a malformed email (no domain)", () => {
    const result = validateLeadInput({ ...validInput(), email: "user@" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.email).toBeDefined();
  });

  it("rejects a malformed email (no TLD)", () => {
    const result = validateLeadInput({ ...validInput(), email: "user@example" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.email).toBeDefined();
  });

  it("accepts a valid email with a subdomain and plus-tag", () => {
    const result = validateLeadInput({ ...validInput(), email: "user.name+tag@mail.example.co.uk" });
    expect(result.valid).toBe(true);
  });

  it("rejects an empty phone", () => {
    const result = validateLeadInput({ ...validInput(), phone: "  " });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.phone).toBeDefined();
  });

  it("rejects an empty source", () => {
    const result = validateLeadInput({ ...validInput(), source: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.source).toBeDefined();
  });

  it("reports all four errors at once when everything is empty", () => {
    const result = validateLeadInput({ name: "", email: "", phone: "", source: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(Object.keys(result.errors)).toHaveLength(4);
    }
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- lib/leads/validation.test.ts`
Expected: FAIL — `Cannot find module './validation'`.

- [ ] **Step 4: Implement validation.ts**

Create `lib/leads/validation.ts`:

```ts
import type { LeadInput } from "./types";

export type LeadValidationErrors = Partial<Record<keyof LeadInput, string>>;

export type LeadValidationResult =
  | { valid: true; data: LeadInput }
  | { valid: false; errors: LeadValidationErrors };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLeadInput(input: {
  name: string;
  email: string;
  phone: string;
  source: string;
}): LeadValidationResult {
  const errors: LeadValidationErrors = {};

  if (!input.name.trim()) errors.name = "El nombre es obligatorio.";

  if (!input.email.trim()) {
    errors.email = "El correo electrónico es obligatorio.";
  } else if (!EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = "Ingrese un correo electrónico válido.";
  }

  if (!input.phone.trim()) errors.phone = "El teléfono es obligatorio.";
  if (!input.source.trim()) errors.source = "El origen es obligatorio.";

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      source: input.source.trim(),
    },
  };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- lib/leads/validation.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/leads/types.ts lib/leads/validation.ts lib/leads/validation.test.ts
git commit -m "feat: add lead types and validation"
```

---

### Task 2: Data access layer

**Files:**
- Create: `lib/leads/data.ts`
- Create: `lib/team/data.ts`

**Interfaces:**
- Consumes: `getFirebaseAdminFirestore` from `@/lib/firebase/admin`; `Session` from `@/lib/auth/session-core`; `Role` from `@/lib/auth/rbac`; `Lead`, `Activity` from `./types`
- Produces:
  - `getLeads(session: Session): Promise<Lead[]>`
  - `getLead(id: string): Promise<Lead | null>`
  - `getActivities(leadId: string): Promise<Activity[]>`
  - `interface TeamMember { uid: string; displayName: string; role: Role }`
  - `getTeamMembers(): Promise<TeamMember[]>`

No unit tests for this task — thin Admin SDK wrappers, same category as the Foundation's `lib/firebase/admin.ts` and Property Manager's `lib/properties/data.ts`. Verified via `tsc --noEmit`.

- [ ] **Step 1: Implement leads data.ts**

Create `lib/leads/data.ts`:

```ts
import type { DocumentData, Query } from "firebase-admin/firestore";
import type { Session } from "@/lib/auth/session-core";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { Activity, Lead } from "./types";

const COLLECTION = "leads";

function toLead(id: string, data: DocumentData): Lead {
  return {
    id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    source: data.source,
    status: data.status,
    assignedTo: data.assignedTo,
    propertyId: data.propertyId ?? undefined,
    createdAt: data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.().toISOString() ?? new Date().toISOString(),
  };
}

export async function getLeads(session: Session): Promise<Lead[]> {
  const firestore = getFirebaseAdminFirestore();
  let query: Query = firestore.collection(COLLECTION);

  if (session.role === "sales") {
    query = query.where("assignedTo", "==", session.uid);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => toLead(doc.id, doc.data()));
}

export async function getLead(id: string): Promise<Lead | null> {
  const doc = await getFirebaseAdminFirestore().collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return toLead(doc.id, doc.data()!);
}

function toActivity(id: string, data: DocumentData): Activity {
  return {
    id,
    type: data.type,
    note: data.note,
    createdAt: data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
    createdBy: data.createdBy,
  };
}

export async function getActivities(leadId: string): Promise<Activity[]> {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(COLLECTION)
    .doc(leadId)
    .collection("activities")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => toActivity(doc.id, doc.data()));
}
```

- [ ] **Step 2: Implement team data.ts**

Create `lib/team/data.ts`:

```ts
import type { DocumentData } from "firebase-admin/firestore";
import type { Role } from "@/lib/auth/rbac";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

export interface TeamMember {
  uid: string;
  displayName: string;
  role: Role;
}

function toTeamMember(uid: string, data: DocumentData): TeamMember {
  return {
    uid,
    displayName: data.displayName || data.email || uid,
    role: data.role,
  };
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const snapshot = await getFirebaseAdminFirestore().collection("users").get();
  return snapshot.docs.map((doc) => toTeamMember(doc.id, doc.data()));
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/leads/data.ts lib/team/data.ts
git commit -m "feat: add lead and team data access layers"
```

---

### Task 3: Server Actions

**Files:**
- Create: `lib/leads/actions.ts`

**Interfaces:**
- Consumes: `requireRole` from `@/lib/auth/require-role`; `getFirebaseAdminFirestore` from `@/lib/firebase/admin`; `validateLeadInput` from `./validation`; `getActivities` from `./data`
- Produces:
  - `interface LeadActionState { errors?: Record<string, string>; success?: boolean }`
  - `createLead(prevState: LeadActionState, formData: FormData): Promise<LeadActionState>`
  - `updateLeadStatus(leadId: string, newStatus: LeadStatus): Promise<void>`
  - `addActivity(leadId: string, type: ActivityType, note: string): Promise<void>`
  - `reassignLead(leadId: string, newAssigneeUid: string): Promise<void>`
  - `fetchLeadActivities(leadId: string): Promise<Activity[]>`

No unit tests for this task — Server Actions are framework glue (Firestore writes, ownership checks against live data), verified via `tsc --noEmit` and manually in Task 8. The validation and ownership logic they call is either already tested (`validateLeadInput`) or is a straightforward equality check inline.

- [ ] **Step 1: Implement actions.ts**

Create `lib/leads/actions.ts`:

```ts
"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getActivities } from "./data";
import { validateLeadInput } from "./validation";
import type { Activity, ActivityType, LeadStatus } from "./types";

const COLLECTION = "leads";

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Calificado",
  visit_scheduled: "Visita Agendada",
  negotiation: "Negociación",
  won: "Ganado",
  lost: "Perdido",
};

export interface LeadActionState {
  errors?: Record<string, string>;
  success?: boolean;
}

function extractInput(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    source: String(formData.get("source") ?? ""),
  };
}

export async function createLead(
  _prevState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  const session = await requireRole(["admin", "sales"]);
  const result = validateLeadInput(extractInput(formData));

  if (!result.valid) {
    return { errors: result.errors };
  }

  await getFirebaseAdminFirestore()
    .collection(COLLECTION)
    .add({
      ...result.data,
      status: "new",
      assignedTo: session.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

  revalidatePath("/dashboard/pipeline");
  return { success: true };
}

async function assertCanManageLead(leadId: string) {
  const session = await requireRole(["admin", "sales"]);
  const firestore = getFirebaseAdminFirestore();
  const doc = await firestore.collection(COLLECTION).doc(leadId).get();

  if (!doc.exists) {
    throw new Error("lead-not-found");
  }

  const data = doc.data()!;
  if (session.role === "sales" && data.assignedTo !== session.uid) {
    throw new Error("not-authorized");
  }

  return { session, firestore, data };
}

export async function updateLeadStatus(leadId: string, newStatus: LeadStatus): Promise<void> {
  const { session, firestore, data } = await assertCanManageLead(leadId);

  const leadRef = firestore.collection(COLLECTION).doc(leadId);
  await leadRef.update({
    status: newStatus,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await leadRef.collection("activities").add({
    type: "status_change" as ActivityType,
    note: `${STATUS_LABELS[data.status as LeadStatus]} → ${STATUS_LABELS[newStatus]}`,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: session.uid,
  });

  revalidatePath("/dashboard/pipeline");
}

export async function addActivity(
  leadId: string,
  type: ActivityType,
  note: string,
): Promise<void> {
  const { session, firestore } = await assertCanManageLead(leadId);

  await firestore
    .collection(COLLECTION)
    .doc(leadId)
    .collection("activities")
    .add({
      type,
      note,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: session.uid,
    });

  revalidatePath("/dashboard/pipeline");
}

export async function reassignLead(leadId: string, newAssigneeUid: string): Promise<void> {
  await requireRole(["admin"]);

  await getFirebaseAdminFirestore()
    .collection(COLLECTION)
    .doc(leadId)
    .update({
      assignedTo: newAssigneeUid,
      updatedAt: FieldValue.serverTimestamp(),
    });

  revalidatePath("/dashboard/pipeline");
}

export async function fetchLeadActivities(leadId: string): Promise<Activity[]> {
  await requireRole(["admin", "sales"]);
  return getActivities(leadId);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/leads/actions.ts
git commit -m "feat: add lead Server Actions"
```

---

### Task 4: Install @dnd-kit/core and the lead card component

**Files:**
- Modify: `package.json`, `package-lock.json` (via install)
- Create: `components/dashboard/lead-card.tsx`

**Interfaces:**
- Consumes: `useDraggable` from `@dnd-kit/core`; `Lead` from `@/lib/leads/types`
- Produces: `LeadCard({ lead: Lead; onClick: () => void })` (named export)

- [ ] **Step 1: Install the dependency**

Run: `npm install @dnd-kit/core --no-audit --no-fund`

- [ ] **Step 2: Implement the lead card**

Create `components/dashboard/lead-card.tsx`:

```tsx
"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Lead } from "@/lib/leads/types";

export function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`cursor-grab border border-foreground/10 bg-background p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-shadow duration-500 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <h3 className="font-serif text-lg">{lead.name}</h3>
      <p className="mt-1 text-xs tracking-[0.15em] text-muted-foreground uppercase">{lead.source}</p>
      <p className="mt-2 text-sm text-muted-foreground">{lead.phone}</p>
    </div>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json components/dashboard/lead-card.tsx
git commit -m "feat: add dnd-kit and the draggable lead card"
```

---

### Task 5: New lead modal

**Files:**
- Create: `components/dashboard/new-lead-modal.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button`; `createLead`, `LeadActionState` from `@/lib/leads/actions`
- Produces: `NewLeadModal({ onClose: () => void })` (named export)

- [ ] **Step 1: Implement the modal**

Create `components/dashboard/new-lead-modal.tsx`:

```tsx
"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createLead } from "@/lib/leads/actions";

export function NewLeadModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createLead, {});

  useEffect(() => {
    if (state.success) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-8">
      <div className="w-full max-w-md bg-background p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-2xl">Nuevo Lead</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-accent"
          >
            Cerrar
          </button>
        </div>

        <form action={formAction} className="flex flex-col gap-6">
          <Field label="Nombre" name="name" error={state.errors?.name} />
          <Field label="Correo Electrónico" name="email" type="email" error={state.errors?.email} />
          <Field label="Teléfono" name="phone" error={state.errors?.phone} />
          <Field label="Origen" name="source" error={state.errors?.source} />

          <Button type="submit" variant="primary" disabled={pending} className="w-full">
            {pending ? "Guardando…" : "Crear Lead"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  error,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/new-lead-modal.tsx
git commit -m "feat: add new lead modal"
```

---

### Task 6: Lead detail modal

**Files:**
- Create: `components/dashboard/lead-detail-modal.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button`; `Role` from `@/lib/auth/rbac`; `addActivity`, `fetchLeadActivities`, `reassignLead`, `updateLeadStatus` from `@/lib/leads/actions`; `Activity`, `ActivityType`, `Lead`, `LeadStatus` from `@/lib/leads/types`; `TeamMember` from `@/lib/team/data`
- Produces: `LeadDetailModal({ lead: Lead; teamMembers: TeamMember[]; currentRole: Role; onClose: () => void })` (named export)

- [ ] **Step 1: Implement the modal**

Create `components/dashboard/lead-detail-modal.tsx`:

```tsx
"use client";

import { type FormEvent, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/auth/rbac";
import { addActivity, fetchLeadActivities, reassignLead, updateLeadStatus } from "@/lib/leads/actions";
import type { Activity, ActivityType, Lead, LeadStatus } from "@/lib/leads/types";
import type { TeamMember } from "@/lib/team/data";

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "Nuevo" },
  { value: "contacted", label: "Contactado" },
  { value: "qualified", label: "Calificado" },
  { value: "visit_scheduled", label: "Visita Agendada" },
  { value: "negotiation", label: "Negociación" },
  { value: "won", label: "Ganado" },
  { value: "lost", label: "Perdido" },
];

const ACTIVITY_TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: "call", label: "Llamada" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Correo" },
  { value: "note", label: "Nota" },
];

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: "Llamada",
  whatsapp: "WhatsApp",
  email: "Correo",
  note: "Nota",
  status_change: "Cambio de Estado",
};

export function LeadDetailModal({
  lead,
  teamMembers,
  currentRole,
  onClose,
}: {
  lead: Lead;
  teamMembers: TeamMember[];
  currentRole: Role;
  onClose: () => void;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [status, setStatus] = useState(lead.status);
  const [assignedTo, setAssignedTo] = useState(lead.assignedTo);
  const [newActivityType, setNewActivityType] = useState<ActivityType>("call");
  const [newActivityNote, setNewActivityNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingActivities(true);
    fetchLeadActivities(lead.id).then((result) => {
      if (!cancelled) {
        setActivities(result);
        setLoadingActivities(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lead.id]);

  function handleStatusChange(newStatus: LeadStatus) {
    const previous = status;
    setStatus(newStatus);
    setError(null);
    startTransition(async () => {
      try {
        await updateLeadStatus(lead.id, newStatus);
      } catch {
        setStatus(previous);
        setError("No se pudo actualizar el estado.");
      }
    });
  }

  function handleReassign(newAssignee: string) {
    const previous = assignedTo;
    setAssignedTo(newAssignee);
    setError(null);
    startTransition(async () => {
      try {
        await reassignLead(lead.id, newAssignee);
      } catch {
        setAssignedTo(previous);
        setError("No se pudo reasignar el lead.");
      }
    });
  }

  function handleAddActivity(event: FormEvent) {
    event.preventDefault();
    if (!newActivityNote.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await addActivity(lead.id, newActivityType, newActivityNote.trim());
        const fresh = await fetchLeadActivities(lead.id);
        setActivities(fresh);
        setNewActivityNote("");
      } catch {
        setError("No se pudo agregar la actividad.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-8">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-6 overflow-y-auto bg-background p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-2xl">{lead.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {lead.email} · {lead.phone}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-accent"
          >
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Estado</label>
            <select
              value={status}
              onChange={(event) => handleStatusChange(event.target.value as LeadStatus)}
              className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {currentRole === "admin" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Asignado a</label>
              <select
                value={assignedTo}
                onChange={(event) => handleReassign(event.target.value)}
                className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
              >
                {teamMembers.map((member) => (
                  <option key={member.uid} value={member.uid}>
                    {member.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <h3 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Actividad</h3>
          {loadingActivities ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {activities.map((activity) => (
                <li key={activity.id} className="border-l border-foreground/20 pl-4">
                  <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase">
                    {ACTIVITY_TYPE_LABELS[activity.type]} ·{" "}
                    {new Date(activity.createdAt).toLocaleString("es-UY")}
                  </p>
                  <p className="mt-1 text-sm">{activity.note}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={handleAddActivity} className="flex flex-col gap-3 border-t border-foreground/10 pt-6">
          <h3 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Agregar Actividad</h3>
          <select
            value={newActivityType}
            onChange={(event) => setNewActivityType(event.target.value as ActivityType)}
            className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
          >
            {ACTIVITY_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <textarea
            value={newActivityNote}
            onChange={(event) => setNewActivityNote(event.target.value)}
            rows={3}
            placeholder="Ej: Llamé al cliente, interesado en visitar el próximo fin de semana."
            className="w-full border-b border-foreground/40 bg-transparent px-0 py-2 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
          />
          <Button type="submit" variant="secondary" disabled={pending} className="self-start">
            {pending ? "Guardando…" : "Agregar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/lead-detail-modal.tsx
git commit -m "feat: add lead detail modal"
```

---

### Task 7: Pipeline board and page (replaces the stub)

**Files:**
- Create: `components/dashboard/pipeline-board.tsx`
- Modify: `app/(dashboard)/dashboard/pipeline/page.tsx` (replace the entire stub content)

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button`; `Role` from `@/lib/auth/rbac`; `requireRole` from `@/lib/auth/require-role`; `updateLeadStatus` from `@/lib/leads/actions`; `getLeads` from `@/lib/leads/data`; `Lead`, `LeadStatus` from `@/lib/leads/types`; `getTeamMembers`, `TeamMember` from `@/lib/team/data`; `LeadCard` from `./lead-card`; `LeadDetailModal` from `./lead-detail-modal`; `NewLeadModal` from `./new-lead-modal`
- Produces: `PipelineBoard({ leads: Lead[]; teamMembers: TeamMember[]; currentRole: Role })` (named export)

- [ ] **Step 1: Implement the board**

Create `components/dashboard/pipeline-board.tsx`:

```tsx
"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/auth/rbac";
import { updateLeadStatus } from "@/lib/leads/actions";
import type { Lead, LeadStatus } from "@/lib/leads/types";
import type { TeamMember } from "@/lib/team/data";
import { LeadCard } from "./lead-card";
import { LeadDetailModal } from "./lead-detail-modal";
import { NewLeadModal } from "./new-lead-modal";

const COLUMNS: { status: LeadStatus; label: string }[] = [
  { status: "new", label: "Nuevo" },
  { status: "contacted", label: "Contactado" },
  { status: "qualified", label: "Calificado" },
  { status: "visit_scheduled", label: "Visita Agendada" },
  { status: "negotiation", label: "Negociación" },
  { status: "won", label: "Ganado" },
  { status: "lost", label: "Perdido" },
];

function Column({
  status,
  label,
  leads,
  onCardClick,
}: {
  status: LeadStatus;
  label: string;
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col gap-3 border-t-4 p-3 transition-colors duration-500 ${
        isOver ? "border-t-accent bg-muted-background/50" : "border-t-foreground/20"
      }`}
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">{label}</h2>
        <span className="text-xs text-muted-foreground">{leads.length}</span>
      </div>
      <div className="flex flex-col gap-3">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onClick={() => onCardClick(lead)} />
        ))}
      </div>
    </div>
  );
}

export function PipelineBoard({
  leads: initialLeads,
  teamMembers,
  currentRole,
}: {
  leads: Lead[];
  teamMembers: TeamMember[];
  currentRole: Role;
}) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [creating, setCreating] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const leadId = String(active.id);
    const newStatus = over.id as LeadStatus;
    const lead = leads.find((entry) => entry.id === leadId);
    if (!lead || lead.status === newStatus) return;

    const previousStatus = lead.status;
    setLeads((current) => current.map((entry) => (entry.id === leadId ? { ...entry, status: newStatus } : entry)));

    try {
      await updateLeadStatus(leadId, newStatus);
      router.refresh();
    } catch {
      setLeads((current) =>
        current.map((entry) => (entry.id === leadId ? { ...entry, status: previousStatus } : entry)),
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Pipeline de Leads</h1>
        <Button variant="primary" onClick={() => setCreating(true)}>
          Nuevo Lead
        </Button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <Column
              key={column.status}
              status={column.status}
              label={column.label}
              leads={leads.filter((lead) => lead.status === column.status)}
              onCardClick={setSelectedLead}
            />
          ))}
        </div>
      </DndContext>

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          teamMembers={teamMembers}
          currentRole={currentRole}
          onClose={() => {
            setSelectedLead(null);
            router.refresh();
          }}
        />
      )}

      {creating && (
        <NewLeadModal
          onClose={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace the pipeline page**

Replace the full contents of `app/(dashboard)/dashboard/pipeline/page.tsx` with:

```tsx
import { PipelineBoard } from "@/components/dashboard/pipeline-board";
import { requireRole } from "@/lib/auth/require-role";
import { getLeads } from "@/lib/leads/data";
import { getTeamMembers } from "@/lib/team/data";

export default async function PipelinePage() {
  const session = await requireRole(["admin", "sales"]);
  const [leads, teamMembers] = await Promise.all([getLeads(session), getTeamMembers()]);

  return <PipelineBoard leads={leads} teamMembers={teamMembers} currentRole={session.role} />;
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/pipeline-board.tsx "app/(dashboard)/dashboard/pipeline/page.tsx"
git commit -m "feat: replace pipeline stub with Kanban board"
```

---

### Task 8: Full verification pass and manual checklist

**Files:** none (verification only).

- [ ] **Step 1: Run the full automated check suite**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all four pass with no errors.

- [ ] **Step 2: Manual verification — admin flow**

Using an existing admin account:

1. Visit `/dashboard/pipeline` — confirm all 7 columns render (Nuevo, Contactado, Calificado, Visita Agendada, Negociación, Ganado, Perdido).
2. Click "Nuevo Lead", fill in the form, submit. Confirm the modal closes and the new card appears in "Nuevo", assigned to the admin.
3. Try submitting with an empty name — confirm the Spanish error appears and the lead isn't created.
4. Drag a card from "Nuevo" to "Contactado". Confirm it visually moves immediately, and after a page reload the status persisted.
5. Open the card that was just moved — confirm a "Cambio de Estado" activity is in the timeline documenting "Nuevo → Contactado".
6. Add a manual activity (type "Llamada", a note). Confirm it appears at the top of the timeline.
7. Use the "Asignado a" dropdown to reassign the lead to a different team member. Confirm it updates (may need a second admin/sales account to see the reassignment take visible effect on that account's board).

- [ ] **Step 3: Manual verification — sales flow and RBAC**

Log in as a `sales`-role account:

1. Confirm the board shows only leads assigned to this account (create a lead as admin assigned to someone else, confirm it does NOT appear here).
2. Confirm there is no "Asignado a" dropdown in the lead detail modal (reassignment is admin-only).
3. Create a lead as this sales user — confirm it's assigned to them and appears on their board.
4. Drag one of their own cards between columns — confirm it works.
5. Visit `/dashboard/properties` and `/dashboard/users` directly by URL — confirm both still redirect to `/dashboard/pipeline` (RBAC regression check from the Foundation sub-project).

- [ ] **Step 4: Push the branch**

```bash
git push
```

(Only after the user confirms the manual checks above pass.)
