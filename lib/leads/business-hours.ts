const TIMEZONE = "America/Montevideo";
const OPEN_HOUR = 9; // 9:00, inclusive
const CLOSE_HOUR = 19; // 19:00, exclusive
const CLOSED_WEEKDAYS = new Set(["Sat", "Sun"]);

/**
 * Domus's office hours: Monday–Friday, 9:00–19:00. Adjust the constants
 * above if the real hours differ.
 *
 * Computed in the business's own timezone (Uruguay, UTC-3 year-round — no
 * DST) rather than the server runtime's timezone or the visitor's browser
 * time, so this reads correctly regardless of where either one happens to
 * be. Called from `createLeadRecord` — the single choke point every
 * publicly-sourced lead already goes through — so every entry point (the
 * /precalificacion wizard, a property inquiry, the WhatsApp intercept
 * modal, the chat widget) gets a consistent, one-place-to-change answer
 * instead of each re-implementing this.
 */
export function isWithinBusinessHours(date: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour: "numeric",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";

  if (CLOSED_WEEKDAYS.has(weekday)) return false;
  return hour >= OPEN_HOUR && hour < CLOSE_HOUR;
}

/** Shown instead of the normal confirmation copy when a lead comes in outside business hours — see isWithinBusinessHours. */
export const AFTER_HOURS_MESSAGE =
  "Gracias por su consulta. Nuestras oficinas están cerradas en este momento, pero su perfil y sus preferencias ya quedaron guardados de forma segura — un asesor senior se pondrá en contacto a primera hora.";
