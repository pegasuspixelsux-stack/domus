import Image from "next/image";
import { RevealGroup, RevealGroupItem } from "@/components/ui/reveal-group";
import { SectionLabel } from "@/components/ui/section-label";

export function QuienesSomos() {
  return (
    <section id="nosotros" className="border-b border-foreground/10 px-8 py-20 md:px-16 md:py-32">
      <RevealGroup className="mx-auto grid max-w-[1600px] grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-8">
        <RevealGroupItem className="lg:col-span-5">
          <div className="relative aspect-[4/3] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
            <Image
              src="/images/equipo-domus.png"
              alt="El equipo de Domus"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover object-center"
            />
          </div>
        </RevealGroupItem>

        <RevealGroupItem className="flex flex-col gap-8 lg:col-span-6 lg:col-start-7">
          <SectionLabel>Quiénes Somos</SectionLabel>

          <h2 className="font-serif text-4xl leading-[1] tracking-tight md:text-5xl lg:text-6xl">
            Una mirada <em className="text-accent italic">local</em>, un
            estándar internacional.
          </h2>

          <div className="max-w-xl text-base leading-relaxed text-muted-foreground">
            <p>
              <span className="float-left mr-3 font-serif text-7xl leading-[0.8] text-foreground">
                D
              </span>
              esde hace más de una década, Domus acompaña a familias e
              inversores en la compra y venta de propiedades en Punta del
              Este. Conocemos cada barrio, cada desarrollo y cada matiz del
              mercado — porque vivimos acá, no solo trabajamos acá.
            </p>
            <p className="mt-4">
              Trabajamos con un portfolio reducido y curado: preferimos
              acompañar bien pocas operaciones que apurar muchas.
            </p>
          </div>
        </RevealGroupItem>
      </RevealGroup>
    </section>
  );
}
