import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { SectionLabel } from "@/components/ui/section-label";

/**
 * Nosotros-only editorial take on "Quiénes Somos" — a separate component
 * from the shared QuienesSomos used on the homepage (same content, quite
 * different treatment) so restyling one page's narrative never touches the
 * other's. Continues the narrow max-w-4xl column opened in
 * mission-vision.tsx, no border-b before or after (see that file's doc
 * comment) so it reads as the same continuous article. The team photo sits
 * full-width above the text like a magazine feature's opening spread image,
 * instead of the homepage version's side-by-side split — a two-column
 * "module" is exactly what this page moves away from for its core story.
 */
export function NosotrosQuienesSomos() {
  return (
    <section className="px-8 py-12 md:px-16 md:py-16">
      <div className="mx-auto max-w-4xl">
        <Reveal className="relative aspect-[16/9] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <Image
            src="/images/equipo-domus.png"
            alt="El equipo de Domus"
            fill
            sizes="(min-width: 896px) 896px, 100vw"
            className="object-cover object-center"
          />
        </Reveal>

        <Reveal className="mt-12 flex flex-col gap-6 md:mt-16" delay={0.1}>
          <SectionLabel>Quiénes Somos</SectionLabel>
          <h2 className="font-serif text-3xl leading-[1.15] tracking-tight md:text-4xl">
            Una mirada <em className="text-accent italic">local</em>, un estándar internacional.
          </h2>

          <div className="mt-2 flex flex-col gap-6 text-lg leading-loose text-muted-foreground">
            <p>
              <span className="float-left mr-3 font-serif text-6xl leading-[0.8] text-foreground">
                D
              </span>
              esde hace más de una década, Domus acompaña a familias e inversores en la compra y
              venta de propiedades en Punta del Este. Conocemos cada barrio, cada desarrollo y
              cada matiz del mercado — porque vivimos acá, no solo trabajamos acá.
            </p>
            <p>
              Trabajamos con un portfolio reducido y curado: preferimos acompañar bien pocas
              operaciones que apurar muchas.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
