import type { LeadInput } from "./types";

export type LeadValidationErrors = Partial<Record<keyof LeadInput, string>>;

export type LeadValidationResult =
  | { valid: true; data: LeadInput }
  | { valid: false; errors: LeadValidationErrors };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLeadInput(input: {
  name: string;
  email: string;
  phone: string;
  source: string;
}): LeadValidationResult {
  const errors: LeadValidationErrors = {};

  if (!input.name.trim()) errors.name = "El nombre es obligatorio.";

  if (!input.email.trim()) {
    errors.email = "El correo electrónico es obligatorio.";
  } else if (!EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = "Ingrese un correo electrónico válido.";
  }

  if (!input.phone.trim()) errors.phone = "El teléfono es obligatorio.";
  if (!input.source.trim()) errors.source = "El origen es obligatorio.";

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      source: input.source.trim(),
    },
  };
}
