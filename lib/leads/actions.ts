"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { LEAD_MANAGER_ROLES, PIPELINE_ROLES } from "@/lib/auth/rbac";
import { requireRole } from "@/lib/auth/require-role";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getProperty } from "@/lib/properties/data";
import { getTeamMembers } from "@/lib/team/data";
import { pickRoundRobinAssignee } from "./assignment";
import { ACTIVITY_TYPES, STATUS_LABELS } from "./constants";
import { getActivities } from "./data";
import { composePrequalifyNotes, validatePrequalifyInput } from "./prequalify-validation";
import { validateLeadInput } from "./validation";
import type { Activity, ActivityType, LeadStatus } from "./types";

const COLLECTION = "leads";
const MAX_NOTE_LENGTH = 2000;

export interface LeadActionState {
  errors?: Record<string, string>;
  success?: boolean;
  values?: {
    name: string;
    email: string;
    phone: string;
    source: string;
  };
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
  const session = await requireRole(PIPELINE_ROLES);
  const result = validateLeadInput(extractInput(formData));

  if (!result.valid) {
    // Echo the raw submission back: React 19 resets uncontrolled inputs after
    // any action completes, so without this a single field error wipes the form.
    return { errors: result.errors, values: extractInput(formData) };
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

export interface PropertyInquiryState {
  errors?: Record<string, string>;
  success?: boolean;
  values?: {
    name: string;
    email: string;
    phone: string;
    salespersonId: string;
  };
}

/**
 * Public counterpart to `createLead` — no auth required, since it's
 * submitted by an anonymous visitor from a property detail page. Reuses the
 * same validation for name/email/phone, but the salesperson picked in the
 * form and the property it was submitted from are both re-verified against
 * Firestore rather than trusted from the client: a public POST can send any
 * uid or property id, and an unverified `assignedTo` would silently orphan
 * the lead (or hand it to whoever guessed a valid uid).
 */
export async function createPropertyInquiry(
  _prevState: PropertyInquiryState,
  formData: FormData,
): Promise<PropertyInquiryState> {
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  const salespersonId = String(formData.get("salespersonId") ?? "").trim();
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };
  const values = { ...raw, salespersonId };

  const result = validateLeadInput({ ...raw, source: "Ficha de Propiedad" });
  if (!result.valid) {
    return { errors: result.errors, values };
  }

  if (!salespersonId) {
    return { errors: { salespersonId: "Seleccione un asesor." }, values };
  }

  const [property, salespeople] = await Promise.all([
    propertyId ? getProperty(propertyId) : Promise.resolve(null),
    getTeamMembers(),
  ]);
  const salesperson = salespeople.find(
    (member) => member.role === "sales" && member.uid === salespersonId,
  );

  if (!property || !salesperson) {
    return {
      errors: { form: "No se pudo enviar la consulta. Actualice la página e intente de nuevo." },
      values,
    };
  }

  await getFirebaseAdminFirestore()
    .collection(COLLECTION)
    .add({
      ...result.data,
      source: `Ficha de Propiedad — ${property.title}`,
      propertyId: property.id,
      status: "new",
      assignedTo: salesperson.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

  revalidatePath("/dashboard/pipeline");
  return { success: true };
}

export interface PrequalifyActionState {
  errors?: Record<string, string>;
  success?: boolean;
  values?: {
    name: string;
    email: string;
    phone: string;
    budget: string;
    goal: string;
    zone: string;
    bedrooms: string;
    bathrooms: string;
    urgency: string;
    financing: string;
    obstacle: string;
    notes: string;
  };
}

/**
 * Public counterpart to `createLead` for the /precalificacion wizard — no
 * auth required, and no salesperson picker in the form (unlike
 * `createPropertyInquiry`), so the lead is round-robin assigned instead.
 * The six qualification answers aren't stored as their own fields; they're
 * composed into `notes` alongside anything the visitor typed themselves.
 */
export async function createPrequalifiedLead(
  _prevState: PrequalifyActionState,
  formData: FormData,
): Promise<PrequalifyActionState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    budget: String(formData.get("budget") ?? ""),
    goal: String(formData.get("goal") ?? ""),
    zone: String(formData.get("zone") ?? ""),
    bedrooms: String(formData.get("bedrooms") ?? ""),
    bathrooms: String(formData.get("bathrooms") ?? ""),
    urgency: String(formData.get("urgency") ?? ""),
    financing: String(formData.get("financing") ?? ""),
    obstacle: String(formData.get("obstacle") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };

  const result = validatePrequalifyInput(raw);
  if (!result.valid) {
    return { errors: result.errors, values: raw };
  }

  const assignee = await pickRoundRobinAssignee();
  if (!assignee) {
    return {
      errors: { form: "No hay asesores disponibles en este momento. Escríbanos por WhatsApp." },
      values: raw,
    };
  }

  const { name, email, phone, ...qualification } = result.data;

  await getFirebaseAdminFirestore()
    .collection(COLLECTION)
    .add({
      name,
      email,
      phone,
      source: "Formulario de Precalificación",
      notes: composePrequalifyNotes(qualification),
      status: "new",
      assignedTo: assignee.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

  revalidatePath("/dashboard/pipeline");
  return { success: true, values: raw };
}

async function assertCanManageLead(leadId: string) {
  const session = await requireRole(PIPELINE_ROLES);
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
  // Validate newStatus at runtime
  if (!Object.keys(STATUS_LABELS).includes(newStatus)) {
    throw new Error("invalid-status");
  }

  const { session, firestore, data } = await assertCanManageLead(leadId);

  const leadRef = firestore.collection(COLLECTION).doc(leadId);
  const batch = firestore.batch();

  // Update lead status
  batch.update(leadRef, {
    status: newStatus,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Create activity record atomically
  const activityRef = leadRef.collection("activities").doc();
  batch.set(activityRef, {
    type: "status_change" as ActivityType,
    note: `${STATUS_LABELS[data.status as LeadStatus]} → ${STATUS_LABELS[newStatus]}`,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: session.uid,
  });

  await batch.commit();
  revalidatePath("/dashboard/pipeline");
}

export async function addActivity(
  leadId: string,
  type: ActivityType,
  note: string,
): Promise<void> {
  // Validate type at runtime (status_change is system-only)
  const validTypes: ActivityType[] = ACTIVITY_TYPES.map((entry) => entry.value);
  if (!validTypes.includes(type)) {
    throw new Error("invalid-activity-type");
  }

  // Validate the note at runtime too — a direct call bypasses the client guard.
  const trimmedNote = note.trim();
  if (!trimmedNote) {
    throw new Error("empty-note");
  }
  if (trimmedNote.length > MAX_NOTE_LENGTH) {
    throw new Error("note-too-long");
  }

  const { session, firestore } = await assertCanManageLead(leadId);

  await firestore
    .collection(COLLECTION)
    .doc(leadId)
    .collection("activities")
    .add({
      type,
      note: trimmedNote,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: session.uid,
    });

  revalidatePath("/dashboard/pipeline");
}

export async function reassignLead(leadId: string, newAssigneeUid: string): Promise<void> {
  await requireRole(LEAD_MANAGER_ROLES);

  const firestore = getFirebaseAdminFirestore();
  const leadRef = firestore.collection(COLLECTION).doc(leadId);

  // `update()` on a missing doc throws NOT_FOUND; read first so the failure is
  // an explicit, catchable error rather than a raw Firestore code.
  const leadDoc = await leadRef.get();
  if (!leadDoc.exists) {
    throw new Error("lead-not-found");
  }

  // Reassigning to a nonexistent or deactivated user orphans the lead: it
  // disappears from every board and can't be recovered through the UI.
  const userDoc = await firestore.collection("users").doc(newAssigneeUid).get();
  if (!userDoc.exists || userDoc.data()?.active === false) {
    throw new Error("invalid-assignee");
  }

  await leadRef.update({
    assignedTo: newAssigneeUid,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/dashboard/pipeline");
}

export async function fetchLeadActivities(leadId: string): Promise<Activity[]> {
  await assertCanManageLead(leadId);
  return getActivities(leadId);
}
