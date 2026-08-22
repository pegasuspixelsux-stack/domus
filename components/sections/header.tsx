"use client";

import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/propiedades", label: "Propiedades" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/precalificacion", label: "Contacto" },
];

const INICIO_LINK = { href: "/", label: "Inicio" };

/**
 * Fixed nav overlaying the hero. Transparent + light text over the hero
 * image at the top of the page; once scrolled it gains a blurred surface
 * and switches to the standard light-section text colors so it stays
 * legible over every section beneath it.
 */
export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // "Inicio" only makes sense as a way back — hide it on the page it points to.
  const navLinks = pathname === "/" ? NAV_LINKS : [INICIO_LINK, ...NAV_LINKS];

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
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-8">
        <Link
          href="/"
          className={`shrink-0 font-serif text-xl tracking-tight transition-colors duration-500 ${
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
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors duration-500 hover:text-accent">
              {link.label}
            </Link>
          ))}
        </nav>

        <PropertySearchForm scrolled={scrolled} className="hidden w-36 shrink-0 md:block lg:w-48" />

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
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="py-3 text-sm tracking-[0.15em] text-foreground uppercase transition-colors duration-500 hover:text-accent"
            >
              {link.label}
            </Link>
          ))}

          <PropertySearchForm scrolled onSubmitted={() => setMenuOpen(false)} className="mt-3" />

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

/**
 * Compact keyword search, shared between the desktop nav row and the mobile
 * menu — submits to /propiedades?q=..., which PropertyListing reads on
 * mount to seed its own (client-side only) keyword filter. `scrolled`
 * mirrors the nav links' own color logic so the search box always matches
 * the surrounding text (light-on-image at the top, muted once scrolled or
 * inside the always-solid mobile drawer).
 */
function PropertySearchForm({
  scrolled,
  onSubmitted,
  className = "",
}: {
  scrolled: boolean;
  onSubmitted?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/propiedades?q=${encodeURIComponent(trimmed)}` : "/propiedades");
    onSubmitted?.();
  }

  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar propiedades…"
        aria-label="Buscar propiedades"
        className={`h-9 min-w-0 flex-1 border-b bg-transparent px-0 text-xs tracking-[0.05em] transition-colors duration-500 focus-visible:outline-none ${
          scrolled
            ? "border-foreground/30 text-foreground placeholder:text-muted-foreground/70 focus-visible:border-accent"
            : "border-background/40 text-background placeholder:text-background/60 focus-visible:border-accent"
        }`}
      />
      <button
        type="submit"
        aria-label="Buscar"
        className={`shrink-0 transition-colors duration-500 hover:text-accent ${
          scrolled ? "text-foreground" : "text-background"
        }`}
      >
        <Search size={16} />
      </button>
    </form>
  );
}
