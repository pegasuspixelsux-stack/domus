"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { Reveal } from "@/components/ui/reveal";
import { SectionLabel } from "@/components/ui/section-label";
import type { Property } from "@/lib/properties/types";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const STATUS_LABELS: Record<string, string> = {
  reserved: "Reservada",
  sold: "Vendida",
};

/**
 * Full-bleed hero for a property detail page: cycles through every photo,
 * shown plain (no grayscale/hover effect, unlike the homepage `Hero`) since
 * the photos themselves are the point here — only the bottom third carries a
 * scrim, just enough to keep the text block legible. Manual navigation only
 * (arrows + dots) — no autoplay. Arrows/dots are omitted entirely for 0–1
 * photos.
 */
export function PropertyHero({ property }: { property: Property }) {
  const [index, setIndex] = useState(0);
  const images = property.images;
  const hasMultiple = images.length > 1;

  function next() {
    setIndex((i) => (i + 1) % images.length);
  }
  function prev() {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }

  return (
    <section className="relative flex min-h-[95vh] items-end overflow-hidden border-b border-foreground/10 px-8 pt-32 pb-20 md:min-h-screen md:px-16 md:pb-28">
      {images.length > 0 ? (
        <AnimatePresence>
          <motion.img
            key={images[index]}
            src={images[index]}
            alt={`${property.title} — foto ${index + 1} de ${images.length}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: EASE }}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </AnimatePresence>
      ) : (
        <PlaceholderImage fill tone="hero" />
      )}

      {/* Localized scrim behind the text block only — the rest of the photo stays plain. */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-foreground/80 to-transparent" />

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Foto anterior"
            className="absolute top-1/2 left-4 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-background/40 text-lg text-background transition-colors duration-500 hover:border-accent hover:text-accent md:left-8"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Foto siguiente"
            className="absolute top-1/2 right-4 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-background/40 text-lg text-background transition-colors duration-500 hover:border-accent hover:text-accent md:right-8"
          >
            ›
          </button>

          <div className="absolute right-8 bottom-8 z-10 flex gap-2 md:right-16">
            {images.map((image, i) => (
              <button
                key={image}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 w-6 transition-colors duration-500 ${
                  i === index ? "bg-accent" : "bg-background/40 hover:bg-background/70"
                }`}
              />
            ))}
          </div>
        </>
      )}

      <Reveal className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col gap-6 lg:pl-[8.33%]">
        <div className="flex items-center gap-4">
          <SectionLabel invert>{property.location}</SectionLabel>
          {property.status !== "available" && (
            <span className="text-xs tracking-[0.2em] text-accent uppercase">
              {STATUS_LABELS[property.status]}
            </span>
          )}
        </div>

        <h1 className="max-w-2xl font-serif text-5xl leading-[0.95] tracking-tight text-background sm:text-6xl md:text-7xl">
          {property.title}
        </h1>
      </Reveal>
    </section>
  );
}
