import type { ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { getNavItemsForRole } from "@/lib/auth/rbac";
import { requireSession } from "@/lib/auth/require-role";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const navItems = getNavItemsForRole(session.role);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <DashboardHeader navItems={navItems} />

      <main className="flex-1 px-8 py-12">{children}</main>
    </div>
  );
}
