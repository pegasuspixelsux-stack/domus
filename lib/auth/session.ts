import { cookies } from "next/headers";
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getSessionFromCookie, type Session } from "./session-core";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_EXPIRES_IN_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return getSessionFromCookie(cookieValue, {
    auth: getFirebaseAdminAuth(),
    firestore: getFirebaseAdminFirestore(),
  });
}
