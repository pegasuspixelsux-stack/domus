const SHADOWS = {
  hero: "shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
  feature: "shadow-[0_4px_24px_rgba(0,0,0,0.08)]",
  blog: "shadow-[0_4px_20px_rgba(0,0,0,0.06)] group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
} as const;

/**
 * Stand-in for a real photograph, occupying the exact slot and treatment a
 * `next/image` would use: inner border, soft shadow that deepens on hover,
 * and the signature grayscale → color reveal.
 *
 * Swap in a real image by replacing the inner gradient `div` with
 * `<Image fill className="object-cover grayscale transition-[transform,filter] duration-[1800ms] ease-out group-hover:scale-105 group-hover:grayscale-0" .../>`
 * — the wrapper and hover choreography stay the same.
 *
 * Pass `fill` for a full-bleed background use (e.g. a hero backdrop) instead
 * of a boxed card — it drops the aspect ratio, shadow, and inner border and
 * absolutely positions itself to cover its (relatively positioned) parent.
 */
export function PlaceholderImage({
  aspect = "aspect-[3/4]",
  tone = "feature",
  fill = false,
  className = "",
}: {
  aspect?: string;
  tone?: keyof typeof SHADOWS;
  fill?: boolean;
  className?: string;
}) {
  return (
    <div
      className={
        fill
          ? `absolute inset-0 overflow-hidden ${className}`
          : `relative overflow-hidden ${aspect} ${SHADOWS[tone]} shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] transition-shadow duration-500 ${className}`
      }
    >
      <div
        className="absolute inset-0 origin-center scale-100 bg-[linear-gradient(155deg,#c9a769_0%,#8a7256_45%,#2b2621_100%)] grayscale transition-[transform,filter] duration-[1800ms] ease-out group-hover:scale-105 group-hover:grayscale-0"
      />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(115deg,rgba(0,0,0,0.05)_0px,rgba(0,0,0,0.05)_1px,transparent_1px,transparent_3px)]" />
    </div>
  );
}
