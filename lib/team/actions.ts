"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { validateUserInput } from "./validation";

export interface UserActionState {
  errors?: Record<string, string>;
  success?: boolean;
  values?: {
    displayName: string;
    email: string;
    role: string;
  };
}

function extractInput(formData: FormData) {
  return {
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? ""),
  };
}

/**
 * Admin-only. Creates the Firebase Auth account with no password set —
 * the new user signs in for the first time via the existing "¿Olvidó su
 * contraseña?" flow on the login page, which sends its own reset email
 * through Firebase Auth. No invite email is sent from here.
 */
export async function createUser(
  _prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  await requireRole(["admin"]);

  const raw = extractInput(formData);
  const result = validateUserInput(raw);
  if (!result.valid) {
    return { errors: result.errors, values: raw };
  }

  const auth = getFirebaseAdminAuth();
  let uid: string;
  try {
    const userRecord = await auth.createUser({
      email: result.data.email,
      displayName: result.data.displayName,
    });
    uid = userRecord.uid;
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "auth/email-already-exists") {
      return { errors: { email: "Ya existe una cuenta con este correo." }, values: raw };
    }
    return { errors: { form: "No se pudo crear la cuenta. Intente de nuevo." }, values: raw };
  }

  await getFirebaseAdminFirestore()
    .collection("users")
    .doc(uid)
    .set({
      displayName: result.data.displayName,
      email: result.data.email,
      role: result.data.role,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

  revalidatePath("/dashboard/users");
  return { success: true };
}
