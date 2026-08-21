import { Reveal } from "@/components/ui/reveal";
import { RevealGroup, RevealGroupItem } from "@/components/ui/reveal-group";
import { SectionLabel } from "@/components/ui/section-label";

export function MissionVision() {
  return (
    <section className="border-b border-foreground/10 px-8 py-20 md:px-16 md:py-32">
      <div className="mx-auto max-w-[1600px]">
        <Reveal className="mb-16 flex flex-col gap-6 lg:mb-24 lg:max-w-xl">
          <SectionLabel>Misión y Visión</SectionLabel>
          <h2 className="font-serif text-4xl leading-[1] tracking-tight md:text-5xl lg:text-6xl">
            Lo que nos <em className="text-accent italic">mueve</em>.
          </h2>
        </Reveal>

        <RevealGroup className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-8 lg:gap-16">
          <RevealGroupItem className="border-t-4 border-t-accent pt-8">
            <h3 className="font-serif text-2xl md:text-3xl">Misión</h3>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Guiar a cada familia e inversor hacia la propiedad correcta en Punta del Este, con
              la misma rigurosidad que aplicaríamos a nuestra propia inversión — sin atajos, sin
              presión, sin letra chica.
            </p>
          </RevealGroupItem>

          <RevealGroupItem className="border-t-4 border-t-accent pt-8">
            <h3 className="font-serif text-2xl md:text-3xl">Visión</h3>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
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
