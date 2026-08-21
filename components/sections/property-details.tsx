import { Reveal } from "@/components/ui/reveal";
import { SectionLabel } from "@/components/ui/section-label";
import type { Property } from "@/lib/properties/types";

/**
 * Below-the-fold detail block for a property page: key stats, the
 * admin-entered feature list as chips, and the full description —
 * everything on the `Property` model that the hero doesn't already show.
 */
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysOnMarket(createdAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / MS_PER_DAY));
}

export function PropertyDetails({ property }: { property: Property }) {
  const days = daysOnMarket(property.createdAt);

  const stats = [
    { label: "Dormitorios", value: String(property.bedrooms) },
    { label: "Baños", value: String(property.bathrooms) },
    { label: "Precio", value: `${property.currency} ${property.price.toLocaleString("es-UY")}` },
    { label: "Superficie", value: `${property.areaM2} m²` },
    { label: "Tipo", value: property.tag },
    { label: "Días en el Mercado", value: String(days) },
  ];

  return (
    <section className="border-b border-foreground/10 px-8 py-20 md:px-16 md:py-32">
      <div className="mx-auto flex max-w-[760px] flex-col gap-16">
        <Reveal className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-2 border-t-4 border-t-accent pt-6">
              <span className="font-serif text-3xl whitespace-nowrap md:text-4xl">{stat.value}</span>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </Reveal>

        {property.features.length > 0 && (
          <Reveal delay={0.1} className="flex flex-col gap-4">
            <SectionLabel>Características</SectionLabel>
            <div className="flex flex-wrap gap-3">
              {property.features.map((feature) => (
                <span key={feature} className="border border-foreground/20 px-4 py-2 text-sm text-foreground">
                  {feature}
                </span>
              ))}
            </div>
          </Reveal>
        )}

        <Reveal delay={0.2} className="flex flex-col gap-6">
          <SectionLabel>Descripción</SectionLabel>
          <p className="max-w-2xl text-lg leading-relaxed whitespace-pre-line text-muted-foreground">
            {property.description}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
