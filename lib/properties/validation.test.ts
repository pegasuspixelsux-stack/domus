import { describe, expect, it } from "vitest";
import { validatePropertyInput } from "./validation";

function validInput() {
  return {
    title: "Residencia La Barra",
    description: "Una hermosa residencia frente al mar.",
    price: 450000,
    currency: "USD",
    location: "La Barra",
    tag: "Frente al Mar",
    status: "available",
    images: ["https://example.com/1.jpg"],
    features: ["Piscina", "Vista al mar"],
    bedrooms: 4,
    bathrooms: 3,
    areaM2: 320,
    featured: false,
  };
}

describe("validatePropertyInput", () => {
  it("accepts valid input and trims/filters fields", () => {
    const result = validatePropertyInput({
      ...validInput(),
      title: "  Residencia La Barra  ",
      images: ["  https://example.com/1.jpg  ", "  "],
      features: ["Piscina", "  ", "Vista al mar"],
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.title).toBe("Residencia La Barra");
      expect(result.data.images).toEqual(["https://example.com/1.jpg"]);
      expect(result.data.features).toEqual(["Piscina", "Vista al mar"]);
    }
  });

  it("rejects an empty title", () => {
    const result = validatePropertyInput({ ...validInput(), title: "   " });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.title).toBeDefined();
  });

  it("rejects an empty description", () => {
    const result = validatePropertyInput({ ...validInput(), description: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.description).toBeDefined();
  });

  it("rejects a zero or negative price", () => {
    const result = validatePropertyInput({ ...validInput(), price: 0 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.price).toBeDefined();
  });

  it("rejects a non-finite price", () => {
    const result = validatePropertyInput({ ...validInput(), price: NaN });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.price).toBeDefined();
  });

  it("rejects an empty currency", () => {
    const result = validatePropertyInput({ ...validInput(), currency: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.currency).toBeDefined();
  });

  it("rejects an empty location", () => {
    const result = validatePropertyInput({ ...validInput(), location: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.location).toBeDefined();
  });

  it("rejects an empty tag", () => {
    const result = validatePropertyInput({ ...validInput(), tag: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.tag).toBeDefined();
  });

  it("rejects an invalid status", () => {
    const result = validatePropertyInput({ ...validInput(), status: "pending" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.status).toBeDefined();
  });

  it("rejects an empty images array", () => {
    const result = validatePropertyInput({ ...validInput(), images: [] });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.images).toBeDefined();
  });

  it("rejects images that are only whitespace", () => {
    const result = validatePropertyInput({ ...validInput(), images: ["   ", ""] });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.images).toBeDefined();
  });

  it("rejects more than 10 images", () => {
    const result = validatePropertyInput({
      ...validInput(),
      images: Array.from({ length: 11 }, (_, i) => `https://example.com/${i}.jpg`),
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.images).toBeDefined();
  });

  it("accepts exactly 10 images", () => {
    const result = validatePropertyInput({
      ...validInput(),
      images: Array.from({ length: 10 }, (_, i) => `https://example.com/${i}.jpg`),
    });
    expect(result.valid).toBe(true);
  });

  it("accepts an empty features array", () => {
    const result = validatePropertyInput({ ...validInput(), features: [] });
    expect(result.valid).toBe(true);
  });

  it("rejects negative bedrooms", () => {
    const result = validatePropertyInput({ ...validInput(), bedrooms: -1 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.bedrooms).toBeDefined();
  });

  it("rejects non-integer bedrooms", () => {
    const result = validatePropertyInput({ ...validInput(), bedrooms: 2.5 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.bedrooms).toBeDefined();
  });

  it("rejects negative bathrooms", () => {
    const result = validatePropertyInput({ ...validInput(), bathrooms: -1 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.bathrooms).toBeDefined();
  });

  it("rejects non-integer bathrooms", () => {
    const result = validatePropertyInput({ ...validInput(), bathrooms: 1.5 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.bathrooms).toBeDefined();
  });

  it("accepts zero bedrooms and bathrooms", () => {
    const result = validatePropertyInput({ ...validInput(), bedrooms: 0, bathrooms: 0 });
    expect(result.valid).toBe(true);
  });

  it("rejects a zero or negative areaM2", () => {
    const result = validatePropertyInput({ ...validInput(), areaM2: 0 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.areaM2).toBeDefined();
  });

  it("passes the featured flag through unchanged", () => {
    const result = validatePropertyInput({ ...validInput(), featured: true });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.data.featured).toBe(true);
  });
});
