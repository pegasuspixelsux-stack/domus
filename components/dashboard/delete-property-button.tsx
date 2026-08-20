"use client";

import { useTransition } from "react";
import { deleteProperty } from "@/lib/properties/actions";

export function DeletePropertyButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("¿Eliminar esta propiedad? Esta acción no se puede deshacer.")) {
      return;
    }
    startTransition(() => {
      deleteProperty(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-accent"
    >
      {pending ? "Eliminando…" : "Eliminar"}
    </button>
  );
}
