"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Lead } from "@/lib/leads/types";

export function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
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
