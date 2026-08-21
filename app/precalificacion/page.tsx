import Image from "next/image";
import { CtaFooter } from "@/components/sections/cta-footer";
import { Header } from "@/components/sections/header";
import { PrequalificationWizard } from "@/components/sections/prequalification-wizard";
import { Reveal } from "@/components/ui/reveal";
import { SectionLabel } from "@/components/ui/section-label";

export default function PrecalificacionPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <section className="relative flex min-h-[50vh] items-end overflow-hidden border-b border-foreground/10 px-8 pt-32 pb-16 md:px-16 md:pb-20">
          <Image
            src="/images/coastal_brava.jpg"
            alt="Costa de Punta del Este"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-foreground/80 to-transparent" />

          <Reveal className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-6">
            <SectionLabel invert>Precalificación</SectionLabel>
            <h1 className="max-w-2xl font-serif text-4xl leading-[1] tracking-tight text-background md:text-5xl lg:text-6xl">
              Cuéntenos qué busca, nosotros hacemos la <em className="text-accent italic">búsqueda</em>.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-background/75">
              Tres minutos de preguntas nos alcanzan para armarle una selección curada y
              personalizada — sin que tenga que revisar todo el portfolio usted mismo.
            </p>
          </Reveal>
        </section>

        <section className="px-8 py-20 md:px-16 md:py-32">
          <PrequalificationWizard />
        </section>

        <CtaFooter />
      </main>
    </div>
  );
}
