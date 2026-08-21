"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, type Role } from "@/lib/auth/rbac";
import { createUser } from "@/lib/team/actions";

const ROLES: Role[] = ["admin", "manager", "sales"];

export function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createUser, {});

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
          <h2 className="font-serif text-2xl">Nuevo Usuario</h2>
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
            name="displayName"
            error={state.errors?.displayName}
            defaultValue={state.values?.displayName}
          />
          <Field
            label="Correo Electrónico"
            name="email"
            type="email"
            error={state.errors?.email}
            defaultValue={state.values?.email}
          />

          <div className="flex flex-col gap-2">
            <label htmlFor="role" className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
              Rol
            </label>
            <select
              id="role"
              name="role"
              defaultValue={state.values?.role ?? ""}
              className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
            >
              <option value="">Seleccione un rol</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            {state.errors?.role && (
              <p role="alert" className="text-sm text-red-600">
                {state.errors.role}
              </p>
            )}
          </div>

          {state.errors?.form && (
            <p role="alert" className="text-sm text-red-600">
              {state.errors.form}
            </p>
          )}

          <p className="text-xs leading-relaxed text-muted-foreground">
            La cuenta se crea sin contraseña — pídale a la persona que use
            &quot;¿Olvidó su contraseña?&quot; en la pantalla de acceso para configurar la suya.
          </p>

          <Button type="submit" variant="primary" disabled={pending} className="w-full">
            {pending ? "Creando…" : "Crear Usuario"}
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
