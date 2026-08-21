import { describe, expect, it } from "vitest";
import { validateUserInput } from "./validation";

function validInput() {
  return {
    displayName: "Marcela Ibarra",
    email: "marcela@example.com",
    role: "sales",
  };
}

describe("validateUserInput", () => {
  it("accepts valid input and trims fields", () => {
    const result = validateUserInput({ ...validInput(), displayName: "  Marcela Ibarra  " });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.displayName).toBe("Marcela Ibarra");
      expect(result.data.role).toBe("sales");
    }
  });

  it("accepts every valid role", () => {
    for (const role of ["admin", "manager", "sales"]) {
      const result = validateUserInput({ ...validInput(), role });
      expect(result.valid).toBe(true);
    }
  });

  it("rejects an empty display name", () => {
    const result = validateUserInput({ ...validInput(), displayName: "   " });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.displayName).toBeDefined();
  });

  it("rejects an empty email", () => {
    const result = validateUserInput({ ...validInput(), email: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.email).toBeDefined();
  });

  it("rejects a malformed email", () => {
    const result = validateUserInput({ ...validInput(), email: "notanemail" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.email).toBeDefined();
  });

  it("rejects an invalid role", () => {
    const result = validateUserInput({ ...validInput(), role: "owner" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.role).toBeDefined();
  });

  it("rejects a missing role", () => {
    const result = validateUserInput({ ...validInput(), role: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.role).toBeDefined();
  });

  it("reports all three errors at once when everything is empty", () => {
    const result = validateUserInput({ displayName: "", email: "", role: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(Object.keys(result.errors)).toHaveLength(3);
    }
  });
});
