"use client";

import { useDraggable } from "@dnd-kit/core";
import type { KeyboardEvent } from "react";
import type { Lead } from "@/lib/leads/types";

export function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  // `touchAction: "none"` is required by dnd-kit's PointerSensor: without it the
  // browser claims the touch gesture for scrolling the board's overflow-x
  // container instead of letting a drag start.
  const style = {
    touchAction: "none" as const,
    ...(transform
      ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
      : {}),
  };

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // KeyboardSensor's activator is also an `onKeyDown` on this node, so run it
    // first — spreading `listeners` alone would be shadowed by this prop.
    listeners?.onKeyDown?.(event);

    // If the sensor claimed the key (it preventDefaults when starting a drag),
    // or a drag is already in flight, this is a drag interaction, not a click.
    if (event.defaultPrevented || isDragging) return;

    // dnd-kit's `attributes` stamp role="button"/tabIndex={0}, but React does
    // not synthesize a click for Enter/Space on a div — without this a keyboard
    // user can never open the detail modal.
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`cursor-grab border border-foreground/10 bg-background p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-shadow duration-500 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <h3 className="font-serif text-lg">{lead.name}</h3>
      <p className="mt-1 text-xs tracking-[0.15em] text-muted-foreground uppercase">{lead.source}</p>
      <p className="mt-2 text-sm text-muted-foreground">{lead.phone}</p>
    </div>
  );
}
