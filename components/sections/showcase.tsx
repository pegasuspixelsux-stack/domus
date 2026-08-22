import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { RevealGroup, RevealGroupItem } from "@/components/ui/reveal-group";
import { SectionLabel } from "@/components/ui/section-label";
import { getPublicShowcaseProperties } from "@/lib/properties/data";
import { PropertyCard } from "./property-card";

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
          <RevealGroup className="-mx-8 flex snap-x snap-mandatory gap-6 overflow-x-auto px-8 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-16 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
            {properties.map((property) => (
              <RevealGroupItem key={property.id} className="w-[80%] shrink-0 snap-center sm:w-auto sm:shrink">
                <PropertyCard property={property} />
              </RevealGroupItem>
            ))}
          </RevealGroup>
        )}
      </div>
    </section>
  );
}
