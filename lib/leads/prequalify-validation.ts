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

export const BEDROOMS_OPTIONS = ["1", "2", "3", "4", "5 o más", "Prefiero no divulgar"];

export const BATHROOMS_OPTIONS = ["1", "2", "3", "4 o más", "Prefiero no divulgar"];

export interface PrequalifyInput {
  name: string;
  email: string;
  phone: string;
  budget: string;
  goal: string;
  zone: string;
  bedrooms: string;
  bathrooms: string;
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
  bedrooms: string;
  bathrooms: string;
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
  if (!BEDROOMS_OPTIONS.includes(input.bedrooms)) errors.bedrooms = "Seleccione una opción.";
  if (!BATHROOMS_OPTIONS.includes(input.bathrooms)) errors.bathrooms = "Seleccione una opción.";
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
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
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
  bedrooms: "Dormitorios",
  bathrooms: "Baños",
  urgency: "Urgencia",
  financing: "Financiamiento",
  obstacle: "Obstáculo",
};

/** All eight qualification signals tracked by both the /precalificacion wizard and the chat assistant. */
const QUALIFICATION_FIELDS = [
  "budget",
  "goal",
  "zone",
  "bedrooms",
  "bathrooms",
  "urgency",
  "financing",
  "obstacle",
] as const;

/** Upper bound of `computeQualificationScore` — every chat-sourced lead's score is out of this many signals. */
export const CHAT_QUALIFICATION_MAX = QUALIFICATION_FIELDS.length;

/** Composes the /precalificacion wizard's eight required answers into one free-text note. */
export function composePrequalifyNotes(data: {
  budget: string;
  goal: string;
  zone: string;
  bedrooms: string;
  bathrooms: string;
  urgency: string;
  financing: string;
  obstacle: string;
  notes: string;
}): string {
  const lines = QUALIFICATION_FIELDS.map((key) => `${PREQUALIFY_LABELS[key]}: ${data[key]}`);
  if (data.notes) {
    lines.push("", `Notas adicionales: ${data.notes}`);
  }
  return lines.join("\n");
}

/**
 * Chat-sourced leads rarely have all eight wizard fields — the visitor gives
 * whatever comes up in conversation. Composes only the fields actually
 * present, unlike composePrequalifyNotes which assumes the full wizard set.
 */
export function composeChatQualificationNotes(data: {
  budget?: string;
  goal?: string;
  zone?: string;
  bedrooms?: string;
  bathrooms?: string;
  urgency?: string;
  financing?: string;
  obstacle?: string;
  notes?: string;
}): string {
  const lines: string[] = [];
  for (const key of QUALIFICATION_FIELDS) {
    const value = data[key];
    if (value) lines.push(`${PREQUALIFY_LABELS[key]}: ${value}`);
  }
  if (data.notes) {
    if (lines.length > 0) lines.push("");
    lines.push(`Notas adicionales: ${data.notes}`);
  }
  return lines.join("\n");
}

/**
 * 0–{@link CHAT_QUALIFICATION_MAX}: how many of the wizard's qualification
 * signals a chat visitor actually volunteered. A rough completeness signal
 * for the sales team to triage with, not a predictive score. The wizard's
 * own leads don't get one — every field there is required, so it would
 * always read "8/8" and carry no information.
 */
export function computeQualificationScore(data: {
  budget?: string;
  goal?: string;
  zone?: string;
  bedrooms?: string;
  bathrooms?: string;
  urgency?: string;
  financing?: string;
  obstacle?: string;
}): number {
  return QUALIFICATION_FIELDS.filter((key) => Boolean(data[key])).length;
}
