import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RevealGroup, RevealGroupItem } from "@/components/ui/reveal-group";
import { SectionLabel } from "@/components/ui/section-label";

export function CtaFooter() {
  return (
    <section id="contacto" className="bg-foreground px-8 py-20 text-background md:px-16 md:py-32">
      <RevealGroup className="mx-auto flex max-w-[1600px] flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
        <RevealGroupItem className="flex flex-col gap-6 lg:max-w-xl">
          <SectionLabel invert>Agendemos una Visita</SectionLabel>
          <h2 className="font-serif text-4xl leading-[0.95] tracking-tight md:text-5xl lg:text-6xl">
            Su próxima propiedad en Punta del Este empieza con una{" "}
            <em className="text-accent italic">conversación</em>.
          </h2>
          <p className="max-w-md text-base leading-relaxed text-background/70">
            Cuéntenos qué está buscando. Un asesor de Domus se pondrá en
            contacto dentro de las 24 horas hábiles.
          </p>
        </RevealGroupItem>

        <RevealGroupItem className="w-full lg:w-auto lg:max-w-md">
          <form className="flex w-full flex-col gap-4 sm:flex-row">
            <input
              type="email"
              required
              placeholder="Su correo electrónico"
              className="h-12 w-full border-b border-background/40 bg-transparent px-0 font-serif text-sm text-background italic placeholder:text-background/50 focus-visible:border-accent focus-visible:outline-none sm:min-w-[280px]"
            />
            <Button type="submit" variant="primary" invert>
              Contactar
            </Button>
          </form>
        </RevealGroupItem>
      </RevealGroup>

      <div className="mx-auto mt-24 grid max-w-[1600px] grid-cols-2 gap-x-8 gap-y-12 border-t border-background/10 pt-16 md:grid-cols-4 md:gap-12">
        <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
          <span className="font-serif text-xl tracking-tight text-background">Domus</span>
          <p className="max-w-xs text-sm leading-relaxed text-background/70">
            Domus selecciona propiedades de ocio e inversión en Punta del Este, acompañando a
            cada cliente de principio a fin.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs tracking-[0.2em] text-background/50 uppercase">Menú</span>
          <nav className="flex flex-col gap-2 text-sm text-background/70">
            <Link href="/propiedades" className="w-fit transition-colors duration-500 hover:text-accent">
              Propiedades
            </Link>
            <Link href="/nosotros" className="w-fit transition-colors duration-500 hover:text-accent">
              Nosotros
            </Link>
            <Link href="/precalificacion" className="w-fit transition-colors duration-500 hover:text-accent">
              Precalificación
            </Link>
            <Link href="#testimonios" className="w-fit transition-colors duration-500 hover:text-accent">
              Testimonios
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs tracking-[0.2em] text-background/50 uppercase">Contacto</span>
          <div className="flex flex-col gap-2 text-sm text-background/70">
            <span>[Teléfono / WhatsApp a confirmar]</span>
            <span>[Correo a confirmar]</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs tracking-[0.2em] text-background/50 uppercase">Horario y Ubicación</span>
          <div className="flex flex-col gap-2 text-sm text-background/70">
            <span>[Horario de atención a confirmar]</span>
            <span>[Dirección a confirmar]</span>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-[1600px] flex-col items-center justify-between gap-4 border-t border-background/10 pt-8 text-[10px] tracking-[0.2em] text-background/50 uppercase sm:flex-row">
        <span>© 2026 Domus Punta del Este. Todos los derechos reservados.</span>
        <div className="flex items-center gap-6">
          <span>Propiedades de ocio e inversión.</span>
          <Link href="/login" className="transition-colors duration-500 hover:text-accent">
            Acceso Equipo
          </Link>
        </div>
      </div>
    </section>
  );
}
