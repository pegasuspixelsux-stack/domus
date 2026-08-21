import { Reveal } from "@/components/ui/reveal";
import { RevealGroup, RevealGroupItem } from "@/components/ui/reveal-group";
import { SectionLabel } from "@/components/ui/section-label";

// Concrete, honest promises rather than unverifiable stats (years active,
// deals closed, etc.) — trust built on process transparency, not numbers we
// can't back up for a real business.
const commitments = [
  {
    title: "Verificación Legal Completa",
    body: "Cada propiedad que ofrecemos pasa por una revisión de título, catastro y deudas antes de mostrársela — sin sorpresas en la escritura.",
  },
  {
    title: "Sin Comisiones Ocultas",
    body: "Le explicamos cada costo de la operación desde la primera conversación, con total transparencia.",
  },
  {
    title: "Un Solo Interlocutor",
    body: "El mismo asesor lo acompaña de la primera consulta a la firma — nunca lo derivamos a alguien nuevo a mitad de camino.",
  },
];

export function Commitment() {
  return (
    <section className="border-b border-foreground/10 px-8 py-20 md:px-16 md:py-32">
      <div className="mx-auto max-w-[1600px]">
        <Reveal className="mb-16 flex flex-col gap-6 lg:mb-24 lg:max-w-xl lg:pl-[8.33%]">
          <SectionLabel>Nuestro Compromiso</SectionLabel>
          <h2 className="font-serif text-4xl leading-[1] tracking-tight md:text-5xl lg:text-6xl">
            Confianza que se <em className="text-accent italic">demuestra</em>.
          </h2>
        </Reveal>

        <RevealGroup className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8 lg:gap-12">
          {commitments.map((item, index) => (
            <RevealGroupItem key={item.title} className="flex flex-col">
              <span className="font-serif text-5xl text-muted-foreground/30 md:text-6xl">
                0{index + 1}
              </span>
              <div className="border-t-4 border-t-accent pt-8">
                <h3 className="font-serif text-2xl md:text-3xl">{item.title}</h3>
                <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </RevealGroupItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
