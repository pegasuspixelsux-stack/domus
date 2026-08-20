"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createLead } from "@/lib/leads/actions";

export function NewLeadModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createLead, {});

  useEffect(() => {
    if (state.success) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-8">
      <div className="w-full max-w-md bg-background p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-2xl">Nuevo Lead</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-accent"
          >
            Cerrar
          </button>
        </div>

        <form action={formAction} className="flex flex-col gap-6">
          <Field
            label="Nombre"
            name="name"
            error={state.errors?.name}
            defaultValue={state.values?.name}
          />
          <Field
            label="Correo Electrónico"
            name="email"
            type="email"
            error={state.errors?.email}
            defaultValue={state.values?.email}
          />
          <Field
            label="Teléfono"
            name="phone"
            error={state.errors?.phone}
            defaultValue={state.values?.phone}
          />
          <Field
            label="Origen"
            name="source"
            error={state.errors?.source}
            defaultValue={state.values?.source}
          />

          <Button type="submit" variant="primary" disabled={pending} className="w-full">
            {pending ? "Guardando…" : "Crear Lead"}
          </Button>
        </form>
      </div>
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
      <label htmlFor={name} className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
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
