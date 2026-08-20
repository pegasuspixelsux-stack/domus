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
