"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { ACTIVITY_TYPES, STATUS_LABELS } from "./constants";
import { getActivities } from "./data";
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
  const session = await requireRole(["admin", "sales"]);
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
  await requireRole(["admin"]);

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
