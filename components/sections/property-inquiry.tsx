"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { RevealGroup, RevealGroupItem } from "@/components/ui/reveal-group";
import { SectionLabel } from "@/components/ui/section-label";
import { createPropertyInquiry, type PropertyInquiryState } from "@/lib/leads/actions";
import type { Property } from "@/lib/properties/types";
import type { TeamMember } from "@/lib/team/data";

// Falls back to an obviously-fake placeholder until a real business number
// is set via NEXT_PUBLIC_WHATSAPP_NUMBER (digits only, country code first —
// e.g. "598991234567" for a Uruguayan mobile).
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "000000000000";

const initialState: PropertyInquiryState = {};

/**
 * Property-specific call to action, placed below `PropertyDetails`: a
 * WhatsApp deep link pre-filled with the property name, plus an inquiry
 * form that creates a real Lead (assigned to whichever salesperson the
 * visitor picks) via `createPropertyInquiry`. The form is omitted entirely
 * when there are no active salespeople to assign to — only the WhatsApp
 * CTA shows in that case.
 */
export function PropertyInquiry({
  property,
  salespeople,
}: {
  property: Property;
  salespeople: TeamMember[];
}) {
  const [state, formAction, pending] = useActionState(createPropertyInquiry, initialState);

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola, me interesa la propiedad "${property.title}".`,
  )}`;

  return (
    <section id="consultar" className="border-b border-foreground/10 px-8 py-20 md:px-16 md:py-32">
      <RevealGroup className="mx-auto flex max-w-[760px] flex-col gap-16">
        <RevealGroupItem className="flex flex-col gap-6">
          <SectionLabel>Consultar por esta Propiedad</SectionLabel>
          <h2 className="font-serif text-4xl leading-[0.95] tracking-tight md:text-5xl">
            ¿Le interesa <em className="text-accent italic">{property.title}</em>?
          </h2>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Escríbanos por WhatsApp para una respuesta inmediata, o déjenos sus datos y un asesor
            se pondrá en contacto.
          </p>
          <Button variant="secondary" href={whatsappHref} target="_blank" className="w-fit">
            Escribir por WhatsApp
          </Button>
        </RevealGroupItem>

        {salespeople.length > 0 && (
          <RevealGroupItem className="w-full">
            {state.success ? (
              <p className="text-lg text-foreground/90">
                Gracias — un asesor se pondrá en contacto a la brevedad.
              </p>
            ) : (
              <form action={formAction} className="flex w-full flex-col gap-4">
                <input type="hidden" name="propertyId" value={property.id} />

                <Field label="Nombre" name="name" error={state.errors?.name} defaultValue={state.values?.name} />
                <Field
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  error={state.errors?.email}
                  defaultValue={state.values?.email}
                />
                <Field label="Teléfono" name="phone" error={state.errors?.phone} defaultValue={state.values?.phone} />

                <div className="flex flex-col gap-2">
                  <label htmlFor="salespersonId" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Asesor
                  </label>
                  <select
                    id="salespersonId"
                    name="salespersonId"
                    defaultValue={state.values?.salespersonId ?? ""}
                    className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
                  >
                    <option value="">Seleccione un asesor</option>
                    {salespeople.map((person) => (
                      <option key={person.uid} value={person.uid}>
                        {person.displayName}
                      </option>
                    ))}
                  </select>
                  {state.errors?.salespersonId && (
                    <p role="alert" className="text-sm text-red-600">
                      {state.errors.salespersonId}
                    </p>
                  )}
                </div>

                {state.errors?.form && (
                  <p role="alert" className="text-sm text-red-600">
                    {state.errors.form}
                  </p>
                )}

                <Button type="submit" variant="primary" disabled={pending} className="w-full sm:w-auto">
                  {pending ? "Enviando…" : "Enviar Consulta"}
                </Button>
              </form>
            )}
          </RevealGroupItem>
        )}
      </RevealGroup>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  error,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
