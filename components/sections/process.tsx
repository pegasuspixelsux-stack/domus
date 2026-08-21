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

export function Process() {
  return (
    <section className="border-b border-foreground/10 px-8 py-20 md:px-16 md:py-32">
      <div className="mx-auto max-w-[1600px]">
        <Reveal className="mb-16 flex flex-col gap-6 lg:mb-24 lg:max-w-xl lg:pl-[8.33%]">
          <SectionLabel>Nuestro Proceso</SectionLabel>
          <h2 className="font-serif text-4xl leading-[1] tracking-tight md:text-5xl lg:text-6xl">
            Tres pasos, sin <em className="text-accent italic">vueltas</em>.
          </h2>
        </Reveal>

        <RevealGroup className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <RevealGroupItem key={step.title} className="flex flex-col">
              <span className="font-serif text-5xl text-muted-foreground/30 md:text-6xl">
                0{index + 1}
              </span>
              <div className="border-t-4 border-t-accent pt-8">
                <h3 className="font-serif text-2xl md:text-3xl">{step.title}</h3>
                <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </RevealGroupItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-16 lg:mt-20 lg:pl-[8.33%]" delay={0.15}>
          <Button variant="primary" href="/precalificacion">
            Comenzar Ahora
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
