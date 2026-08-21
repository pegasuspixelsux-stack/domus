import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

describe("sendLeadAlert", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
    sendMock.mockResolvedValue({ data: { id: "email_123" }, error: null });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("skips sending when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    process.env.LEAD_ALERT_TO_EMAIL = "ventas@domus.com.uy";
    const { sendLeadAlert } = await import("./sendLeadAlert");

    await sendLeadAlert({ id: "lead_1", name: "Ana", email: "ana@example.com", phone: "+598 99 000 000", source: "Chat IA" });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("skips sending when LEAD_ALERT_TO_EMAIL is missing", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    delete process.env.LEAD_ALERT_TO_EMAIL;
    const { sendLeadAlert } = await import("./sendLeadAlert");

    await sendLeadAlert({ id: "lead_1", name: "Ana", email: "ana@example.com", phone: "+598 99 000 000", source: "Chat IA" });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends the alert with subject, contact details, and the lead deep link when both env vars are set", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.LEAD_ALERT_TO_EMAIL = "ventas@domus.com.uy";
    process.env.NEXT_PUBLIC_APP_URL = "https://domus.example";
    const { sendLeadAlert } = await import("./sendLeadAlert");

    await sendLeadAlert({
      id: "lead_1",
      name: "Ana Pérez",
      email: "ana@example.com",
      phone: "+598 99 000 000",
      source: "Chat IA",
      notes: "Presupuesto: USD 200.000 – 500.000\nUrgencia: Inmediata (0–3 meses)",
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const call = sendMock.mock.calls[0][0];
    expect(call.to).toBe("ventas@domus.com.uy");
    expect(call.subject).toBe("🔥 Nuevo Lead Calificado: Ana Pérez");
    expect(call.html).toContain("https://domus.example/dashboard/leads?leadId=lead_1");
    expect(call.html).toContain("Ana Pérez");
    expect(call.text).toContain("https://domus.example/dashboard/leads?leadId=lead_1");
  });

  it("never throws when Resend itself throws", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.LEAD_ALERT_TO_EMAIL = "ventas@domus.com.uy";
    sendMock.mockRejectedValue(new Error("network down"));
    const { sendLeadAlert } = await import("./sendLeadAlert");

    await expect(
      sendLeadAlert({ id: "lead_1", name: "Ana", email: "ana@example.com", phone: "+598 99 000 000", source: "Chat IA" }),
    ).resolves.toBeUndefined();
  });
});
