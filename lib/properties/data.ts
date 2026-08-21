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
    featured: data.featured === true,
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

const PUBLIC_SHOWCASE_LIMIT = 6;

/**
 * Properties eligible for the public marketing homepage: explicitly marked
 * `featured` by an admin and currently `available`. Never exposes reserved
 * or sold properties, and never exposes a non-featured property regardless
 * of how recently it was updated.
 *
 * Filters only on `featured` in Firestore (a single-field index, created
 * automatically) and does the `status` filter + `updatedAt` sort in memory
 * — a compound `where(featured).where(status).orderBy(updatedAt)` query
 * would require a manually-deployed composite index, and the featured set
 * is small by design (admin-curated for the homepage), so sorting it in
 * memory costs nothing meaningful.
 */
export async function getPublicShowcaseProperties(): Promise<Property[]> {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(COLLECTION)
    .where("featured", "==", true)
    .get();

  return snapshot.docs
    .map((doc) => toProperty(doc.id, doc.data()))
    .filter((property) => property.status === "available")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, PUBLIC_SHOWCASE_LIMIT);
}
