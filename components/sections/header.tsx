"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Fixed nav overlaying the hero. Transparent + light text over the hero
 * image at the top of the page; once scrolled it gains a blurred surface
 * and switches to the standard light-section text colors so it stays
 * legible over every section beneath it.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 px-8 py-6 transition-colors duration-700 md:px-16 ${
        scrolled
          ? "border-b border-foreground/10 bg-background/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between">
        <Link
          href="/"
          className={`font-serif text-xl tracking-tight transition-colors duration-500 ${
            scrolled ? "text-foreground" : "text-background"
          }`}
        >
          Domus
        </Link>

        <nav
          className={`hidden items-center gap-10 text-xs uppercase tracking-[0.25em] transition-colors duration-500 md:flex ${
            scrolled ? "text-muted-foreground" : "text-background/80"
          }`}
        >
          <Link href="/propiedades" className="transition-colors duration-500 hover:text-accent">
            Propiedades
          </Link>
          <Link href="/nosotros" className="transition-colors duration-500 hover:text-accent">
            Nosotros
          </Link>
          <Link href="#testimonios" className="transition-colors duration-500 hover:text-accent">
            Testimonios
          </Link>
        </nav>

        <Button
          variant="link"
          href="#contacto"
          invert={!scrolled}
          className="hidden md:inline-flex"
        >
          Contactar
        </Button>
      </div>
    </header>
  );
}
