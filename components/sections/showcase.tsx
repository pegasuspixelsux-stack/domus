import { Button } from "@/components/ui/button";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { Reveal } from "@/components/ui/reveal";
import { RevealGroup, RevealGroupItem } from "@/components/ui/reveal-group";
import { SectionLabel } from "@/components/ui/section-label";

const properties = [
  { title: "Residencia La Barra", location: "La Barra", tag: "Frente al Mar" },
  { title: "Edificio Rambla Mansa", location: "Península", tag: "En Pozo" },
  { title: "Casa Laguna del Sauce", location: "Laguna del Sauce", tag: "Terreno + Casa" },
  { title: "Torre Bikini", location: "José Ignacio", tag: "Preventa" },
  { title: "Chacra Manantiales", location: "Manantiales", tag: "Inversión Rural" },
  { title: "Penthouse Playa Brava", location: "Playa Brava", tag: "Exclusivo" },
];

export function Showcase() {
  return (
    <section id="propiedades" className="border-b border-foreground/10 px-8 py-20 md:px-16 md:py-32">
      <div className="mx-auto max-w-[1600px]">
        <Reveal className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between lg:mb-24">
          <div className="flex flex-col gap-6 lg:max-w-lg">
            <SectionLabel>Propiedades Destacadas</SectionLabel>
            <h2 className="font-serif text-4xl leading-[1] tracking-tight md:text-5xl lg:text-6xl">
              Residencias <em className="text-accent italic">seleccionadas</em>.
            </h2>
          </div>
          <Button variant="link" href="#contacto">
            Ver Todo el Portfolio
          </Button>
        </Reveal>

        <RevealGroup className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <RevealGroupItem key={property.title} className="group flex flex-col gap-4">
              <PlaceholderImage aspect="aspect-[4/5]" tone="blog" />
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-serif text-xl">{property.title}</h3>
                <span className="shrink-0 text-xs tracking-[0.2em] text-muted-foreground uppercase">
                  {property.tag}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{property.location}</p>
            </RevealGroupItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
