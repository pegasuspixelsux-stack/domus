"use client";

import { useState, useTransition } from "react";
import { deleteProperty } from "@/lib/properties/actions";

export function DeletePropertyButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!window.confirm("¿Eliminar esta propiedad? Esta acción no se puede deshacer.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await deleteProperty(id);
      } catch {
        setError("No se pudo eliminar la propiedad. Intente de nuevo.");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      {error && (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-accent"
      >
        {pending ? "Eliminando…" : "Eliminar"}
      </button>
    </div>
  );
}
