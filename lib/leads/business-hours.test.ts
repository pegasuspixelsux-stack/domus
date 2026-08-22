import { describe, expect, it } from "vitest";
import { isWithinBusinessHours } from "./business-hours";

// All times below are given as UTC instants, then converted to
// America/Montevideo (UTC-3, no DST) mentally: UTC 12:00 -> 09:00 local.
describe("isWithinBusinessHours", () => {
  it("is true at 09:00 local on a weekday (opening instant, inclusive)", () => {
    // Wed 2026-08-19 09:00 America/Montevideo == 12:00 UTC.
    expect(isWithinBusinessHours(new Date("2026-08-19T12:00:00Z"))).toBe(true);
  });

  it("is true at 18:59 local on a weekday", () => {
    expect(isWithinBusinessHours(new Date("2026-08-19T21:59:00Z"))).toBe(true);
  });

  it("is false at 19:00 local on a weekday (closing instant, exclusive)", () => {
    expect(isWithinBusinessHours(new Date("2026-08-19T22:00:00Z"))).toBe(false);
  });

  it("is false at 08:59 local on a weekday", () => {
    expect(isWithinBusinessHours(new Date("2026-08-19T11:59:00Z"))).toBe(false);
  });

  it("is false at 02:00 local on a weekday (the classic after-hours case)", () => {
    expect(isWithinBusinessHours(new Date("2026-08-19T05:00:00Z"))).toBe(false);
  });

  it("is false at noon local on a Saturday", () => {
    // Sat 2026-08-22 12:00 America/Montevideo == 15:00 UTC.
    expect(isWithinBusinessHours(new Date("2026-08-22T15:00:00Z"))).toBe(false);
  });

  it("is false at noon local on a Sunday", () => {
    // Sun 2026-08-23 12:00 America/Montevideo == 15:00 UTC.
    expect(isWithinBusinessHours(new Date("2026-08-23T15:00:00Z"))).toBe(false);
  });
});
