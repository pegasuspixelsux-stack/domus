import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { SectionLabel } from "@/components/ui/section-label";

/**
 * Mini hero for the /propiedades listing page: min-h-[40vh], shown plain
 * (no grayscale/hover effect) since the photo itself is the point. A
 * full-height dark overlay (same tint as the homepage Hero and the Nosotros
 * mini hero) keeps the whole image consistently dark, with an extra scrim
 * behind the text block on top of it for legibility.
 */
export function PropiedadesHero() {
  return (
    <section className="relative flex min-h-[40vh] items-end overflow-hidden border-b border-foreground/10 px-8 pt-32 pb-16 md:px-16 md:pb-20">
      <Image
        src="/images/coastal_brava.jpg"
        alt="Costa de Punta del Este"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Full-height dark overlay, same tint as the homepage Hero. */}
      <div className="absolute inset-0 bg-foreground/70" />

      {/* Localized scrim behind the text block only — deepens it further. */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-foreground/80 to-transparent" />

      <Reveal className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <SectionLabel invert>Portfolio Completo</SectionLabel>
        <h1 className="max-w-2xl font-serif text-4xl leading-[1] tracking-tight text-background md:text-5xl lg:text-6xl">
          Cada residencia, <em className="text-accent italic">a su medida</em>.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-background/75">
          Explore el portfolio completo y filtre por ubicación, tipo y presupuesto.
        </p>
      </Reveal>
    </section>
  );
}
