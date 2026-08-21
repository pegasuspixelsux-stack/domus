import { Resend } from "resend";

export interface LeadAlertData {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  /** Composed qualification text (budget, urgency, financing, obstacle, etc.) — see prequalify-validation.ts. */
  notes?: string;
}

const DEFAULT_FROM = "Domus <onboarding@resend.dev>";

/**
 * Base URL used to build the "view lead" link in the alert email.
 * NEXT_PUBLIC_APP_URL takes precedence when set; otherwise this falls back
 * to Vercel's own system env var for the project's production domain
 * (available automatically on every deploy, no configuration needed), and
 * finally to localhost for local dev.
 */
function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(lead: LeadAlertData, leadUrl: string): string {
  const notesHtml = lead.notes
    ? `<div style="margin-top:24px;padding:16px 20px;background:#f4f2ee;border-left:3px solid #b08d57;">
         <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b6459;">Perfil de Precalificación</p>
         <p style="margin:0;font-size:14px;line-height:1.6;color:#1a1a1a;white-space:pre-line;">${escapeHtml(lead.notes)}</p>
       </div>`
    : "";

  return `
    <div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
      <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b6459;margin:0 0 8px;">Nuevo Lead — Domus</p>
      <h1 style="font-size:24px;font-weight:normal;margin:0 0 24px;">${escapeHtml(lead.name)}</h1>

      <div style="padding:16px 20px;border:1px solid #e5e1d8;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b6459;">Datos de Contacto</p>
        <p style="margin:0;font-size:14px;line-height:1.8;">
          Nombre: ${escapeHtml(lead.name)}<br/>
          Teléfono: ${escapeHtml(lead.phone)}<br/>
          Email: ${escapeHtml(lead.email)}<br/>
          Origen: ${escapeHtml(lead.source)}
        </p>
      </div>

      ${notesHtml}

      <div style="margin-top:32px;">
        <a href="${leadUrl}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">
          Ver Perfil Completo
        </a>
      </div>
    </div>
  `;
}

function buildText(lead: LeadAlertData, leadUrl: string): string {
  const lines = [
    "Nuevo Lead — Domus",
    "",
    "Datos de Contacto",
    `Nombre: ${lead.name}`,
    `Teléfono: ${lead.phone}`,
    `Email: ${lead.email}`,
    `Origen: ${lead.source}`,
  ];
  if (lead.notes) {
    lines.push("", "Perfil de Precalificación", lead.notes);
  }
  lines.push("", `Ver perfil completo: ${leadUrl}`);
  return lines.join("\n");
}

/**
 * Notifies the sales team's shared inbox the moment a new lead is captured
 * from a public-facing entry point (precalification wizard, property
 * inquiry form, or the chat assistant) — see lib/leads/create.ts, the one
 * place this is called from.
 *
 * Fire-and-forget by design: callers don't await this for its result, and
 * it never throws. A missing RESEND_API_KEY/LEAD_ALERT_TO_EMAIL or a Resend
 * outage must not block or fail lead creation — the lead is already durably
 * saved in Firestore by the time this runs, so a failed email here just
 * means one less alert, not lost data.
 */
export async function sendLeadAlert(lead: LeadAlertData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_ALERT_TO_EMAIL;

  if (!apiKey || !to) {
    console.warn(
      "[sendLeadAlert] RESEND_API_KEY o LEAD_ALERT_TO_EMAIL no configurados — se omite la alerta por correo.",
    );
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const leadUrl = `${getAppUrl()}/dashboard/leads?leadId=${lead.id}`;

    const { error } = await resend.emails.send({
      from: process.env.LEAD_ALERT_FROM_EMAIL || DEFAULT_FROM,
      to,
      subject: `🔥 Nuevo Lead Calificado: ${lead.name}`,
      html: buildHtml(lead, leadUrl),
      text: buildText(lead, leadUrl),
    });

    if (error) {
      console.error("[sendLeadAlert] Resend rechazó el envío:", error);
    }
  } catch (error) {
    console.error("[sendLeadAlert] No se pudo enviar la alerta de nuevo lead:", error);
  }
}
