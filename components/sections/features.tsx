import { Reveal } from "@/components/ui/reveal";
import { RevealGroup, RevealGroupItem } from "@/components/ui/reveal-group";
import { SectionLabel } from "@/components/ui/section-label";

const features = [
  {
    title: "Selección Curada",
    body: "Solo incorporamos propiedades que superan nuestros propios estándares de ubicación, construcción y potencial de revalorización.",
  },
  {
    title: "Asesoría de Inversión",
    body: "Analizamos cada operación con el mismo rigor que un fondo institucional: retorno esperado, liquidez y horizonte de salida.",
  },
  {
    title: "Acompañamiento Integral",
    body: "Desde la primera visita hasta la escritura, un mismo asesor lo acompaña en cada etapa — sin intermediarios, sin sorpresas.",
  },
];

export function Features() {
  return (
    <section id="por-que-domus" className="border-b border-foreground/10 px-8 py-20 md:px-16 md:py-32">
      <div className="mx-auto max-w-[1600px]">
        <Reveal className="mb-16 flex flex-col gap-6 lg:mb-24 lg:max-w-xl lg:pl-[8.33%]">
          <SectionLabel>Por Qué Domus</SectionLabel>
          <h2 className="font-serif text-4xl leading-[1] tracking-tight md:text-5xl lg:text-6xl">
            La <em className="text-accent italic">calidad</em> no se negocia.
          </h2>
        </Reveal>

        <RevealGroup className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <RevealGroupItem key={feature.title} className="flex flex-col">
              <span className="font-serif text-5xl text-muted-foreground/30 md:text-6xl">
                0{index + 1}
              </span>
              <div className="border-t-4 border-t-accent pt-8">
                <h3 className="font-serif text-2xl md:text-3xl">{feature.title}</h3>
                <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </div>
            </RevealGroupItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
