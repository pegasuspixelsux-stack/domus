# Domus Property Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/dashboard/properties` stub with full admin CRUD on the `properties` Firestore collection — list, create, edit, delete — built on the Foundation sub-project's auth/RBAC infrastructure.

**Architecture:** Server Actions handle all mutations (create/update/delete), each independently re-checking `requireRole(["admin"])` before touching Firestore. All reads go through the Admin SDK in Server Components — no client Firestore SDK, consistent with the Foundation. A single `PropertyForm` Client Component (React 19 `useActionState`) serves both create and edit.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind CSS v4, `firebase-admin`, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-20-domus-property-manager-design.md`

## Global Constraints

- Property `status` is exactly `"available" | "reserved" | "sold"`.
- Delete is a hard delete (Firestore doc removal), gated by a client-side `window.confirm`, no soft-delete/archive state.
- Images are URL-string fields only — no file upload in this phase.
- Every mutation (`createProperty`, `updateProperty`, `deleteProperty`) must call `requireRole(["admin"])` itself — never rely solely on the page-level guard.
- All Firestore access goes through `getFirebaseAdminFirestore()` (from `@/lib/firebase/admin`, built in the Foundation sub-project) — never the client Firestore SDK.
- UI copy is in Spanish, matching the rest of the dashboard.
- Reuse existing design tokens/components: the underline-input pattern (`border-b border-foreground/40 focus-visible:border-accent`), uppercase-tracked labels (`text-xs uppercase tracking-[0.2em] text-muted-foreground`), and `@/components/ui/button`'s `Button`.
- Path alias `@/*` maps to the repo root.
- This sub-project does not modify `components/sections/showcase.tsx` (the public marketing site) — that integration is a later sub-project.

---

### Task 1: Property types and validation

**Files:**
- Create: `lib/properties/types.ts`
- Create: `lib/properties/validation.ts`
- Test: `lib/properties/validation.test.ts`

**Interfaces:**
- Produces:
  - `type PropertyStatus = "available" | "reserved" | "sold"`
  - `interface Property { id, title, description, price, currency, location, tag, status, images: string[], features: string[], bedrooms, bathrooms, areaM2, createdAt: string, updatedAt: string, createdBy }`
  - `interface PropertyInput { title, description, price, currency, location, tag, status, images: string[], features: string[], bedrooms, bathrooms, areaM2 }` (same shape as `Property` minus `id`/`createdAt`/`updatedAt`/`createdBy`)
  - `type PropertyValidationErrors = Partial<Record<keyof PropertyInput, string>>`
  - `type PropertyValidationResult = { valid: true; data: PropertyInput } | { valid: false; errors: PropertyValidationErrors }`
  - `validatePropertyInput(input): PropertyValidationResult`

- [ ] **Step 1: Create the types file**

Create `lib/properties/types.ts`:

```ts
export type PropertyStatus = "available" | "reserved" | "sold";

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  tag: string;
  status: PropertyStatus;
  images: string[];
  features: string[];
  bedrooms: number;
  bathrooms: number;
  areaM2: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface PropertyInput {
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  tag: string;
  status: PropertyStatus;
  images: string[];
  features: string[];
  bedrooms: number;
  bathrooms: number;
  areaM2: number;
}
```

- [ ] **Step 2: Write the failing validation tests**

Create `lib/properties/validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validatePropertyInput } from "./validation";

function validInput() {
  return {
    title: "Residencia La Barra",
    description: "Una hermosa residencia frente al mar.",
    price: 450000,
    currency: "USD",
    location: "La Barra",
    tag: "Frente al Mar",
    status: "available",
    images: ["https://example.com/1.jpg"],
    features: ["Piscina", "Vista al mar"],
    bedrooms: 4,
    bathrooms: 3,
    areaM2: 320,
  };
}

describe("validatePropertyInput", () => {
  it("accepts valid input and trims/filters fields", () => {
    const result = validatePropertyInput({
      ...validInput(),
      title: "  Residencia La Barra  ",
      images: ["  https://example.com/1.jpg  ", "  "],
      features: ["Piscina", "  ", "Vista al mar"],
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.title).toBe("Residencia La Barra");
      expect(result.data.images).toEqual(["https://example.com/1.jpg"]);
      expect(result.data.features).toEqual(["Piscina", "Vista al mar"]);
    }
  });

  it("rejects an empty title", () => {
    const result = validatePropertyInput({ ...validInput(), title: "   " });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.title).toBeDefined();
  });

  it("rejects an empty description", () => {
    const result = validatePropertyInput({ ...validInput(), description: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.description).toBeDefined();
  });

  it("rejects a zero or negative price", () => {
    const result = validatePropertyInput({ ...validInput(), price: 0 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.price).toBeDefined();
  });

  it("rejects a non-finite price", () => {
    const result = validatePropertyInput({ ...validInput(), price: NaN });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.price).toBeDefined();
  });

  it("rejects an empty currency", () => {
    const result = validatePropertyInput({ ...validInput(), currency: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.currency).toBeDefined();
  });

  it("rejects an empty location", () => {
    const result = validatePropertyInput({ ...validInput(), location: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.location).toBeDefined();
  });

  it("rejects an empty tag", () => {
    const result = validatePropertyInput({ ...validInput(), tag: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.tag).toBeDefined();
  });

  it("rejects an invalid status", () => {
    const result = validatePropertyInput({ ...validInput(), status: "pending" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.status).toBeDefined();
  });

  it("rejects an empty images array", () => {
    const result = validatePropertyInput({ ...validInput(), images: [] });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.images).toBeDefined();
  });

  it("rejects images that are only whitespace", () => {
    const result = validatePropertyInput({ ...validInput(), images: ["   ", ""] });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.images).toBeDefined();
  });

  it("accepts an empty features array", () => {
    const result = validatePropertyInput({ ...validInput(), features: [] });
    expect(result.valid).toBe(true);
  });

  it("rejects negative bedrooms", () => {
    const result = validatePropertyInput({ ...validInput(), bedrooms: -1 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.bedrooms).toBeDefined();
  });

  it("rejects non-integer bedrooms", () => {
    const result = validatePropertyInput({ ...validInput(), bedrooms: 2.5 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.bedrooms).toBeDefined();
  });

  it("rejects negative bathrooms", () => {
    const result = validatePropertyInput({ ...validInput(), bathrooms: -1 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.bathrooms).toBeDefined();
  });

  it("rejects non-integer bathrooms", () => {
    const result = validatePropertyInput({ ...validInput(), bathrooms: 1.5 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.bathrooms).toBeDefined();
  });

  it("accepts zero bedrooms and bathrooms", () => {
    const result = validatePropertyInput({ ...validInput(), bedrooms: 0, bathrooms: 0 });
    expect(result.valid).toBe(true);
  });

  it("rejects a zero or negative areaM2", () => {
    const result = validatePropertyInput({ ...validInput(), areaM2: 0 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.areaM2).toBeDefined();
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- lib/properties/validation.test.ts`
Expected: FAIL — `Cannot find module './validation'`.

- [ ] **Step 4: Implement validation.ts**

Create `lib/properties/validation.ts`:

```ts
import type { PropertyInput, PropertyStatus } from "./types";

const STATUSES: PropertyStatus[] = ["available", "reserved", "sold"];

export type PropertyValidationErrors = Partial<Record<keyof PropertyInput, string>>;

export type PropertyValidationResult =
  | { valid: true; data: PropertyInput }
  | { valid: false; errors: PropertyValidationErrors };

export function validatePropertyInput(input: {
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  tag: string;
  status: string;
  images: string[];
  features: string[];
  bedrooms: number;
  bathrooms: number;
  areaM2: number;
}): PropertyValidationResult {
  const errors: PropertyValidationErrors = {};

  if (!input.title.trim()) errors.title = "El título es obligatorio.";
  if (!input.description.trim()) errors.description = "La descripción es obligatoria.";
  if (!Number.isFinite(input.price) || input.price <= 0) {
    errors.price = "El precio debe ser un número mayor a cero.";
  }
  if (!input.currency.trim()) errors.currency = "La moneda es obligatoria.";
  if (!input.location.trim()) errors.location = "La ubicación es obligatoria.";
  if (!input.tag.trim()) errors.tag = "La etiqueta es obligatoria.";
  if (!STATUSES.includes(input.status as PropertyStatus)) {
    errors.status = "El estado no es válido.";
  }
  if (!input.images.some((url) => url.trim())) {
    errors.images = "Agregue al menos una imagen.";
  }
  if (!Number.isInteger(input.bedrooms) || input.bedrooms < 0) {
    errors.bedrooms = "Los dormitorios deben ser un número entero mayor o igual a cero.";
  }
  if (!Number.isInteger(input.bathrooms) || input.bathrooms < 0) {
    errors.bathrooms = "Los baños deben ser un número entero mayor o igual a cero.";
  }
  if (!Number.isFinite(input.areaM2) || input.areaM2 <= 0) {
    errors.areaM2 = "La superficie debe ser un número mayor a cero.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      price: input.price,
      currency: input.currency.trim(),
      location: input.location.trim(),
      tag: input.tag.trim(),
      status: input.status as PropertyStatus,
      images: input.images.map((url) => url.trim()).filter(Boolean),
      features: input.features.map((f) => f.trim()).filter(Boolean),
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      areaM2: input.areaM2,
    },
  };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- lib/properties/validation.test.ts`
Expected: PASS (18 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/properties/types.ts lib/properties/validation.ts lib/properties/validation.test.ts
git commit -m "feat: add property types and validation"
```

---

### Task 2: Data access layer

**Files:**
- Create: `lib/properties/data.ts`

**Interfaces:**
- Consumes: `getFirebaseAdminFirestore` from `@/lib/firebase/admin`; `Property` from `./types`
- Produces: `getProperties(): Promise<Property[]>`, `getProperty(id: string): Promise<Property | null>`

This task has no unit tests — it's a thin Admin SDK wrapper, same category as the Foundation's `lib/firebase/admin.ts` glue. Verified via `tsc --noEmit` and manually once real data exists (Task 7).

- [ ] **Step 1: Implement data.ts**

Create `lib/properties/data.ts`:

```ts
import type { DocumentData } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { Property } from "./types";

const COLLECTION = "properties";

function toProperty(id: string, data: DocumentData): Property {
  return {
    id,
    title: data.title,
    description: data.description,
    price: data.price,
    currency: data.currency,
    location: data.location,
    tag: data.tag,
    status: data.status,
    images: data.images ?? [],
    features: data.features ?? [],
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    areaM2: data.areaM2,
    createdAt: data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.().toISOString() ?? new Date().toISOString(),
    createdBy: data.createdBy,
  };
}

export async function getProperties(): Promise<Property[]> {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(COLLECTION)
    .orderBy("updatedAt", "desc")
    .get();
  return snapshot.docs.map((doc) => toProperty(doc.id, doc.data()));
}

export async function getProperty(id: string): Promise<Property | null> {
  const doc = await getFirebaseAdminFirestore().collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return toProperty(doc.id, doc.data()!);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/properties/data.ts
git commit -m "feat: add property data access layer"
```

---

### Task 3: Server Actions

**Files:**
- Create: `lib/properties/actions.ts`

**Interfaces:**
- Consumes: `requireRole` from `@/lib/auth/require-role`; `getFirebaseAdminFirestore` from `@/lib/firebase/admin`; `validatePropertyInput` from `./validation`
- Produces:
  - `interface PropertyActionState { errors?: Record<string, string> }`
  - `createProperty(prevState: PropertyActionState, formData: FormData): Promise<PropertyActionState>`
  - `updateProperty(id: string, prevState: PropertyActionState, formData: FormData): Promise<PropertyActionState>`
  - `deleteProperty(id: string): Promise<void>`

No unit tests for this task — Server Actions are framework glue (Firestore writes, `redirect()`), verified via `tsc --noEmit` and manually in Task 7. The validation logic they call is already fully tested in Task 1.

- [ ] **Step 1: Implement actions.ts**

Create `lib/properties/actions.ts`:

```ts
"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { validatePropertyInput } from "./validation";

const COLLECTION = "properties";

export interface PropertyActionState {
  errors?: Record<string, string>;
}

function extractInput(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: Number(formData.get("price")),
    currency: String(formData.get("currency") ?? ""),
    location: String(formData.get("location") ?? ""),
    tag: String(formData.get("tag") ?? ""),
    status: String(formData.get("status") ?? ""),
    images: formData.getAll("images").map(String),
    features: formData.getAll("features").map(String),
    bedrooms: Number(formData.get("bedrooms")),
    bathrooms: Number(formData.get("bathrooms")),
    areaM2: Number(formData.get("areaM2")),
  };
}

export async function createProperty(
  _prevState: PropertyActionState,
  formData: FormData,
): Promise<PropertyActionState> {
  const session = await requireRole(["admin"]);
  const result = validatePropertyInput(extractInput(formData));

  if (!result.valid) {
    return { errors: result.errors };
  }

  await getFirebaseAdminFirestore()
    .collection(COLLECTION)
    .add({
      ...result.data,
      createdBy: session.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}

export async function updateProperty(
  id: string,
  _prevState: PropertyActionState,
  formData: FormData,
): Promise<PropertyActionState> {
  await requireRole(["admin"]);
  const result = validatePropertyInput(extractInput(formData));

  if (!result.valid) {
    return { errors: result.errors };
  }

  await getFirebaseAdminFirestore()
    .collection(COLLECTION)
    .doc(id)
    .update({
      ...result.data,
      updatedAt: FieldValue.serverTimestamp(),
    });

  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}

export async function deleteProperty(id: string): Promise<void> {
  await requireRole(["admin"]);
  await getFirebaseAdminFirestore().collection(COLLECTION).doc(id).delete();
  revalidatePath("/dashboard/properties");
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/properties/actions.ts
git commit -m "feat: add property Server Actions"
```

---

### Task 4: Property form component

**Files:**
- Create: `components/dashboard/property-form.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button`; `Property`, `PropertyStatus` from `@/lib/properties/types`; `PropertyActionState` from `@/lib/properties/actions`
- Produces: `PropertyForm({ property?: Property; action: (prevState: PropertyActionState, formData: FormData) => Promise<PropertyActionState> })` (named export)

- [ ] **Step 1: Implement property-form.tsx**

Create `components/dashboard/property-form.tsx`:

```tsx
"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PropertyActionState } from "@/lib/properties/actions";
import type { Property, PropertyStatus } from "@/lib/properties/types";

const STATUS_OPTIONS: { value: PropertyStatus; label: string }[] = [
  { value: "available", label: "Disponible" },
  { value: "reserved", label: "Reservada" },
  { value: "sold", label: "Vendida" },
];

type PropertyFormAction = (
  prevState: PropertyActionState,
  formData: FormData,
) => Promise<PropertyActionState>;

export function PropertyForm({
  property,
  action,
}: {
  property?: Property;
  action: PropertyFormAction;
}) {
  const [state, formAction, pending] = useActionState<PropertyActionState, FormData>(action, {});
  const [features, setFeatures] = useState<string[]>(property?.features ?? []);
  const [featureInput, setFeatureInput] = useState("");
  const [images, setImages] = useState<string[]>(property?.images ?? [""]);

  function addFeature() {
    const value = featureInput.trim();
    if (value && !features.includes(value)) {
      setFeatures([...features, value]);
    }
    setFeatureInput("");
  }

  function removeFeature(value: string) {
    setFeatures(features.filter((f) => f !== value));
  }

  function updateImage(index: number, value: string) {
    setImages(images.map((img, i) => (i === index ? value : img)));
  }

  function addImageRow() {
    setImages([...images, ""]);
  }

  function removeImageRow(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <Field label="Título" name="title" defaultValue={property?.title} error={state.errors?.title} />

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={property?.description}
          className="w-full border-b border-foreground/40 bg-transparent px-0 py-2 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
        />
        {state.errors?.description && (
          <p role="alert" className="text-sm text-red-600">
            {state.errors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Field label="Precio" name="price" type="number" defaultValue={property?.price} error={state.errors?.price} />
        <Field
          label="Moneda"
          name="currency"
          defaultValue={property?.currency ?? "USD"}
          error={state.errors?.currency}
        />
      </div>

      <Field label="Ubicación" name="location" defaultValue={property?.location} error={state.errors?.location} />
      <Field label="Etiqueta" name="tag" defaultValue={property?.tag} error={state.errors?.tag} />

      <div className="flex flex-col gap-2">
        <label htmlFor="status" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Estado
        </label>
        <select
          id="status"
          name="status"
          defaultValue={property?.status ?? "available"}
          className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {state.errors?.status && (
          <p role="alert" className="text-sm text-red-600">
            {state.errors.status}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Field
          label="Dormitorios"
          name="bedrooms"
          type="number"
          defaultValue={property?.bedrooms}
          error={state.errors?.bedrooms}
        />
        <Field
          label="Baños"
          name="bathrooms"
          type="number"
          defaultValue={property?.bathrooms}
          error={state.errors?.bathrooms}
        />
        <Field
          label="Superficie (m²)"
          name="areaM2"
          type="number"
          defaultValue={property?.areaM2}
          error={state.errors?.areaM2}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Características</span>
        <div className="flex flex-wrap gap-2">
          {features.map((feature) => (
            <span key={feature} className="flex items-center gap-2 border border-foreground/20 px-3 py-1 text-sm">
              {feature}
              <input type="hidden" name="features" value={feature} />
              <button type="button" onClick={() => removeFeature(feature)} className="text-muted-foreground hover:text-accent">
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={featureInput}
          onChange={(event) => setFeatureInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addFeature();
            }
          }}
          placeholder="Escriba una característica y presione Enter"
          className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
        />
        {state.errors?.features && (
          <p role="alert" className="text-sm text-red-600">
            {state.errors.features}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Imágenes (URL)</span>
        {images.map((image, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              name="images"
              value={image}
              onChange={(event) => updateImage(index, event.target.value)}
              placeholder="https://..."
              className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
            />
            {images.length > 1 && (
              <button type="button" onClick={() => removeImageRow(index)} className="text-muted-foreground hover:text-accent">
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addImageRow}
          className="self-start text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-accent"
        >
          + Agregar imagen
        </button>
        {state.errors?.images && (
          <p role="alert" className="text-sm text-red-600">
            {state.errors.images}
          </p>
        )}
      </div>

      <Button type="submit" variant="primary" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
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
git add components/dashboard/property-form.tsx
git commit -m "feat: add property form component"
```

---

### Task 5: Property list page (replaces the stub)

**Files:**
- Create: `components/dashboard/delete-property-button.tsx`
- Modify: `app/(dashboard)/dashboard/properties/page.tsx` (replace the entire stub content)

**Interfaces:**
- Consumes: `deleteProperty` from `@/lib/properties/actions`; `getProperties` from `@/lib/properties/data`; `requireRole` from `@/lib/auth/require-role`; `Button` from `@/components/ui/button`
- Produces: `DeletePropertyButton({ id: string })` (named export)

- [ ] **Step 1: Implement the delete button**

Create `components/dashboard/delete-property-button.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { deleteProperty } from "@/lib/properties/actions";

export function DeletePropertyButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("¿Eliminar esta propiedad? Esta acción no se puede deshacer.")) {
      return;
    }
    startTransition(() => {
      deleteProperty(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-accent"
    >
      {pending ? "Eliminando…" : "Eliminar"}
    </button>
  );
}
```

- [ ] **Step 2: Replace the properties list page**

Replace the full contents of `app/(dashboard)/dashboard/properties/page.tsx` with:

```tsx
import Link from "next/link";
import { DeletePropertyButton } from "@/components/dashboard/delete-property-button";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";
import { getProperties } from "@/lib/properties/data";

export default async function PropertiesPage() {
  await requireRole(["admin"]);
  const properties = await getProperties();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Propiedades</h1>
        <Button variant="primary" href="/dashboard/properties/new">
          Nueva Propiedad
        </Button>
      </div>

      {properties.length === 0 ? (
        <p className="text-muted-foreground">No hay propiedades cargadas todavía.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-foreground/20 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <th className="py-3 pr-4">Título</th>
                <th className="py-3 pr-4">Precio</th>
                <th className="py-3 pr-4">Estado</th>
                <th className="py-3 pr-4">Actualizado</th>
                <th className="py-3 pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id} className="border-b border-foreground/10">
                  <td className="py-3 pr-4">{property.title}</td>
                  <td className="py-3 pr-4">
                    {property.currency} {property.price.toLocaleString("es-UY")}
                  </td>
                  <td className="py-3 pr-4 capitalize">{property.status}</td>
                  <td className="py-3 pr-4">{new Date(property.updatedAt).toLocaleDateString("es-UY")}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/dashboard/properties/${property.id}/edit`}
                        className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-accent"
                      >
                        Editar
                      </Link>
                      <DeletePropertyButton id={property.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/delete-property-button.tsx "app/(dashboard)/dashboard/properties/page.tsx"
git commit -m "feat: replace properties stub with real list view"
```

---

### Task 6: Create and edit pages

**Files:**
- Create: `app/(dashboard)/dashboard/properties/new/page.tsx`
- Create: `app/(dashboard)/dashboard/properties/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `PropertyForm` from `@/components/dashboard/property-form`; `createProperty`, `updateProperty` from `@/lib/properties/actions`; `getProperty` from `@/lib/properties/data`; `requireRole` from `@/lib/auth/require-role`

- [ ] **Step 1: Create the "new property" page**

Create `app/(dashboard)/dashboard/properties/new/page.tsx`:

```tsx
import { PropertyForm } from "@/components/dashboard/property-form";
import { requireRole } from "@/lib/auth/require-role";
import { createProperty } from "@/lib/properties/actions";

export default async function NewPropertyPage() {
  await requireRole(["admin"]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-3xl">Nueva Propiedad</h1>
      <PropertyForm action={createProperty} />
    </div>
  );
}
```

- [ ] **Step 2: Create the "edit property" page**

Create `app/(dashboard)/dashboard/properties/[id]/edit/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { PropertyForm } from "@/components/dashboard/property-form";
import { requireRole } from "@/lib/auth/require-role";
import { updateProperty } from "@/lib/properties/actions";
import { getProperty } from "@/lib/properties/data";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin"]);
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-3xl">Editar Propiedad</h1>
      <PropertyForm property={property} action={updateProperty.bind(null, id)} />
    </div>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/dashboard/properties/new/page.tsx" "app/(dashboard)/dashboard/properties/[id]/edit/page.tsx"
git commit -m "feat: add property create and edit pages"
```

---

### Task 7: Full verification pass and manual checklist

**Files:** none (verification only).

- [ ] **Step 1: Run the full automated check suite**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all four pass with no errors. The build's route table should now include `/dashboard/properties/new` and `/dashboard/properties/[id]/edit` alongside the existing routes.

- [ ] **Step 2: Manual verification — CRUD flow**

Using an existing admin account (created in the Foundation sub-project):

1. Visit `/dashboard/properties` — confirm "No hay propiedades cargadas todavía." shows (empty state) if no properties exist yet, or the table shows if some do.
2. Click "Nueva Propiedad", fill in all fields (including at least one feature and one image URL), submit. Confirm redirect to `/dashboard/properties` and the new row appears.
3. Try submitting the form with an empty title — confirm the Spanish error message appears next to the Título field and the property is not created.
4. Click "Editar" on the created property, change the price, submit. Confirm redirect back to the list and the new price shows.
5. Click "Eliminar", confirm the browser confirmation dialog appears; confirm it. Confirm the row disappears from the list.
6. Visit `/dashboard/properties/some-nonexistent-id/edit` directly — confirm a 404 page renders (not a crash).

- [ ] **Step 3: Manual verification — RBAC regression check**

Log in as a `sales`-role account (created in the Foundation sub-project):

1. Visit `/dashboard/properties`, `/dashboard/properties/new`, and `/dashboard/properties/<any-id>/edit` directly by URL — confirm all three redirect to `/dashboard/pipeline`.

- [ ] **Step 4: Push the branch**

```bash
git push
```

(Only after the user confirms the manual checks above pass.)
