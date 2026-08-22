"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { submitWhatsappIntercept } from "@/lib/leads/actions";
import { PRIVACY_DISCLAIMER } from "@/lib/leads/copy";
import { BUDGET_OPTIONS, URGENCY_OPTIONS } from "@/lib/leads/prequalify-validation";
import type { Property } from "@/lib/properties/types";

// Falls back to an obviously-fake placeholder until a real business number
// is set via NEXT_PUBLIC_WHATSAPP_NUMBER (digits only, country code first —
// e.g. "598991234567" for a Uruguayan mobile).
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "000000000000";

const REMEMBERED_CONTACT_KEY = "domus_wa_contact";

interface RememberedContact {
  name: string;
  phone: string;
}

function loadRememberedContact(): RememberedContact | null {
  try {
    const raw = window.localStorage.getItem(REMEMBERED_CONTACT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.name === "string" && typeof parsed.phone === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveRememberedContact(contact: RememberedContact) {
  try {
    window.localStorage.setItem(REMEMBERED_CONTACT_KEY, JSON.stringify(contact));
  } catch {
    // Private browsing / storage disabled — not worth surfacing to the visitor.
  }
}

function buildWhatsappUrl(name: string, property: Property, afterHours: boolean): string {
  const intro = afterHours
    ? `Hola, soy ${name}. Sé que es fuera de horario, pero quería dejar mi consulta ya cargada.`
    : `Hola, soy ${name}.`;
  const message = `${intro} Vi la propiedad "${property.title}" (${property.location}) en el sitio de Domus y me gustaría más información.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Gates the property page's "Escribir por WhatsApp" CTA behind a quick
 * capture step, so an inquiry that the visitor never actually types into
 * WhatsApp still lands in the CRM with a sales-team alert already sent.
 * Deliberately name + phone only (no email, no salesperson picker) — the
 * full inquiry form below it on the page is there for visitors who want
 * that instead. Redirects to WhatsApp whether or not the lead save
 * succeeds: a hiccup saving to the CRM must never block someone from
 * reaching the business on WhatsApp, which is the one guaranteed channel
 * here.
 *
 * Returning visitors (a name/phone remembered in localStorage from a
 * previous submission, on this or another property) get the modal
 * pre-filled — still one explicit click, but nothing to retype.
 */
export function WhatsappInterceptModal({ property, onClose }: { property: Property; onClose: () => void }) {
  // Lazy initializers run once on mount, not on every re-render — the right
  // place for a synchronous read like this (see the react-hooks/set-state-in-effect
  // rule: setState from inside an effect body is the anti-pattern to avoid,
  // not reading localStorage per se).
  const [name, setName] = useState(() => loadRememberedContact()?.name ?? "");
  const [phone, setPhone] = useState(() => loadRememberedContact()?.phone ?? "");
  const [remembered, setRemembered] = useState(() => loadRememberedContact() !== null);
  const [budget, setBudget] = useState("");
  const [urgency, setUrgency] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetRememberedContact() {
    setName("");
    setPhone("");
    setRemembered(false);
    try {
      window.localStorage.removeItem(REMEMBERED_CONTACT_KEY);
    } catch {
      // Same as saveRememberedContact — nothing to do if storage isn't available.
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError("Ingrese su nombre.");
      return;
    }
    if (!trimmedPhone) {
      setError("Ingrese su teléfono.");
      return;
    }

    setError(null);
    setPending(true);

    let afterHours = false;
    try {
      const result = await submitWhatsappIntercept({
        name: trimmedName,
        phone: trimmedPhone,
        propertyId: property.id,
        budget: budget || undefined,
        urgency: urgency || undefined,
      });
      afterHours = result.success && result.afterHours;
    } catch {
      // Best-effort: the CRM save failing must not stop the visitor from
      // reaching WhatsApp — see the component doc comment above.
    }

    saveRememberedContact({ name: trimmedName, phone: trimmedPhone });
    window.open(buildWhatsappUrl(trimmedName, property, afterHours), "_blank", "noopener,noreferrer");
    setPending(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-8">
      <div className="flex w-full max-w-md flex-col gap-6 border border-foreground/10 bg-background p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">WhatsApp</p>
            <h2 className="mt-1 font-serif text-2xl">Antes de escribirnos</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-accent"
          >
            Cerrar
          </button>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Déjenos sus datos y lo conectamos directo por WhatsApp con la propiedad{" "}
          <em className="text-foreground italic">{property.title}</em> ya cargada en el mensaje.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Nombre" value={name} onChange={setName} placeholder="Su nombre completo" />
          <Field label="WhatsApp / Teléfono" value={phone} onChange={setPhone} placeholder="+598 99 123 456" />
          <Select label="Presupuesto (opcional)" value={budget} onChange={setBudget} options={BUDGET_OPTIONS} />
          <Select label="Urgencia (opcional)" value={urgency} onChange={setUrgency} options={URGENCY_OPTIONS} />

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={pending} className="w-full">
            {pending ? "Enviando…" : "Continuar a WhatsApp"}
          </Button>

          <p className="text-xs text-muted-foreground">{PRIVACY_DISCLAIMER}</p>

          {remembered && (
            <button
              type="button"
              onClick={resetRememberedContact}
              className="self-center text-xs tracking-[0.1em] text-muted-foreground uppercase hover:text-accent"
            >
              No soy yo — usar otros datos
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs tracking-[0.2em] text-muted-foreground uppercase">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs tracking-[0.2em] text-muted-foreground uppercase">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
      >
        <option value="">Prefiero no decir</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
