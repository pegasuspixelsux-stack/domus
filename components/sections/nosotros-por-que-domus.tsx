import { Reveal } from "@/components/ui/reveal";
import { RevealGroup, RevealGroupItem } from "@/components/ui/reveal-group";
import { SectionLabel } from "@/components/ui/section-label";

const features = [
  {
    title: "Selección Curada",
    body: "Solo incorporamos propiedades que superan nuestros propios estándares de ubicación, construcción y potencial de revalorización. Antes de sumar una propiedad al portfolio, la visitamos personalmente, evaluamos su entorno y comparamos su precio contra operaciones recientes de la zona — así nunca le mostramos algo que nosotros mismos no compraríamos.",
  },
  {
    title: "Asesoría de Inversión",
    body: "Analizamos cada operación con el mismo rigor que un fondo institucional: retorno esperado, liquidez y horizonte de salida. Le presentamos números claros, no promesas — proyecciones de renta, costos de mantenimiento y escenarios de reventa, para que decida con la misma información que usaría cualquier inversor profesional.",
  },
  {
    title: "Acompañamiento Integral",
    body: "Desde la primera visita hasta la escritura, un mismo asesor lo acompaña en cada etapa — sin intermediarios, sin sorpresas. Coordinamos inspecciones, trámites notariales y gestiones bancarias en su nombre, y seguimos disponibles después del cierre para lo que necesite.",
  },
];

/**
 * Nosotros-only editorial take on "Por Qué Domus" — a separate component
 * from the shared Features used on the homepage (same content, different
 * treatment) so restyling one page's narrative never touches the other's.
 * Closes the editorial narrative opened in mission-vision.tsx (same
 * max-w-4xl column, no border-b before it). The three points read as
 * stacked prose sections with a hairline rule between them, not the
 * three-card grid the homepage version uses, since the core story
 * shouldn't read as UI modules. The border-b returns here, marking the
 * transition into Commitment's own separate modular section.
 */
export function NosotrosPorQueDomus() {
  return (
    <section className="border-b border-foreground/10 px-8 pt-12 pb-20 md:px-16 md:pt-16 md:pb-32">
      <div className="mx-auto max-w-4xl">
        <Reveal className="flex flex-col gap-6">
          <SectionLabel>Por Qué Domus</SectionLabel>
          <h2 className="font-serif text-3xl leading-[1.15] tracking-tight md:text-4xl">
            La <em className="text-accent italic">calidad</em> no se negocia.
          </h2>
        </Reveal>

        <RevealGroup className="mt-12 flex flex-col gap-10 md:mt-16 md:gap-12">
          {features.map((feature) => (
            <RevealGroupItem key={feature.title} className="border-t border-foreground/10 pt-8">
              <h3 className="font-serif text-xl text-foreground/90 md:text-2xl">{feature.title}</h3>
              <p className="mt-3 text-lg leading-loose text-muted-foreground">{feature.body}</p>
            </RevealGroupItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
