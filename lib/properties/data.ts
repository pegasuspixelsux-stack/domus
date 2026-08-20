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
