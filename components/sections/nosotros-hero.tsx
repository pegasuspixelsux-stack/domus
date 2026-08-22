import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { SectionLabel } from "@/components/ui/section-label";

/**
 * Half-height counterpart to the homepage `Hero`: same image-background,
 * grayscale → color, bottom-scrim treatment, but min-h-[50vh] instead of a
 * full viewport since this is an interior page, not the landing hero.
 */
export function NosotrosHero() {
  return (
    <section className="group relative flex min-h-[50vh] items-end overflow-hidden border-b border-foreground/10 px-8 pt-32 pb-16 md:px-16 md:pb-20">
      <Image
        src="/images/coastal_brava.jpg"
        alt="Costa de Punta del Este"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center grayscale transition-[transform,filter] duration-[2000ms] ease-out group-hover:scale-105 group-hover:grayscale-0"
      />
      {/* Full-height dark overlay, same tint as the homepage Hero, so the
          image reads consistently dark everywhere — not just toward the
          text corner like the scrim below. */}
      <div className="absolute inset-0 bg-foreground/70" />

      {/* Scrim for text legibility — deepens toward the bottom-left content. */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-foreground/5" />

      {/* Extra depth directly behind the text block, on top of the base scrim. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_0%_100%,var(--color-foreground)_0%,transparent_55%)] opacity-70" />

      {/* Subtle band behind the fixed nav so it stays legible before scroll. */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-foreground/40 to-transparent" />

      <Reveal className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <SectionLabel invert>Domus Punta del Este</SectionLabel>
        <h1 className="max-w-2xl font-serif text-4xl leading-[1] tracking-tight text-background md:text-5xl lg:text-6xl">
          Bienes raíces con <em className="text-accent italic">nombre y apellido</em>.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-background/75">
          Conozca al equipo, los valores y el compromiso detrás de cada propiedad que le
          mostramos.
        </p>
      </Reveal>
    </section>
  );
}
