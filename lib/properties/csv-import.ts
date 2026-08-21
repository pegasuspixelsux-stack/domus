import Papa from "papaparse";
import type { PropertyInput, PropertyStatus } from "./types";

export interface PropertyImportRowError {
  row: number;
  errors: Record<string, string>;
}

export interface PropertyImportResult {
  valid: { row: number; data: PropertyInput }[];
  invalid: PropertyImportRowError[];
}

const DEFAULT_STATUS: PropertyStatus = "available";
const DEFAULT_CURRENCY = "USD";

interface ImportRowInput {
  title: string;
  description: string;
  price: number;
  location: string;
  tag: string;
  bedrooms: number;
  bathrooms: number;
  areaM2: number;
}

type CoreFields = Pick<
  PropertyInput,
  "title" | "description" | "price" | "location" | "tag" | "bedrooms" | "bathrooms" | "areaM2"
>;

type ImportRowValidationResult =
  | { valid: true; data: CoreFields }
  | { valid: false; errors: Record<string, string> };

function validateImportRow(input: ImportRowInput): ImportRowValidationResult {
  const errors: Record<string, string> = {};

  if (!input.title.trim()) errors.title = "El título es obligatorio.";
  if (!input.description.trim()) errors.description = "La descripción es obligatoria.";
  if (!Number.isFinite(input.price) || input.price <= 0) {
    errors.price = "El precio debe ser un número mayor a cero.";
  }
  if (!input.location.trim()) errors.location = "La ubicación es obligatoria.";
  if (!input.tag.trim()) errors.tag = "El tipo es obligatorio.";
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
      location: input.location.trim(),
      tag: input.tag.trim(),
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      areaM2: input.areaM2,
    },
  };
}

function parseFeatures(raw: string): string[] {
  return raw
    .split(",")
    .map((feature) => feature.trim())
    .filter(Boolean);
}

function parseNumericField(raw: string | undefined): number {
  const cleaned = (raw ?? "").replace(/[^0-9.-]/g, "");
  return Number(cleaned);
}

/**
 * Parses the Spanish-header CSV format used for bulk property import.
 * Unlike `validatePropertyInput`, this does not require at least one
 * image — imported properties start with an empty gallery and are
 * expected to have photos added afterward via the edit page.
 */
export function parsePropertiesCsv(csvText: string): PropertyImportResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const valid: { row: number; data: PropertyInput }[] = [];
  const invalid: PropertyImportRowError[] = [];

  parsed.data.forEach((record, index) => {
    const row = index + 2; // header occupies row 1; data starts at row 2

    const result = validateImportRow({
      title: record["Título"] ?? "",
      description: record["Descripción"] ?? "",
      price: parseNumericField(record["Precio (USD)"]),
      location: record["Ubicación"] ?? "",
      tag: record["Tipo"] ?? "",
      bedrooms: parseNumericField(record["Dormitorios"]),
      bathrooms: parseNumericField(record["Baños"]),
      areaM2: parseNumericField(record["Metros Cuadrados"]),
    });

    if (!result.valid) {
      invalid.push({ row, errors: result.errors });
      return;
    }

    valid.push({
      row,
      data: {
        ...result.data,
        currency: DEFAULT_CURRENCY,
        status: DEFAULT_STATUS,
        images: [],
        features: parseFeatures(record["Características"] ?? ""),
        featured: false,
      },
    });
  });

  return { valid, invalid };
}
