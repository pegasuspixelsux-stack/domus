import { Reveal } from "@/components/ui/reveal";
import { RevealGroup, RevealGroupItem } from "@/components/ui/reveal-group";
import { SectionLabel } from "@/components/ui/section-label";

/**
 * Opens the Nosotros page's editorial narrative — a single narrow column
 * (max-w-4xl) read top to bottom like a magazine feature, rather than the
 * wide max-w-[1600px] grid modules used elsewhere on the site. Continues
 * straight into quienes-somos.tsx and features.tsx with no border-b divider
 * between them, so the three read as one continuous article; the divider
 * only returns before Commitment, which — like Team and Testimonials —
 * deliberately keeps its own separate modular presentation.
 */
export function MissionVision() {
  return (
    <section className="px-8 pt-20 pb-12 md:px-16 md:pt-28 md:pb-16">
      <div className="mx-auto max-w-4xl">
        <Reveal className="flex flex-col gap-6">
          <SectionLabel>Misión y Visión</SectionLabel>
          <h2 className="font-serif text-3xl leading-[1.15] tracking-tight md:text-4xl">
            Lo que nos <em className="text-accent italic">mueve</em>.
          </h2>
        </Reveal>

        <RevealGroup className="mt-12 flex flex-col gap-10 md:mt-16 md:gap-12">
          <RevealGroupItem>
            <h3 className="font-serif text-xl text-foreground/90 md:text-2xl">Misión</h3>
            <p className="mt-3 text-lg leading-loose text-muted-foreground">
              Guiar a cada familia e inversor hacia la propiedad correcta en Punta del Este, con
              la misma rigurosidad que aplicaríamos a nuestra propia inversión — sin atajos, sin
              presión, sin letra chica.
            </p>
          </RevealGroupItem>

          <RevealGroupItem>
            <h3 className="font-serif text-xl text-foreground/90 md:text-2xl">Visión</h3>
            <p className="mt-3 text-lg leading-loose text-muted-foreground">
              Ser la referencia de confianza en bienes raíces de Punta del Este: la inmobiliaria
              que familias e inversores recomiendan porque los acompañó de verdad, de principio a
              fin.
            </p>
          </RevealGroupItem>
        </RevealGroup>
      </div>
    </section>
  );
}
