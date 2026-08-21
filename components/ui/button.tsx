import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "link";

type ButtonOwnProps = {
  variant?: ButtonVariant;
  /** Use on dark (inverted) sections so the button reads correctly. */
  invert?: boolean;
  href?: string;
  /** Forwarded to the underlying `Link` when `href` is set — use "_blank" for external links (e.g. WhatsApp). */
  target?: string;
  className?: string;
  children: ReactNode;
};

type ButtonProps = ButtonOwnProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof ButtonOwnProps>;

const EASE = "ease-[cubic-bezier(0.25,0.46,0.45,0.94)]";

function variantClasses(variant: ButtonVariant, invert: boolean) {
  switch (variant) {
    case "primary":
      return [
        "group relative inline-flex h-12 items-center justify-center overflow-hidden px-8",
        "text-xs font-medium uppercase tracking-[0.2em]",
        invert ? "text-foreground" : "text-white",
        "shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-shadow duration-500 hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]",
      ].join(" ");
    case "secondary":
      return [
        "inline-flex h-12 items-center justify-center border px-8",
        "text-xs font-medium uppercase tracking-[0.2em] transition-colors duration-500",
        invert
          ? "border-background text-background hover:bg-background hover:text-foreground"
          : "border-foreground text-foreground hover:bg-foreground hover:text-background",
      ].join(" ");
    case "link":
      return [
        "inline-flex items-center text-[13px] font-medium tracking-[0.1em]",
        "underline-offset-4 transition-colors duration-500 hover:underline",
        invert ? "text-background hover:text-accent" : "text-foreground hover:text-accent",
      ].join(" ");
  }
}

/**
 * The design system's three button treatments:
 * - primary: dark fill, gold overlay slides in from the left on hover
 * - secondary: outlined, fills solid on hover
 * - link: text only, underlines on hover
 *
 * Renders as a Next.js `Link` when `href` is given, a `<button>` otherwise.
 */
export function Button({
  variant = "primary",
  invert = false,
  href,
  target,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classes = `${variantClasses(variant, invert)} ${className}`.trim();

  const inner =
    variant === "primary" ? (
      <>
        <span className={`absolute inset-0 ${invert ? "bg-background" : "bg-foreground"}`} />
        <span
          className={`absolute inset-0 -translate-x-full bg-accent transition-transform duration-500 ${EASE} group-hover:translate-x-0`}
        />
        <span className="relative z-10">{children}</span>
      </>
    ) : (
      children
    );

  if (href) {
    return (
      <Link
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className={classes}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {inner}
    </button>
  );
}
