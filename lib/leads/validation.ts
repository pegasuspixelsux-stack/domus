import type { LeadInput } from "./types";

export type LeadValidationErrors = Partial<Record<keyof LeadInput, string>>;

export type LeadValidationResult =
  | { valid: true; data: LeadInput }
  | { valid: false; errors: LeadValidationErrors };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Name and at least one contact method (email or phone) are required — not
 * both. If email is filled in at all it must be well-formed, regardless of
 * whether phone is also present; if both are left blank, the error lands on
 * both fields so either one clears it.
 */
export function validateLeadInput(input: {
  name: string;
  email: string;
  phone: string;
  source: string;
}): LeadValidationResult {
  const errors: LeadValidationErrors = {};

  if (!input.name.trim()) errors.name = "El nombre es obligatorio.";

  const email = input.email.trim();
  const phone = input.phone.trim();

  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = "Ingrese un correo electrónico válido.";
  }

  if (!email && !phone) {
    const message = "Ingrese al menos un correo electrónico o un teléfono de contacto.";
    errors.email = errors.email ?? message;
    errors.phone = message;
  }

  if (!input.source.trim()) errors.source = "El origen es obligatorio.";

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      name: input.name.trim(),
      email,
      phone,
      source: input.source.trim(),
    },
  };
}
