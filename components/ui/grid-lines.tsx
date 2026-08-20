/**
 * Four fixed vertical gridlines spanning the viewport height, aligned to the
 * container's edges and middle thirds. Purely decorative — creates the
 * editorial-magazine structure called for by the design system. Desktop only.
 */
export function GridLines() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40 hidden lg:block"
    >
      <div className="relative mx-auto h-full max-w-[1600px] px-16">
        <div className="absolute inset-y-0 left-16 w-px bg-foreground/10" />
        <div className="absolute inset-y-0 left-1/3 w-px bg-foreground/10" />
        <div className="absolute inset-y-0 right-1/3 w-px bg-foreground/10" />
        <div className="absolute inset-y-0 right-16 w-px bg-foreground/10" />
      </div>
    </div>
  );
}
