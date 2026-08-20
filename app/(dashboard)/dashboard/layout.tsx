import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { getNavItemsForRole } from "@/lib/auth/rbac";
import { requireSession } from "@/lib/auth/require-role";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const navItems = getNavItemsForRole(session.role);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-foreground/10 px-8 py-6">
        <span className="font-serif text-xl">Domus</span>

        <nav className="flex items-center gap-8 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors duration-500 hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <LogoutButton />
      </header>

      <main className="flex-1 px-8 py-12">{children}</main>
    </div>
  );
}
