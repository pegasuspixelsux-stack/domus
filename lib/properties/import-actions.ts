"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { PROPERTY_MANAGER_ROLES } from "@/lib/auth/rbac";
import { requireRole } from "@/lib/auth/require-role";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { parsePropertiesCsv } from "./csv-import";

const COLLECTION = "properties";

export interface PropertyImportSummary {
  imported: number;
  errors: { row: number; message: string }[];
}

function summarizeRowErrors(errors: Record<string, string>): string {
  return Object.values(errors).join(" ");
}

export async function importProperties(csvText: string): Promise<PropertyImportSummary> {
  const session = await requireRole(PROPERTY_MANAGER_ROLES);
  const { valid, invalid } = parsePropertiesCsv(csvText);

  const firestore = getFirebaseAdminFirestore();
  const collection = firestore.collection(COLLECTION);

  await Promise.all(
    valid.map(({ data }) =>
      collection.add({
        ...data,
        createdBy: session.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }),
    ),
  );

  if (valid.length > 0) {
    revalidatePath("/dashboard/properties");
    revalidatePath("/");
  }

  return {
    imported: valid.length,
    errors: invalid.map(({ row, errors }) => ({ row, message: summarizeRowErrors(errors) })),
  };
}
