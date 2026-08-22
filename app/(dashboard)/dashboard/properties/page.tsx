import Link from "next/link";
import { DeletePropertyButton } from "@/components/dashboard/delete-property-button";
import { ImportPropertiesButton } from "@/components/dashboard/import-properties-button";
import { Button } from "@/components/ui/button";
import { PROPERTY_MANAGER_ROLES } from "@/lib/auth/rbac";
import { requireRole } from "@/lib/auth/require-role";
import { PROPERTY_STATUS_LABELS } from "@/lib/properties/constants";
import { getProperties } from "@/lib/properties/data";

export default async function PropertiesPage() {
  await requireRole(PROPERTY_MANAGER_ROLES);
  const properties = await getProperties();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Propiedades</h1>
        <div className="flex items-center gap-4">
          <ImportPropertiesButton />
          <Button variant="primary" href="/dashboard/properties/new">
            Nueva Propiedad
          </Button>
        </div>
      </div>

      {properties.length === 0 ? (
        <p className="text-muted-foreground">No hay propiedades cargadas todavía.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-foreground/20 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <th className="py-3 pr-4">Título</th>
                <th className="py-3 pr-4">Precio</th>
                <th className="py-3 pr-4">Estado</th>
                <th className="py-3 pr-4">Actualizado</th>
                <th className="py-3 pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id} className="border-b border-foreground/10">
                  <td className="py-3 pr-4">{property.title}</td>
                  <td className="py-3 pr-4">
                    {property.currency} {property.price.toLocaleString("es-UY")}
                  </td>
                  <td className="py-3 pr-4">{PROPERTY_STATUS_LABELS[property.status]}</td>
                  <td className="py-3 pr-4">{new Date(property.updatedAt).toLocaleDateString("es-UY")}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/dashboard/properties/${property.id}/edit`}
                        className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-accent"
                      >
                        Editar
                      </Link>
                      <DeletePropertyButton id={property.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
