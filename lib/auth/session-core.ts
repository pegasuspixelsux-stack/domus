import type { Role } from "./rbac";

export interface Session {
  uid: string;
  role: Role;
  active: boolean;
}

export interface AdminAuthLike {
  verifySessionCookie(cookie: string, checkRevoked: boolean): Promise<{ uid: string }>;
}

export interface FirestoreLike {
  doc(path: string): { get(): Promise<{ exists: boolean; data(): unknown }> };
}

function isRole(value: unknown): value is Role {
  return value === "admin" || value === "manager" || value === "sales";
}

export async function getSessionFromCookie(
  cookieValue: string | undefined,
  deps: { auth: AdminAuthLike; firestore: FirestoreLike },
): Promise<Session | null> {
  if (!cookieValue) return null;

  let decoded: { uid: string };
  try {
    decoded = await deps.auth.verifySessionCookie(cookieValue, true);
  } catch {
    return null;
  }

  const snapshot = await deps.firestore.doc(`users/${decoded.uid}`).get();
  if (!snapshot.exists) return null;

  const data = snapshot.data() as { role?: unknown; active?: unknown } | undefined;
  if (!data || !isRole(data.role)) return null;
  if (data.active === false) return null;

  return { uid: decoded.uid, role: data.role, active: data.active !== false };
}
