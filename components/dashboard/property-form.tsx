"use client";

import { type ChangeEvent, useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { PropertyActionState } from "@/lib/properties/actions";
import { PROPERTY_STATUSES } from "@/lib/properties/constants";
import type { Property } from "@/lib/properties/types";
import { uploadPropertyImages } from "@/lib/properties/upload-actions";
import { MAX_IMAGE_BYTES, MAX_IMAGES_PER_PROPERTY } from "@/lib/properties/upload-constants";

const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 0.85;

/**
 * Phone camera photos routinely come out well over MAX_IMAGE_BYTES (5MB) —
 * a modern phone's default camera output is often 8–15MB. Without this,
 * "take a photo" would fail the size check almost every time. Downscales to
 * MAX_DIMENSION on the long edge and re-encodes as JPEG; a file already
 * within both bounds (e.g. a pre-sized photo from a gallery) is returned
 * untouched. Animated GIFs are skipped — re-encoding would flatten them to
 * one frame. Falls back to the original file on any failure (e.g.
 * createImageBitmap unsupported) rather than blocking the upload.
 */
async function resizeImageIfNeeded(file: File): Promise<File> {
  if (file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= MAX_IMAGE_BYTES) {
      bitmap.close();
      return file;
    }

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return file;

    const newName = `${file.name.replace(/\.[^./\\]+$/, "")}.jpg`;
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

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

    const toProcess = selected.slice(0, remainingSlots);

    startUpload(async () => {
      const resized = await Promise.all(toProcess.map((file) => resizeImageIfNeeded(file)));

      const oversized = resized.filter((file) => file.size > MAX_IMAGE_BYTES);
      if (oversized.length > 0) {
        setUploadError(`${oversized.map((f) => f.name).join(", ")}: supera los 5MB incluso tras reducir el tamaño.`);
      }
      const withinLimit = resized.filter((file) => file.size <= MAX_IMAGE_BYTES);
      if (withinLimit.length === 0) return;

      const formData = new FormData();
      withinLimit.forEach((file) => formData.append("files", file));

      try {
        const result = await uploadPropertyImages(formData);
        if (result.urls.length > 0) {
          setImages((current) => [
            ...current,
            ...result.urls.map((value) => ({ id: crypto.randomUUID(), value })),
          ]);
        }
        if (result.errors.length > 0) {
          setUploadError((current) => [current, result.errors.join(" ")].filter(Boolean).join(" "));
        }
      } catch {
        setUploadError((current) =>
          [current, "No se pudieron subir las imágenes. Intente de nuevo."].filter(Boolean).join(" "),
        );
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
          {PROPERTY_STATUSES.map((option) => (
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
                  className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center bg-foreground/70 text-sm text-background opacity-100 transition-opacity duration-300 sm:h-6 sm:w-6 sm:text-xs sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="Quitar imagen"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length < MAX_IMAGES_PER_PROPERTY && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex h-12 w-full cursor-pointer items-center justify-center border border-foreground/40 text-xs tracking-[0.2em] text-foreground uppercase transition-colors duration-500 hover:bg-foreground hover:text-background sm:max-w-xs">
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

            {/* capture="environment" opens the rear camera directly on mobile
                instead of just the gallery picker — ignored on desktop, where
                it behaves like a normal file input. */}
            <label className="flex h-12 w-full cursor-pointer items-center justify-center border border-foreground/40 text-xs tracking-[0.2em] text-foreground uppercase transition-colors duration-500 hover:bg-foreground hover:text-background sm:max-w-xs">
              {uploading ? "Subiendo…" : "Tomar Foto"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                className="hidden"
                onChange={handleFilesSelected}
                disabled={uploading}
              />
            </label>
          </div>
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
