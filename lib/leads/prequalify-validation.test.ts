import { describe, expect, it } from "vitest";
import {
  BATHROOMS_OPTIONS,
  BEDROOMS_OPTIONS,
  BUDGET_OPTIONS,
  FINANCING_OPTIONS,
  GOAL_OPTIONS,
  OBSTACLE_OPTIONS,
  URGENCY_OPTIONS,
  validatePrequalifyInput,
  ZONE_OPTIONS,
} from "./prequalify-validation";

function validInput() {
  return {
    name: "Marcela Ibarra",
    email: "marcela@example.com",
    phone: "+598 99 123 456",
    budget: BUDGET_OPTIONS[0],
    goal: GOAL_OPTIONS[0],
    zone: ZONE_OPTIONS[0],
    bedrooms: BEDROOMS_OPTIONS[0],
    bathrooms: BATHROOMS_OPTIONS[0],
    urgency: URGENCY_OPTIONS[0],
    financing: FINANCING_OPTIONS[0],
    obstacle: OBSTACLE_OPTIONS[0],
    notes: "",
  };
}

describe("validatePrequalifyInput", () => {
  it("accepts valid input and trims fields", () => {
    const result = validatePrequalifyInput({ ...validInput(), name: "  Marcela Ibarra  " });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.data.name).toBe("Marcela Ibarra");
  });

  it("accepts every field's 'Prefiero no divulgar' option", () => {
    const result = validatePrequalifyInput({
      ...validInput(),
      budget: "Prefiero no divulgar",
      goal: "Prefiero no divulgar",
      zone: "Prefiero no divulgar",
      bedrooms: "Prefiero no divulgar",
      bathrooms: "Prefiero no divulgar",
      urgency: "Prefiero no divulgar",
      financing: "Prefiero no divulgar",
      obstacle: "Prefiero no divulgar",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = validatePrequalifyInput({ ...validInput(), name: "  " });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.name).toBeDefined();
  });

  it("rejects a malformed email", () => {
    const result = validatePrequalifyInput({ ...validInput(), email: "notanemail" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.email).toBeDefined();
  });

  it("rejects an empty phone", () => {
    const result = validatePrequalifyInput({ ...validInput(), phone: " " });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.phone).toBeDefined();
  });

  it("rejects a budget value outside the known options", () => {
    const result = validatePrequalifyInput({ ...validInput(), budget: "un millón de dólares" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.budget).toBeDefined();
  });

  it("rejects a missing goal/zone/bedrooms/bathrooms/urgency/financing/obstacle", () => {
    const result = validatePrequalifyInput({
      ...validInput(),
      goal: "",
      zone: "",
      bedrooms: "",
      bathrooms: "",
      urgency: "",
      financing: "",
      obstacle: "",
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.goal).toBeDefined();
      expect(result.errors.zone).toBeDefined();
      expect(result.errors.bedrooms).toBeDefined();
      expect(result.errors.bathrooms).toBeDefined();
      expect(result.errors.urgency).toBeDefined();
      expect(result.errors.financing).toBeDefined();
      expect(result.errors.obstacle).toBeDefined();
    }
  });

  it("rejects notes over the length limit", () => {
    const result = validatePrequalifyInput({ ...validInput(), notes: "a".repeat(2001) });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.notes).toBeDefined();
  });

  it("accepts notes at the length limit", () => {
    const result = validatePrequalifyInput({ ...validInput(), notes: "a".repeat(2000) });
    expect(result.valid).toBe(true);
  });
});
