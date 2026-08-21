"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createPrequalifiedLead } from "@/lib/leads/actions";
import type { PrequalifyActionState } from "@/lib/leads/actions";
import {
  BUDGET_OPTIONS,
  FINANCING_OPTIONS,
  GOAL_OPTIONS,
  OBSTACLE_OPTIONS,
  URGENCY_OPTIONS,
  ZONE_OPTIONS,
} from "@/lib/leads/prequalify-validation";

const initialState: PrequalifyActionState = {};

const STEPS = [
  { number: 1, label: "Perfil Inicial", fields: ["budget", "zone", "goal"] },
  { number: 2, label: "Intención y Financiamiento", fields: ["urgency", "financing", "obstacle"] },
  { number: 3, label: "Contacto", fields: ["name", "email", "phone"] },
] as const;

/**
 * Three-step lead qualification wizard. All fields live in one <form> for
 * the whole wizard — each step is just CSS-hidden rather than unmounted, so
 * uncontrolled inputs keep their values as the visitor moves between steps
 * without needing any controlled state for the fields themselves (matching
 * every other form in this app). "Atrás"/"Siguiente" are plain buttons;
 * only the last step submits. On a failed submission, jumps back to the
 * earliest step that has an error.
 */
export function PrequalificationWizard() {
  const [state, formAction, pending] = useActionState(createPrequalifiedLead, initialState);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!state.errors) return;
    const errorKeys = Object.keys(state.errors);
    const earliestStep = STEPS.find((s) => s.fields.some((field) => errorKeys.includes(field)));
    if (earliestStep) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(earliestStep.number);
    }
  }, [state.errors]);

  if (state.success) {
    return (
      <div className="mx-auto max-w-[600px] py-16 text-center">
        <p className="font-serif text-2xl">Gracias, {state.values?.name ?? ""}.</p>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Recibimos su información — un asesor se pondrá en contacto a la brevedad para ayudarlo
          a encontrar la propiedad correcta.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[600px]">
      <div className="mb-12 flex items-center gap-4">
        {STEPS.map((s) => (
          <div key={s.number} className="flex flex-1 flex-col gap-2">
            <span
              className={`h-px w-full transition-colors duration-500 ${
                step >= s.number ? "bg-accent" : "bg-foreground/15"
              }`}
            />
            <span className="text-xs tracking-[0.15em] text-muted-foreground uppercase">
              {s.number}. {s.label}
            </span>
          </div>
        ))}
      </div>

      <form action={formAction} className="flex flex-col gap-8">
        <div className={step === 1 ? "flex flex-col gap-6" : "hidden"}>
          <Select label="Presupuesto" name="budget" options={BUDGET_OPTIONS} error={state.errors?.budget} defaultValue={state.values?.budget} />
          <Select label="Zona de interés" name="zone" options={ZONE_OPTIONS} error={state.errors?.zone} defaultValue={state.values?.zone} />
          <Select label="Objetivo" name="goal" options={GOAL_OPTIONS} error={state.errors?.goal} defaultValue={state.values?.goal} />
        </div>

        <div className={step === 2 ? "flex flex-col gap-6" : "hidden"}>
          <Select label="Urgencia" name="urgency" options={URGENCY_OPTIONS} error={state.errors?.urgency} defaultValue={state.values?.urgency} />
          <Select label="Financiamiento" name="financing" options={FINANCING_OPTIONS} error={state.errors?.financing} defaultValue={state.values?.financing} />
          <Select label="Principal obstáculo" name="obstacle" options={OBSTACLE_OPTIONS} error={state.errors?.obstacle} defaultValue={state.values?.obstacle} />
        </div>

        <div className={step === 3 ? "flex flex-col gap-6" : "hidden"}>
          <Field label="Nombre" name="name" error={state.errors?.name} defaultValue={state.values?.name} />
          <Field label="Correo Electrónico" name="email" type="email" error={state.errors?.email} defaultValue={state.values?.email} />
          <Field label="Teléfono" name="phone" error={state.errors?.phone} defaultValue={state.values?.phone} />
          <div className="flex flex-col gap-2">
            <label htmlFor="notes" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Cuéntenos más (opcional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={state.values?.notes}
              className="w-full border-b border-foreground/40 bg-transparent px-0 py-2 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
            />
            {state.errors?.notes && (
              <p role="alert" className="text-sm text-red-600">
                {state.errors.notes}
              </p>
            )}
          </div>
        </div>

        {state.errors?.form && (
          <p role="alert" className="text-sm text-red-600">
            {state.errors.form}
          </p>
        )}

        <div className="flex items-center justify-between">
          {step > 1 ? (
            <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)}>
              Atrás
            </Button>
          ) : (
            <span />
          )}

          {step < STEPS.length ? (
            <Button type="button" variant="primary" onClick={() => setStep((s) => s + 1)}>
              Siguiente
            </Button>
          ) : (
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Enviando…" : "Enviar"}
            </Button>
          )}
        </div>
      </form>
    </div>
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

function Select({
  label,
  name,
  options,
  error,
  defaultValue,
}: {
  label: string;
  name: string;
  options: readonly string[];
  error?: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
      >
        <option value="" disabled>
          Seleccione una opción
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
