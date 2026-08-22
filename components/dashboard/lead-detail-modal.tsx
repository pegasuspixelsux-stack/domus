"use client";

import { type FormEvent, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { LEAD_MANAGER_ROLES, type Role } from "@/lib/auth/rbac";
import { addActivity, fetchLeadActivities, reassignLead, updateLeadStatus } from "@/lib/leads/actions";
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPES, LEAD_STATUSES } from "@/lib/leads/constants";
import { CHAT_QUALIFICATION_MAX } from "@/lib/leads/prequalify-validation";
import type { Activity, ActivityType, Lead, LeadStatus } from "@/lib/leads/types";
import type { TeamMember } from "@/lib/team/data";

export function LeadDetailModal({
  lead,
  teamMembers,
  currentRole,
  onClose,
}: {
  lead: Lead;
  teamMembers: TeamMember[];
  currentRole: Role;
  onClose: () => void;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [status, setStatus] = useState(lead.status);
  const [assignedTo, setAssignedTo] = useState(lead.assignedTo);
  const [newActivityType, setNewActivityType] = useState<ActivityType>("call");
  const [newActivityNote, setNewActivityNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingActivities(true);
  }, [lead.id]);

  useEffect(() => {
    let cancelled = false;
    fetchLeadActivities(lead.id).then((result) => {
      if (!cancelled) {
        setActivities(result);
        setLoadingActivities(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lead.id]);

  function handleStatusChange(newStatus: LeadStatus) {
    const previous = status;
    setStatus(newStatus);
    setError(null);
    startTransition(async () => {
      try {
        await updateLeadStatus(lead.id, newStatus);
      } catch {
        setStatus(previous);
        setError("No se pudo actualizar el estado.");
      }
    });
  }

  function handleReassign(newAssignee: string) {
    const previous = assignedTo;
    setAssignedTo(newAssignee);
    setError(null);
    startTransition(async () => {
      try {
        await reassignLead(lead.id, newAssignee);
      } catch {
        setAssignedTo(previous);
        setError("No se pudo reasignar el lead.");
      }
    });
  }

  function handleAddActivity(event: FormEvent) {
    event.preventDefault();
    if (!newActivityNote.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await addActivity(lead.id, newActivityType, newActivityNote.trim());
        const fresh = await fetchLeadActivities(lead.id);
        setActivities(fresh);
        setNewActivityNote("");
      } catch {
        setError("No se pudo agregar la actividad.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-8">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-6 overflow-y-auto bg-background p-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-2xl">{lead.name}</h2>
              {lead.qualificationScore !== undefined && (
                <span
                  className="border border-accent px-2 py-0.5 text-xs tracking-[0.1em] text-accent uppercase"
                  title="Cantidad de señales de calificación (presupuesto, objetivo, zona, dormitorios, baños, urgencia, financiación, obstáculo, horario para llamar, cuándo quiere visitar) que aportó el visitante en el chat"
                >
                  Calificación {lead.qualificationScore}/{CHAT_QUALIFICATION_MAX}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {[lead.email, lead.phone].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-accent"
          >
            Cerrar
          </button>
        </div>

        {lead.notes && (
          <div className="flex flex-col gap-2 border border-foreground/10 bg-muted-background/40 p-4">
            <span className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Notas</span>
            <p className="text-sm leading-relaxed whitespace-pre-line">{lead.notes}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Estado</label>
            <select
              value={status}
              onChange={(event) => handleStatusChange(event.target.value as LeadStatus)}
              className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
            >
              {LEAD_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {LEAD_MANAGER_ROLES.includes(currentRole) && (
            <div className="flex flex-col gap-2">
              <label className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Asignado a</label>
              <select
                value={assignedTo}
                onChange={(event) => handleReassign(event.target.value)}
                className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
              >
                {teamMembers.map((member) => (
                  <option key={member.uid} value={member.uid}>
                    {member.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <h3 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Actividad</h3>
          {loadingActivities ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {activities.map((activity) => (
                <li key={activity.id} className="border-l border-foreground/20 pl-4">
                  <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase">
                    {ACTIVITY_TYPE_LABELS[activity.type]} ·{" "}
                    {new Date(activity.createdAt).toLocaleString("es-UY")}
                  </p>
                  <p className="mt-1 text-sm">{activity.note}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={handleAddActivity} className="flex flex-col gap-3 border-t border-foreground/10 pt-6">
          <h3 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Agregar Actividad</h3>
          <select
            value={newActivityType}
            onChange={(event) => setNewActivityType(event.target.value as ActivityType)}
            className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
          >
            {ACTIVITY_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <textarea
            value={newActivityNote}
            onChange={(event) => setNewActivityNote(event.target.value)}
            rows={3}
            placeholder="Ej: Llamé al cliente, interesado en visitar el próximo fin de semana."
            className="w-full border-b border-foreground/40 bg-transparent px-0 py-2 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
          />
          <Button type="submit" variant="secondary" disabled={pending} className="self-start">
            {pending ? "Guardando…" : "Agregar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
