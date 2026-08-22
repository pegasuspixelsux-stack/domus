import type { PropertyStatus } from "./types";

export const PROPERTY_STATUSES: { value: PropertyStatus; label: string }[] = [
  { value: "available", label: "Disponible" },
  { value: "reserved", label: "Reservada" },
  { value: "sold", label: "Vendida" },
];

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = PROPERTY_STATUSES.reduce(
  (acc, { value, label }) => ({ ...acc, [value]: label }),
  {} as Record<PropertyStatus, string>,
);
