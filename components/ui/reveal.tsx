"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

/** The design system's signature slow, deliberate easing. */
const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const variants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Fades and lifts its children into place the first time they scroll into
 * view — the page's one scroll-motion primitive, kept slow and cinematic
 * per the design system (long duration, custom ease, never mechanical).
 * Triggers once; safe to nest inside a `RevealGroup` for staggered grids.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants}
      transition={{ duration: 0.9, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
