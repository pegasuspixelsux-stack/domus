import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { RevealGroup, RevealGroupItem } from "@/components/ui/reveal-group";
import { SectionLabel } from "@/components/ui/section-label";

const steps = [
  {
    title: "Escríbanos",
    body: "Complete el formulario o contáctenos directo por WhatsApp contándonos qué está buscando.",
  },
  {
    title: "Reciba su Selección",
    body: "Armamos una lista curada de propiedades que se ajustan a su búsqueda, presupuesto y objetivos.",
  },
  {
    title: "Visite y Decida",
    body: "Agende su consulta con un asesor y coordine la visita a las propiedades que más le interesen.",
  },
];

/**
 * Nosotros-only editorial take on "Nuestro Proceso" — a separate component
 * from the shared Process used on the homepage (same content, different
 * treatment) so restyling one page's narrative never touches the other's.
 * A distinct, action-oriented section rather than part of the narrative
 * (own border-b on both sides) — but keeps the same max-w-4xl editorial
 * column, and a stacked single-file list instead of the homepage version's
 * three-card grid.
 */
export function NosotrosProcess() {
  return (
    <section className="border-b border-foreground/10 px-8 py-20 md:px-16 md:py-32">
      <div className="mx-auto max-w-4xl">
        <Reveal className="flex flex-col gap-6">
          <SectionLabel>Nuestro Proceso</SectionLabel>
          <h2 className="font-serif text-3xl leading-[1.15] tracking-tight md:text-4xl">
            Tres pasos, sin <em className="text-accent italic">vueltas</em>.
          </h2>
        </Reveal>

        <RevealGroup className="mt-12 flex flex-col gap-10 md:mt-16 md:gap-12">
          {steps.map((step, index) => (
            <RevealGroupItem
              key={step.title}
              className="flex gap-6 border-t border-foreground/10 pt-8 md:gap-10"
            >
              <span className="font-serif text-3xl leading-none text-muted-foreground/40 md:text-4xl">
                0{index + 1}
              </span>
              <div>
                <h3 className="font-serif text-xl text-foreground/90 md:text-2xl">{step.title}</h3>
                <p className="mt-3 text-lg leading-loose text-muted-foreground">{step.body}</p>
              </div>
            </RevealGroupItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-12 md:mt-16" delay={0.15}>
          <Button variant="primary" href="/precalificacion">
            Comenzar Ahora
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
