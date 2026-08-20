import { redirect } from "next/navigation";
import { getDefaultRouteForRole } from "@/lib/auth/rbac";
import { requireSession } from "@/lib/auth/require-role";

export default async function DashboardPage() {
  const session = await requireSession();
  redirect(getDefaultRouteForRole(session.role));
}
