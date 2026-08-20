/**
 * Uppercase overline label preceded by a short decorative line — the
 * recurring "editorial kicker" element used above every section headline.
 */
export function SectionLabel({
  children,
  invert = false,
  className = "",
}: {
  children: React.ReactNode;
  invert?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span
        className={`h-px w-8 md:w-12 ${invert ? "bg-background/40" : "bg-foreground/40"}`}
      />
      <span
        className={`text-xs uppercase tracking-[0.3em] ${
          invert ? "text-background/70" : "text-muted-foreground"
        }`}
      >
        {children}
      </span>
    </div>
  );
}
