"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PropertyActionState } from "@/lib/properties/actions";
import type { Property, PropertyStatus } from "@/lib/properties/types";

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
  const [images, setImages] = useState<string[]>(property?.images ?? [""]);

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

  function updateImage(index: number, value: string) {
    setImages(images.map((img, i) => (i === index ? value : img)));
  }

  function addImageRow() {
    setImages([...images, ""]);
  }

  function removeImageRow(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <Field label="Título" name="title" defaultValue={property?.title} error={state.errors?.title} />

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={property?.description}
          className="w-full border-b border-foreground/40 bg-transparent px-0 py-2 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
        />
        {state.errors?.description && (
          <p role="alert" className="text-sm text-red-600">
            {state.errors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Field label="Precio" name="price" type="number" defaultValue={property?.price} error={state.errors?.price} />
        <Field
          label="Moneda"
          name="currency"
          defaultValue={property?.currency ?? "USD"}
          error={state.errors?.currency}
        />
      </div>

      <Field label="Ubicación" name="location" defaultValue={property?.location} error={state.errors?.location} />
      <Field label="Etiqueta" name="tag" defaultValue={property?.tag} error={state.errors?.tag} />

      <div className="flex flex-col gap-2">
        <label htmlFor="status" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Estado
        </label>
        <select
          id="status"
          name="status"
          defaultValue={property?.status ?? "available"}
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

      <div className="grid grid-cols-3 gap-6">
        <Field
          label="Dormitorios"
          name="bedrooms"
          type="number"
          defaultValue={property?.bedrooms}
          error={state.errors?.bedrooms}
        />
        <Field
          label="Baños"
          name="bathrooms"
          type="number"
          defaultValue={property?.bathrooms}
          error={state.errors?.bathrooms}
        />
        <Field
          label="Superficie (m²)"
          name="areaM2"
          type="number"
          defaultValue={property?.areaM2}
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

      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Imágenes (URL)</span>
        {images.map((image, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              name="images"
              value={image}
              onChange={(event) => updateImage(index, event.target.value)}
              placeholder="https://..."
              className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
            />
            {images.length > 1 && (
              <button type="button" onClick={() => removeImageRow(index)} className="text-muted-foreground hover:text-accent">
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addImageRow}
          className="self-start text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-accent"
        >
          + Agregar imagen
        </button>
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
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  error?: string;
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
