"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { importProperties, type PropertyImportSummary } from "@/lib/properties/import-actions";

export function ImportPropertiesModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [summary, setSummary] = useState<PropertyImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSummary(null);
    setFileName(file.name);

    startTransition(async () => {
      try {
        const csvText = await file.text();
        const result = await importProperties(csvText);
        setSummary(result);
        if (result.imported > 0) {
          router.refresh();
        }
      } catch {
        setError("No se pudo procesar el archivo. Intente de nuevo.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-8">
      <div className="w-full max-w-lg bg-background p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-2xl">Importar Propiedades</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-accent"
          >
            Cerrar
          </button>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">
          Seleccione un archivo CSV con las columnas: Título, Ubicación, Tipo, Precio (USD),
          Dormitorios, Baños, Metros Cuadrados, Características, Descripción. Las propiedades
          importadas quedan sin imágenes — agréguelas luego editando cada propiedad.
        </p>

        <label className="flex h-12 w-full cursor-pointer items-center justify-center border border-foreground text-xs font-medium tracking-[0.2em] text-foreground uppercase transition-colors duration-500 hover:bg-foreground hover:text-background">
          {pending ? "Procesando…" : fileName ? fileName : "Seleccionar Archivo CSV"}
          <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} disabled={pending} />
        </label>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        {summary && (
          <div className="mt-6 flex flex-col gap-3 border-t border-foreground/10 pt-6">
            <p className="text-sm">
              {summary.imported} propiedad{summary.imported === 1 ? "" : "es"} importada
              {summary.imported === 1 ? "" : "s"} correctamente.
            </p>
            {summary.errors.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                  {summary.errors.length} fila{summary.errors.length === 1 ? "" : "s"} con errores
                </p>
                <ul className="flex flex-col gap-1 text-sm text-red-600">
                  {summary.errors.map(({ row, message }) => (
                    <li key={row}>
                      Fila {row}: {message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <Button type="button" variant="secondary" className="mt-6 w-full" onClick={onClose}>
          {summary ? "Listo" : "Cancelar"}
        </Button>
      </div>
    </div>
  );
}
