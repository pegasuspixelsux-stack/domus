import { PropertyForm } from "@/components/dashboard/property-form";
import { requireRole } from "@/lib/auth/require-role";
import { createProperty } from "@/lib/properties/actions";

export default async function NewPropertyPage() {
  await requireRole(["admin"]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-3xl">Nueva Propiedad</h1>
      <PropertyForm action={createProperty} />
    </div>
  );
}
