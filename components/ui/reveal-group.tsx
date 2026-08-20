"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

/**
 * Wraps a grid of cards (feature/property/team/testimonial/step) so they
 * reveal in a cascading sequence the first time the grid scrolls into view,
 * instead of popping in all at once. Give each direct child `RevealGroupItem`.
 *
 * `Item` is exported separately rather than attached as `RevealGroup.Item` —
 * these are client components consumed from server-component sections, and
 * static properties on a component don't survive the server→client reference
 * boundary, only its own named export does.
 */
export function RevealGroup({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={container}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealGroupItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}
