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
