import type { ActivityType, LeadStatus } from "./types";

export const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "Nuevo" },
  { value: "contacted", label: "Contactado" },
  { value: "qualified", label: "Calificado" },
  { value: "visit_scheduled", label: "Visita Agendada" },
  { value: "negotiation", label: "Negociación" },
  { value: "won", label: "Ganado" },
  { value: "lost", label: "Perdido" },
];

export const STATUS_LABELS: Record<LeadStatus, string> = LEAD_STATUSES.reduce(
  (acc, { value, label }) => ({ ...acc, [value]: label }),
  {} as Record<LeadStatus, string>,
);

export const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: "call", label: "Llamada" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Correo" },
  { value: "note", label: "Nota" },
];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  ...ACTIVITY_TYPES.reduce(
    (acc, { value, label }) => ({ ...acc, [value]: label }),
    {} as Record<ActivityType, string>,
  ),
  status_change: "Cambio de Estado",
};
