import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { sendLeadAlert } from "@/lib/email/sendLeadAlert";
import type { LeadStatus } from "./types";

const COLLECTION = "leads";

export interface NewLeadInput {
  name: string;
  email: string;
  phone: string;
  source: string;
  assignedTo: string;
  status?: LeadStatus;
  propertyId?: string;
  /** Composed qualification text — see composePrequalifyNotes/composeChatQualificationNotes. */
  notes?: string;
  qualificationScore?: number;
}

/**
 * Single choke point for every *publicly sourced* lead — the /precalificacion
 * wizard, a property page's inquiry form, and the chat assistant's
 * prequalifyLead tool all go through this instead of writing to Firestore
 * directly, so the sales-team alert email fires exactly once, for every
 * public entry point, without each call site having to remember to send it.
 *
 * Deliberately not used by `createLead` in actions.ts — that one is a
 * PIPELINE_ROLES staff member adding a lead themselves from the dashboard,
 * self-assigned; alerting them about a lead they just typed in themselves
 * would be noise, not a notification.
 */
export async function createLeadRecord(input: NewLeadInput): Promise<string> {
  const firestore = getFirebaseAdminFirestore();

  const ref = await firestore
    .collection(COLLECTION)
    .add({
      name: input.name,
      email: input.email,
      phone: input.phone,
      source: input.source,
      status: input.status ?? "new",
      assignedTo: input.assignedTo,
      // Firestore's Admin SDK rejects `undefined` field values outright (this
      // project doesn't set ignoreUndefinedProperties), so optional fields are
      // only spread in when present rather than passed through as `undefined`.
      notes: input.notes ?? "",
      ...(input.propertyId ? { propertyId: input.propertyId } : {}),
      ...(input.qualificationScore !== undefined ? { qualificationScore: input.qualificationScore } : {}),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

  // Fire-and-forget: never let a flaky email provider delay the caller's
  // response (the chat reply, the form submission) or fail lead creation —
  // the lead is already durably saved by this point.
  void sendLeadAlert({
    id: ref.id,
    name: input.name,
    email: input.email,
    phone: input.phone,
    source: input.source,
    notes: input.notes,
  });

  return ref.id;
}
