import { Button } from "@/components/ui/button";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { Reveal } from "@/components/ui/reveal";
import { RevealGroup, RevealGroupItem } from "@/components/ui/reveal-group";
import { SectionLabel } from "@/components/ui/section-label";
import { getPublicShowcaseProperties } from "@/lib/properties/data";

export async function Showcase() {
  const properties = await getPublicShowcaseProperties();

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
          <Button variant="link" href="/propiedades">
            Ver Todo el Portfolio
          </Button>
        </Reveal>

        {properties.length === 0 ? (
          <p className="text-muted-foreground">
            Próximamente nuevas residencias destacadas — contáctenos para conocer el portfolio completo.
          </p>
        ) : (
          <RevealGroup className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <RevealGroupItem key={property.id} className="group flex flex-col gap-4">
                {property.images[0] ? (
                  <div className="relative aspect-[4/5] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow duration-500 group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                    {/* eslint-disable-next-line @next/next/no-img-element -- property photo URLs are arbitrary admin-entered hosts, not in next.config.ts's image allowlist */}
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="absolute inset-0 h-full w-full origin-center scale-100 object-cover grayscale transition-[transform,filter] duration-[1800ms] ease-out group-hover:scale-105 group-hover:grayscale-0"
                    />
                  </div>
                ) : (
                  <PlaceholderImage aspect="aspect-[4/5]" tone="blog" />
                )}
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
        )}
      </div>
    </section>
  );
}
