"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LogoutButton } from "@/components/dashboard/logout-button";
import type { NavItem } from "@/lib/auth/rbac";

/**
 * Dashboard header, with nav links tucked behind a burger toggle below md —
 * previously they just crammed into one row unconditionally on mobile.
 */
export function DashboardHeader({ navItems }: { navItems: NavItem[] }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-foreground/10 px-8 py-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="font-serif text-xl transition-colors duration-500 hover:text-accent">
          Domus
        </Link>

        <nav className="hidden items-center gap-8 text-xs tracking-[0.2em] text-muted-foreground uppercase md:flex">
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

        <div className="hidden md:block">
          <LogoutButton />
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          className="text-foreground md:hidden"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <nav className="mt-6 flex flex-col gap-1 border-t border-foreground/10 pt-6 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="py-3 text-sm tracking-[0.15em] text-foreground uppercase transition-colors duration-500 hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3">
            <LogoutButton />
          </div>
        </nav>
      )}
    </header>
  );
}
