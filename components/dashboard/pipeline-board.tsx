"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardCode,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/auth/rbac";
import { updateLeadStatus } from "@/lib/leads/actions";
import { LEAD_STATUSES } from "@/lib/leads/constants";
import type { Lead, LeadStatus } from "@/lib/leads/types";
import type { TeamMember } from "@/lib/team/data";
import { LeadCard } from "./lead-card";
import { LeadDetailModal } from "./lead-detail-modal";
import { NewLeadModal } from "./new-lead-modal";

function Column({
  status,
  label,
  leads,
  onCardClick,
}: {
  status: LeadStatus;
  label: string;
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col gap-3 border-t-4 p-3 transition-colors duration-500 ${
        isOver ? "border-t-accent bg-muted-background/50" : "border-t-foreground/20"
      }`}
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">{label}</h2>
        <span className="text-xs text-muted-foreground">{leads.length}</span>
      </div>
      <div className="flex flex-col gap-3">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onClick={() => onCardClick(lead)} />
        ))}
      </div>
    </div>
  );
}

export function PipelineBoard({
  leads: initialLeads,
  teamMembers,
  currentRole,
}: {
  leads: Lead[];
  teamMembers: TeamMember[];
  currentRole: Role;
}) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [creating, setCreating] = useState(false);
  // Passing `sensors` replaces dnd-kit's defaults, so KeyboardSensor must be
  // listed explicitly or keyboard dragging silently stops working.
  //
  // Its default start keys are Space *and* Enter, which would leave no key free
  // to open the lead detail modal. Space starts a drag; Enter is left to
  // LeadCard's onKeyDown for opening the modal (Enter still ends an in-flight
  // drag, and Escape still cancels one).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      keyboardCodes: {
        start: [KeyboardCode.Space],
        cancel: [KeyboardCode.Esc],
        end: [KeyboardCode.Space, KeyboardCode.Enter, KeyboardCode.Tab],
      },
    }),
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLeads(initialLeads);
  }, [initialLeads]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const leadId = String(active.id);
    const newStatus = over.id as LeadStatus;
    const lead = leads.find((entry) => entry.id === leadId);
    if (!lead || lead.status === newStatus) return;

    const previousStatus = lead.status;
    setLeads((current) => current.map((entry) => (entry.id === leadId ? { ...entry, status: newStatus } : entry)));

    try {
      await updateLeadStatus(leadId, newStatus);
      router.refresh();
    } catch {
      setLeads((current) =>
        current.map((entry) => (entry.id === leadId ? { ...entry, status: previousStatus } : entry)),
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Embudo de Ventas</h1>
        <Button variant="primary" onClick={() => setCreating(true)}>
          Nuevo Prospecto
        </Button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STATUSES.map((column) => (
            <Column
              key={column.value}
              status={column.value}
              label={column.label}
              leads={leads.filter((lead) => lead.status === column.value)}
              onCardClick={setSelectedLead}
            />
          ))}
        </div>
      </DndContext>

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          teamMembers={teamMembers}
          currentRole={currentRole}
          onClose={() => {
            setSelectedLead(null);
            router.refresh();
          }}
        />
      )}

      {creating && (
        <NewLeadModal
          onClose={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
