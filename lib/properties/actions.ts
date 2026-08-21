"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PROPERTY_MANAGER_ROLES } from "@/lib/auth/rbac";
import { requireRole } from "@/lib/auth/require-role";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { validatePropertyInput } from "./validation";

const COLLECTION = "properties";

export interface PropertyActionState {
  errors?: Record<string, string>;
  values?: {
    title: string;
    description: string;
    price: string;
    currency: string;
    location: string;
    tag: string;
    status: string;
    bedrooms: string;
    bathrooms: string;
    areaM2: string;
    featured: string;
  };
}

function extractRawValues(formData: FormData): NonNullable<PropertyActionState["values"]> {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: String(formData.get("price") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    location: String(formData.get("location") ?? ""),
    tag: String(formData.get("tag") ?? ""),
    status: String(formData.get("status") ?? ""),
    bedrooms: String(formData.get("bedrooms") ?? ""),
    bathrooms: String(formData.get("bathrooms") ?? ""),
    areaM2: String(formData.get("areaM2") ?? ""),
    featured: formData.get("featured") ? "true" : "false",
  };
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
    featured: formData.get("featured") === "on",
  };
}

export async function createProperty(
  _prevState: PropertyActionState,
  formData: FormData,
): Promise<PropertyActionState> {
  const session = await requireRole(PROPERTY_MANAGER_ROLES);
  const result = validatePropertyInput(extractInput(formData));

  if (!result.valid) {
    return { errors: result.errors, values: extractRawValues(formData) };
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
  revalidatePath("/");
  redirect("/dashboard/properties");
}

export async function updateProperty(
  id: string,
  _prevState: PropertyActionState,
  formData: FormData,
): Promise<PropertyActionState> {
  await requireRole(PROPERTY_MANAGER_ROLES);
  const result = validatePropertyInput(extractInput(formData));

  if (!result.valid) {
    return { errors: result.errors, values: extractRawValues(formData) };
  }

  await getFirebaseAdminFirestore()
    .collection(COLLECTION)
    .doc(id)
    .update({
      ...result.data,
      updatedAt: FieldValue.serverTimestamp(),
    });

  revalidatePath("/dashboard/properties");
  revalidatePath("/");
  redirect("/dashboard/properties");
}

export async function deleteProperty(id: string): Promise<void> {
  await requireRole(PROPERTY_MANAGER_ROLES);
  await getFirebaseAdminFirestore().collection(COLLECTION).doc(id).delete();
  revalidatePath("/dashboard/properties");
  revalidatePath("/");
}
