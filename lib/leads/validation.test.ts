import { describe, expect, it } from "vitest";
import { validateLeadInput } from "./validation";

function validInput() {
  return {
    name: "Marcela Ibarra",
    email: "marcela@example.com",
    phone: "+598 99 123 456",
    source: "Instagram",
  };
}

describe("validateLeadInput", () => {
  it("accepts valid input and trims fields", () => {
    const result = validateLeadInput({ ...validInput(), name: "  Marcela Ibarra  " });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.name).toBe("Marcela Ibarra");
    }
  });

  it("rejects an empty name", () => {
    const result = validateLeadInput({ ...validInput(), name: "   " });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.name).toBeDefined();
  });

  it("rejects an empty email", () => {
    const result = validateLeadInput({ ...validInput(), email: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.email).toBeDefined();
  });

  it("rejects a malformed email (no @)", () => {
    const result = validateLeadInput({ ...validInput(), email: "notanemail" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.email).toBeDefined();
  });

  it("rejects a malformed email (no domain)", () => {
    const result = validateLeadInput({ ...validInput(), email: "user@" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.email).toBeDefined();
  });

  it("rejects a malformed email (no TLD)", () => {
    const result = validateLeadInput({ ...validInput(), email: "user@example" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.email).toBeDefined();
  });

  it("accepts a valid email with a subdomain and plus-tag", () => {
    const result = validateLeadInput({ ...validInput(), email: "user.name+tag@mail.example.co.uk" });
    expect(result.valid).toBe(true);
  });

  it("rejects an empty phone", () => {
    const result = validateLeadInput({ ...validInput(), phone: "  " });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.phone).toBeDefined();
  });

  it("rejects an empty source", () => {
    const result = validateLeadInput({ ...validInput(), source: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.source).toBeDefined();
  });

  it("reports all four errors at once when everything is empty", () => {
    const result = validateLeadInput({ name: "", email: "", phone: "", source: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(Object.keys(result.errors)).toHaveLength(4);
    }
  });
});
