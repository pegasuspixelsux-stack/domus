const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NOTES_LENGTH = 2000;

export const BUDGET_OPTIONS = [
  "Menos de USD 200.000",
  "USD 200.000 – 500.000",
  "USD 500.000 – 1.000.000",
  "Más de USD 1.000.000",
  "Prefiero no divulgar",
];

export const GOAL_OPTIONS = [
  "Vivienda principal",
  "Segunda residencia / vacacional",
  "Inversión / renta",
  "Prefiero no divulgar",
];

export const ZONE_OPTIONS = [
  "Playa Brava",
  "Playa Mansa",
  "La Barra",
  "José Ignacio",
  "Manantiales",
  "Punta Ballena",
  "Otra / No estoy seguro",
  "Prefiero no divulgar",
];

export const URGENCY_OPTIONS = [
  "Inmediata (0–3 meses)",
  "Corto plazo (3–6 meses)",
  "Mediano plazo (6–12 meses)",
  "Sin apuro / explorando",
  "Prefiero no divulgar",
];

export const FINANCING_OPTIONS = [
  "Pago de contado",
  "Financiamiento bancario",
  "Aún evaluando opciones",
  "Prefiero no divulgar",
];

export const OBSTACLE_OPTIONS = [
  "Ninguno por el momento",
  "Definir presupuesto",
  "Vender otra propiedad primero",
  "Trámites de residencia/visa",
  "Otro",
  "Prefiero no divulgar",
];

export interface PrequalifyInput {
  name: string;
  email: string;
  phone: string;
  budget: string;
  goal: string;
  zone: string;
  urgency: string;
  financing: string;
  obstacle: string;
  notes: string;
}

export type PrequalifyValidationErrors = Partial<Record<keyof PrequalifyInput, string>>;

export type PrequalifyValidationResult =
  | { valid: true; data: PrequalifyInput }
  | { valid: false; errors: PrequalifyValidationErrors };

/**
 * Validates every field submitted by the /precalificacion wizard. The six
 * select fields are checked against their known option lists — this is a
 * public, unauthenticated action, so it's defense in depth against garbage
 * values rather than data the app later depends on being exactly one of
 * these strings (they only ever get composed into a free-text note).
 */
export function validatePrequalifyInput(input: {
  name: string;
  email: string;
  phone: string;
  budget: string;
  goal: string;
  zone: string;
  urgency: string;
  financing: string;
  obstacle: string;
  notes: string;
}): PrequalifyValidationResult {
  const errors: PrequalifyValidationErrors = {};

  if (!input.name.trim()) errors.name = "El nombre es obligatorio.";

  if (!input.email.trim()) {
    errors.email = "El correo electrónico es obligatorio.";
  } else if (!EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = "Ingrese un correo electrónico válido.";
  }

  if (!input.phone.trim()) errors.phone = "El teléfono es obligatorio.";

  if (!BUDGET_OPTIONS.includes(input.budget)) errors.budget = "Seleccione un presupuesto.";
  if (!GOAL_OPTIONS.includes(input.goal)) errors.goal = "Seleccione un objetivo.";
  if (!ZONE_OPTIONS.includes(input.zone)) errors.zone = "Seleccione una zona.";
  if (!URGENCY_OPTIONS.includes(input.urgency)) errors.urgency = "Seleccione una urgencia.";
  if (!FINANCING_OPTIONS.includes(input.financing)) errors.financing = "Seleccione una opción.";
  if (!OBSTACLE_OPTIONS.includes(input.obstacle)) errors.obstacle = "Seleccione una opción.";

  if (input.notes.length > MAX_NOTES_LENGTH) {
    errors.notes = `Máximo ${MAX_NOTES_LENGTH} caracteres.`;
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      budget: input.budget,
      goal: input.goal,
      zone: input.zone,
      urgency: input.urgency,
      financing: input.financing,
      obstacle: input.obstacle,
      notes: input.notes.trim(),
    },
  };
}

const PREQUALIFY_LABELS: Record<string, string> = {
  budget: "Presupuesto",
  goal: "Objetivo",
  zone: "Zona",
  urgency: "Urgencia",
  financing: "Financiamiento",
  obstacle: "Obstáculo",
};

/** Composes the /precalificacion wizard's six required answers into one free-text note. */
export function composePrequalifyNotes(data: {
  budget: string;
  goal: string;
  zone: string;
  urgency: string;
  financing: string;
  obstacle: string;
  notes: string;
}): string {
  const lines = (["budget", "goal", "zone", "urgency", "financing", "obstacle"] as const).map(
    (key) => `${PREQUALIFY_LABELS[key]}: ${data[key]}`,
  );
  if (data.notes) {
    lines.push("", `Notas adicionales: ${data.notes}`);
  }
  return lines.join("\n");
}

/**
 * Chat-sourced leads rarely have all six wizard fields — the visitor gives
 * whatever comes up in conversation. Composes only the fields actually
 * present, unlike composePrequalifyNotes which assumes the full wizard set.
 */
export function composeChatQualificationNotes(data: {
  budget?: string;
  zone?: string;
  timeline?: string;
  notes?: string;
}): string {
  const lines: string[] = [];
  if (data.budget) lines.push(`Presupuesto: ${data.budget}`);
  if (data.zone) lines.push(`Zona: ${data.zone}`);
  if (data.timeline) lines.push(`Plazo: ${data.timeline}`);
  if (data.notes) {
    if (lines.length > 0) lines.push("");
    lines.push(`Notas adicionales: ${data.notes}`);
  }
  return lines.join("\n");
}

/**
 * 0–3: how many of the three qualification signals (budget, zone, timeline)
 * a chat visitor actually volunteered. A rough completeness signal for the
 * sales team to triage with, not a predictive score. The wizard's own leads
 * don't get one — every field there is required, so it would always read
 * "6/6" and carry no information.
 */
export function computeQualificationScore(data: { budget?: string; zone?: string; timeline?: string }): number {
  return [data.budget, data.zone, data.timeline].filter(Boolean).length;
}
