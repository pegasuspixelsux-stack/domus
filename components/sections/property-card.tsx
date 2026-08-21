import Link from "next/link";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import type { Property } from "@/lib/properties/types";

/**
 * The card treatment shared by the homepage showcase and the /propiedades
 * grid: photo, title/tag, location (+ price where asked for), and a
 * bed/bath/area stat line. Kept in one place so both call sites can't drift.
 */
export function PropertyCard({
  property,
  showPrice = false,
}: {
  property: Property;
  showPrice?: boolean;
}) {
  return (
    <Link href={`/propiedades/${property.id}`} className="group flex flex-col gap-4">
      {property.images[0] ? (
        <div className="relative aspect-square overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow duration-500 group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- property photo URLs are arbitrary admin-entered hosts, not in next.config.ts's image allowlist */}
          <img
            src={property.images[0]}
            alt={property.title}
            className="absolute inset-0 h-full w-full origin-center scale-100 object-cover grayscale transition-[transform,filter] duration-[1800ms] ease-out group-hover:scale-105 group-hover:grayscale-0"
          />
        </div>
      ) : (
        <PlaceholderImage aspect="aspect-square" tone="blog" />
      )}

      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-serif text-xl">{property.title}</h3>
        <span className="shrink-0 text-xs tracking-[0.2em] text-muted-foreground uppercase">
          {property.tag}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm text-muted-foreground">{property.location}</p>
        {showPrice && (
          <p className="text-sm text-foreground">
            {property.currency} {property.price.toLocaleString("es-UY")}
          </p>
        )}
      </div>

      <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase">
        {property.bedrooms} dorm · {property.bathrooms} baños · {property.areaM2} m²
      </p>
    </Link>
  );
}
