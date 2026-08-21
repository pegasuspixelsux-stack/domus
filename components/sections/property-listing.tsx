"use client";

import { useMemo, useState } from "react";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { RevealGroup, RevealGroupItem } from "@/components/ui/reveal-group";
import type { Property } from "@/lib/properties/types";

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5];

/**
 * Two-column property browser: instant client-side filters on the left,
 * results grid on the right. Filter option lists (location, tag) are
 * derived from the properties actually passed in rather than a fixed enum,
 * since both fields are free text on the `Property` model.
 */
export function PropertyListing({ properties }: { properties: Property[] }) {
  const locations = useMemo(
    () => Array.from(new Set(properties.map((p) => p.location))).sort((a, b) => a.localeCompare(b)),
    [properties],
  );
  const tags = useMemo(
    () => Array.from(new Set(properties.map((p) => p.tag))).sort((a, b) => a.localeCompare(b)),
    [properties],
  );

  const [location, setLocation] = useState("");
  const [tag, setTag] = useState("");
  const [minBedrooms, setMinBedrooms] = useState(0);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const filtered = useMemo(() => {
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;
    return properties.filter((property) => {
      if (location && property.location !== location) return false;
      if (tag && property.tag !== tag) return false;
      if (minBedrooms && property.bedrooms < minBedrooms) return false;
      if (min !== null && property.price < min) return false;
      if (max !== null && property.price > max) return false;
      return true;
    });
  }, [properties, location, tag, minBedrooms, minPrice, maxPrice]);

  const hasActiveFilters = Boolean(location || tag || minBedrooms || minPrice || maxPrice);

  function clearFilters() {
    setLocation("");
    setTag("");
    setMinBedrooms(0);
    setMinPrice("");
    setMaxPrice("");
  }

  return (
    <section className="px-8 py-16 md:px-16 md:py-24">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
        <aside className="flex w-full shrink-0 flex-col gap-8 lg:w-64">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Filtros</span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs tracking-[0.1em] text-muted-foreground underline-offset-4 transition-colors duration-500 hover:text-accent hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>

          <FilterSelect id="location" label="Ubicación" value={location} onChange={setLocation} options={locations} />
          <FilterSelect id="tag" label="Tipo" value={tag} onChange={setTag} options={tags} />

          <div className="flex flex-col gap-2">
            <label htmlFor="bedrooms" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Dormitorios
            </label>
            <select
              id="bedrooms"
              value={minBedrooms}
              onChange={(event) => setMinBedrooms(Number(event.target.value))}
              className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
            >
              <option value={0}>Cualquiera</option>
              {BEDROOM_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Precio</span>
            <div className="flex items-center gap-3">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Mín."
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                aria-label="Precio mínimo"
                className="h-12 w-full min-w-0 border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:border-accent focus-visible:outline-none"
              />
              <span className="text-muted-foreground">–</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Máx."
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                aria-label="Precio máximo"
                className="h-12 w-full min-w-0 border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:border-accent focus-visible:outline-none"
              />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <p className="mb-8 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "propiedad" : "propiedades"}
          </p>

          {filtered.length === 0 ? (
            <p className="text-muted-foreground">
              Ninguna propiedad coincide con estos filtros — pruebe ajustarlos.
            </p>
          ) : (
            <RevealGroup className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((property) => (
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
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-sm text-muted-foreground">{property.location}</p>
                    <p className="text-sm text-foreground">
                      {property.currency} {property.price.toLocaleString("es-UY")}
                    </p>
                  </div>
                </RevealGroupItem>
              ))}
            </RevealGroup>
          )}
        </div>
      </div>
    </section>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
      >
        <option value="">Todas</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
