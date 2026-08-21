import type { Role } from "@/lib/auth/rbac";

const ROLES: Role[] = ["admin", "manager", "sales"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UserInput {
  displayName: string;
  email: string;
  role: Role;
}

export type UserValidationErrors = Partial<Record<keyof UserInput, string>>;

export type UserValidationResult =
  | { valid: true; data: UserInput }
  | { valid: false; errors: UserValidationErrors };

export function validateUserInput(input: {
  displayName: string;
  email: string;
  role: string;
}): UserValidationResult {
  const errors: UserValidationErrors = {};

  if (!input.displayName.trim()) errors.displayName = "El nombre es obligatorio.";

  if (!input.email.trim()) {
    errors.email = "El correo electrónico es obligatorio.";
  } else if (!EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = "Ingrese un correo electrónico válido.";
  }

  if (!ROLES.includes(input.role as Role)) {
    errors.role = "Seleccione un rol válido.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      displayName: input.displayName.trim(),
      email: input.email.trim(),
      role: input.role as Role,
    },
  };
}
