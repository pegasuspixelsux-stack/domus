"use client";

import { useRouter } from "next/navigation";
import { type KeyboardEvent, useState } from "react";
import type { Role } from "@/lib/auth/rbac";
import { STATUS_LABELS } from "@/lib/leads/constants";
import type { Lead } from "@/lib/leads/types";
import type { TeamMember } from "@/lib/team/data";
import { LeadDetailModal } from "./lead-detail-modal";

/**
 * Plain list view of every lead the current role can see — an alternative
 * to the Pipeline kanban board for scanning/searching rather than managing
 * status by drag-and-drop. Opens the same LeadDetailModal Pipeline uses
 * (full lead data, the Notas block — which carries the /precalificacion
 * wizard's composed answers when the lead came from there — and the
 * activity log), so nothing about a lead lives only in one view.
 */
export function LeadsTable({
  leads,
  teamMembers,
  currentRole,
}: {
  leads: Lead[];
  teamMembers: TeamMember[];
  currentRole: Role;
}) {
  const router = useRouter();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const sorted = [...leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, lead: Lead) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedLead(lead);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-3xl">Leads</h1>

      {sorted.length === 0 ? (
        <p className="text-muted-foreground">No hay leads cargados todavía.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-foreground/20 text-xs tracking-[0.2em] text-muted-foreground uppercase">
                <th className="py-3 pr-4">Nombre</th>
                <th className="py-3 pr-4">Contacto</th>
                <th className="py-3 pr-4">Origen</th>
                <th className="py-3 pr-4">Estado</th>
                <th className="py-3 pr-4">Creado</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((lead) => (
                <tr
                  key={lead.id}
                  tabIndex={0}
                  role="button"
                  onClick={() => setSelectedLead(lead)}
                  onKeyDown={(event) => handleRowKeyDown(event, lead)}
                  className="cursor-pointer border-b border-foreground/10 transition-colors duration-500 hover:bg-muted-background/40"
                >
                  <td className="py-3 pr-4">{lead.name}</td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-col">
                      <span>{lead.email}</span>
                      <span className="text-muted-foreground">{lead.phone}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">{lead.source}</td>
                  <td className="py-3 pr-4">{STATUS_LABELS[lead.status] ?? lead.status}</td>
                  <td className="py-3 pr-4">{new Date(lead.createdAt).toLocaleDateString("es-UY")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
    </div>
  );
}
