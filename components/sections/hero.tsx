import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionLabel } from "@/components/ui/section-label";

export function Hero() {
  return (
    <section className="group relative flex min-h-screen items-end overflow-hidden border-b border-foreground/10 px-8 pt-32 pb-20 md:px-16 md:pb-28">
      <Image
        src="/images/coastal_brava.jpg"
        alt="Costa de Punta del Este"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center transition-transform duration-[2000ms] ease-out group-hover:scale-105"
      />
      {/* Localized scrim behind the text block only — the rest of the photo stays plain. */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-foreground/70" />

      <span className="pointer-events-none absolute top-24 right-8 hidden text-[10px] tracking-[0.3em] text-background/60 uppercase [writing-mode:vertical-rl] md:right-16 lg:block">
        Domus — Punta del Este
      </span>

      <Reveal className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-10 lg:pl-[8.33%]">
        <SectionLabel invert>Ocio e Inversión en Punta del Este</SectionLabel>

        <h1 className="max-w-2xl font-serif text-5xl leading-[0.95] tracking-tight text-background sm:text-6xl md:text-7xl lg:text-[5.5rem] lg:leading-[0.9]">
          Frente al mar,
          <br />
          pensado como <em className="text-accent italic">inversión</em>.
        </h1>

        <p className="max-w-md text-lg leading-relaxed text-background/75">
          Domus selecciona las propiedades más exclusivas de Punta del Este
          para quienes buscan calidad de vida y retorno seguro — desde
          residencias frente al mar hasta desarrollos en pozo con
          proyección excepcional.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button variant="primary" href="#propiedades">
            Ver Propiedades
          </Button>
          <Button variant="secondary" invert href="#contacto">
            Agendar una Visita
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
