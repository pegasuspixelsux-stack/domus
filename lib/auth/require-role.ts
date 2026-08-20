import { redirect } from "next/navigation";
import { getDefaultRouteForRole, type Role } from "@/lib/auth/rbac";
import { getSession } from "@/lib/auth/session";
import type { Session } from "@/lib/auth/session-core";

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(allowedRoles: Role[]): Promise<Session> {
  const session = await requireSession();
  if (!allowedRoles.includes(session.role)) {
    redirect(getDefaultRouteForRole(session.role));
  }
  return session;
}
