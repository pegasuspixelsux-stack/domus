import { notFound } from "next/navigation";
import { PropertyForm } from "@/components/dashboard/property-form";
import { requireRole } from "@/lib/auth/require-role";
import { updateProperty } from "@/lib/properties/actions";
import { getProperty } from "@/lib/properties/data";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin"]);
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-3xl">Editar Propiedad</h1>
      <PropertyForm property={property} action={updateProperty.bind(null, id)} />
    </div>
  );
}
