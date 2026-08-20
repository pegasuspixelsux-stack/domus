import type { PropertyInput, PropertyStatus } from "./types";

const STATUSES: PropertyStatus[] = ["available", "reserved", "sold"];

export type PropertyValidationErrors = Partial<Record<keyof PropertyInput, string>>;

export type PropertyValidationResult =
  | { valid: true; data: PropertyInput }
  | { valid: false; errors: PropertyValidationErrors };

export function validatePropertyInput(input: {
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  tag: string;
  status: string;
  images: string[];
  features: string[];
  bedrooms: number;
  bathrooms: number;
  areaM2: number;
}): PropertyValidationResult {
  const errors: PropertyValidationErrors = {};

  if (!input.title.trim()) errors.title = "El título es obligatorio.";
  if (!input.description.trim()) errors.description = "La descripción es obligatoria.";
  if (!Number.isFinite(input.price) || input.price <= 0) {
    errors.price = "El precio debe ser un número mayor a cero.";
  }
  if (!input.currency.trim()) errors.currency = "La moneda es obligatoria.";
  if (!input.location.trim()) errors.location = "La ubicación es obligatoria.";
  if (!input.tag.trim()) errors.tag = "La etiqueta es obligatoria.";
  if (!STATUSES.includes(input.status as PropertyStatus)) {
    errors.status = "El estado no es válido.";
  }
  if (!input.images.some((url) => url.trim())) {
    errors.images = "Agregue al menos una imagen.";
  }
  if (!Number.isInteger(input.bedrooms) || input.bedrooms < 0) {
    errors.bedrooms = "Los dormitorios deben ser un número entero mayor o igual a cero.";
  }
  if (!Number.isInteger(input.bathrooms) || input.bathrooms < 0) {
    errors.bathrooms = "Los baños deben ser un número entero mayor o igual a cero.";
  }
  if (!Number.isFinite(input.areaM2) || input.areaM2 <= 0) {
    errors.areaM2 = "La superficie debe ser un número mayor a cero.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      price: input.price,
      currency: input.currency.trim(),
      location: input.location.trim(),
      tag: input.tag.trim(),
      status: input.status as PropertyStatus,
      images: input.images.map((url) => url.trim()).filter(Boolean),
      features: input.features.map((f) => f.trim()).filter(Boolean),
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      areaM2: input.areaM2,
    },
  };
}
