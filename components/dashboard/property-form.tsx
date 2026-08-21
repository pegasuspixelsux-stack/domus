"use client";

import { type ChangeEvent, useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { PropertyActionState } from "@/lib/properties/actions";
import type { Property, PropertyStatus } from "@/lib/properties/types";
import { uploadPropertyImages } from "@/lib/properties/upload-actions";
import { MAX_IMAGE_BYTES, MAX_IMAGES_PER_PROPERTY } from "@/lib/properties/upload-constants";

const STATUS_OPTIONS: { value: PropertyStatus; label: string }[] = [
  { value: "available", label: "Disponible" },
  { value: "reserved", label: "Reservada" },
  { value: "sold", label: "Vendida" },
];

type PropertyFormAction = (
  prevState: PropertyActionState,
  formData: FormData,
) => Promise<PropertyActionState>;

export function PropertyForm({
  property,
  action,
}: {
  property?: Property;
  action: PropertyFormAction;
}) {
  const [state, formAction, pending] = useActionState<PropertyActionState, FormData>(action, {});
  const [features, setFeatures] = useState<string[]>(property?.features ?? []);
  const [featureInput, setFeatureInput] = useState("");
  const [images, setImages] = useState<{ id: string; value: string }[]>(
    (property?.images ?? []).map((value) => ({ id: crypto.randomUUID(), value })),
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();

  function addFeature() {
    const value = featureInput.trim();
    if (value && !features.includes(value)) {
      setFeatures([...features, value]);
    }
    setFeatureInput("");
  }

  function removeFeature(value: string) {
    setFeatures(features.filter((f) => f !== value));
  }

  function removeImageRow(id: string) {
    setImages(images.filter((img) => img.id !== id));
  }

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selected.length === 0) return;

    setUploadError(null);

    const remainingSlots = MAX_IMAGES_PER_PROPERTY - images.length;
    if (remainingSlots <= 0) {
      setUploadError(`Ya alcanzó el máximo de ${MAX_IMAGES_PER_PROPERTY} imágenes.`);
      return;
    }

    const toUpload = selected.slice(0, remainingSlots);
    const oversized = toUpload.filter((file) => file.size > MAX_IMAGE_BYTES);
    if (oversized.length > 0) {
      setUploadError(`${oversized.map((f) => f.name).join(", ")}: supera los 5MB.`);
    }
    const withinLimit = toUpload.filter((file) => file.size <= MAX_IMAGE_BYTES);
    if (withinLimit.length === 0) return;

    const formData = new FormData();
    withinLimit.forEach((file) => formData.append("files", file));

    startUpload(async () => {
      try {
        const result = await uploadPropertyImages(formData);
        if (result.urls.length > 0) {
          setImages((current) => [
            ...current,
            ...result.urls.map((value) => ({ id: crypto.randomUUID(), value })),
          ]);
        }
        if (result.errors.length > 0) {
          setUploadError(result.errors.join(" "));
        }
      } catch {
        setUploadError("No se pudieron subir las imágenes. Intente de nuevo.");
      }
    });
  }

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Field
        label="Título"
        name="title"
        defaultValue={state.values?.title ?? property?.title}
        error={state.errors?.title}
      />

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={state.values?.description ?? property?.description}
          className="w-full border-b border-foreground/40 bg-transparent px-0 py-2 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
        />
        {state.errors?.description && (
          <p role="alert" className="text-sm text-red-600">
            {state.errors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Field
          label="Precio"
          name="price"
          type="number"
          defaultValue={state.values?.price ?? property?.price}
          error={state.errors?.price}
        />
        <Field
          label="Moneda"
          name="currency"
          defaultValue={state.values?.currency ?? property?.currency ?? "USD"}
          error={state.errors?.currency}
        />
      </div>

      <Field
        label="Ubicación"
        name="location"
        defaultValue={state.values?.location ?? property?.location}
        error={state.errors?.location}
      />
      <Field
        label="Etiqueta"
        name="tag"
        defaultValue={state.values?.tag ?? property?.tag}
        error={state.errors?.tag}
      />

      <div className="flex flex-col gap-2">
        <label htmlFor="status" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Estado
        </label>
        <select
          id="status"
          name="status"
          defaultValue={state.values?.status ?? property?.status ?? "available"}
          className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {state.errors?.status && (
          <p role="alert" className="text-sm text-red-600">
            {state.errors.status}
          </p>
        )}
      </div>

      <label className="flex items-center gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={
            state.values ? state.values.featured === "true" : (property?.featured ?? false)
          }
          className="h-4 w-4 border-foreground/40 accent-accent"
        />
        Destacado — mostrar en la página de inicio
      </label>

      <div className="grid grid-cols-3 gap-6">
        <Field
          label="Dormitorios"
          name="bedrooms"
          type="number"
          required
          defaultValue={state.values?.bedrooms ?? property?.bedrooms}
          error={state.errors?.bedrooms}
        />
        <Field
          label="Baños"
          name="bathrooms"
          type="number"
          required
          defaultValue={state.values?.bathrooms ?? property?.bathrooms}
          error={state.errors?.bathrooms}
        />
        <Field
          label="Superficie (m²)"
          name="areaM2"
          type="number"
          defaultValue={state.values?.areaM2 ?? property?.areaM2}
          error={state.errors?.areaM2}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Características</span>
        <div className="flex flex-wrap gap-2">
          {features.map((feature) => (
            <span key={feature} className="flex items-center gap-2 border border-foreground/20 px-3 py-1 text-sm">
              {feature}
              <input type="hidden" name="features" value={feature} />
              <button type="button" onClick={() => removeFeature(feature)} className="text-muted-foreground hover:text-accent">
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={featureInput}
          onChange={(event) => setFeatureInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addFeature();
            }
          }}
          placeholder="Escriba una característica y presione Enter"
          className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
        />
        {state.errors?.features && (
          <p role="alert" className="text-sm text-red-600">
            {state.errors.features}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Imágenes ({images.length}/{MAX_IMAGES_PER_PROPERTY})
        </span>

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((image) => (
              <div key={image.id} className="group relative aspect-square overflow-hidden border border-foreground/10">
                <input type="hidden" name="images" value={image.value} />
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded Storage URLs, previewed as-is */}
                <img src={image.value} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImageRow(image.id)}
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center bg-foreground/70 text-xs text-background opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-label="Quitar imagen"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length < MAX_IMAGES_PER_PROPERTY && (
          <label className="flex h-12 w-full max-w-xs cursor-pointer items-center justify-center border border-foreground/40 text-xs tracking-[0.2em] text-foreground uppercase transition-colors duration-500 hover:bg-foreground hover:text-background">
            {uploading ? "Subiendo…" : "Subir Imágenes"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handleFilesSelected}
              disabled={uploading}
            />
          </label>
        )}

        <p className="text-xs text-muted-foreground">Máximo 5MB por imagen, hasta {MAX_IMAGES_PER_PROPERTY} imágenes.</p>

        {uploadError && (
          <p role="alert" className="text-sm text-red-600">
            {uploadError}
          </p>
        )}
        {state.errors?.images && (
          <p role="alert" className="text-sm text-red-600">
            {state.errors.images}
          </p>
        )}
      </div>

      <Button type="submit" variant="primary" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  error,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  error?: string;
  required?: boolean;
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
        required={required}
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
