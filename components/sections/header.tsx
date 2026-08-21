"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/propiedades", label: "Propiedades" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "#testimonios", label: "Testimonios" },
];

/**
 * Fixed nav overlaying the hero. Transparent + light text over the hero
 * image at the top of the page; once scrolled it gains a blurred surface
 * and switches to the standard light-section text colors so it stays
 * legible over every section beneath it.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // An open mobile menu needs a solid, legible surface regardless of scroll
  // position — it can open right over the transparent hero.
  const solid = scrolled || menuOpen;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 px-8 py-6 transition-colors duration-700 md:px-16 ${
        solid
          ? "border-b border-foreground/10 bg-background/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between">
        <Link
          href="/"
          className={`font-serif text-xl tracking-tight transition-colors duration-500 ${
            solid ? "text-foreground" : "text-background"
          }`}
        >
          Domus
        </Link>

        <nav
          className={`hidden items-center gap-10 text-xs uppercase tracking-[0.25em] transition-colors duration-500 md:flex ${
            scrolled ? "text-muted-foreground" : "text-background/80"
          }`}
        >
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors duration-500 hover:text-accent">
              {link.label}
            </Link>
          ))}
        </nav>

        <Button
          variant="link"
          href="/precalificacion"
          invert={!scrolled}
          className="hidden md:inline-flex"
        >
          Contactar
        </Button>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          className={`transition-colors duration-500 md:hidden ${solid ? "text-foreground" : "text-background"}`}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <nav className="mt-6 flex flex-col gap-1 border-t border-foreground/10 pt-6 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="py-3 text-sm tracking-[0.15em] text-foreground uppercase transition-colors duration-500 hover:text-accent"
            >
              {link.label}
            </Link>
          ))}

          <Button
            variant="primary"
            href="/precalificacion"
            onClick={() => setMenuOpen(false)}
            className="mt-4 w-full"
          >
            Contactar
          </Button>
        </nav>
      )}
    </header>
  );
}
