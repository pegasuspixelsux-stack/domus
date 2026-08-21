import Link from "next/link";
import { PROPERTY_MANAGER_ROLES } from "@/lib/auth/rbac";
import { requireRole } from "@/lib/auth/require-role";
import { STATUS_LABELS } from "@/lib/leads/constants";
import { getLeads } from "@/lib/leads/data";
import { getProperties } from "@/lib/properties/data";

const PROPERTY_STATUS_LABELS: Record<string, string> = {
  available: "Disponible",
  reserved: "Reservada",
  sold: "Vendida",
};

const LATEST_LIMIT = 5;

export default async function DashboardHomePage() {
  const session = await requireRole(PROPERTY_MANAGER_ROLES);
  const [properties, leads] = await Promise.all([getProperties(), getLeads(session)]);

  const kpis = [
    { label: "Total Propiedades", value: properties.length },
    { label: "Disponibles", value: properties.filter((p) => p.status === "available").length },
    { label: "Total Leads", value: leads.length },
    { label: "Leads Nuevos", value: leads.filter((l) => l.status === "new").length },
  ];

  const latestProperties = properties.slice(0, LATEST_LIMIT);
  const latestLeads = [...leads]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, LATEST_LIMIT);

  return (
    <div className="flex flex-col gap-12">
      <h1 className="font-serif text-3xl">Panel de Control</h1>

      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex flex-col gap-2 border-t-4 border-t-accent pt-6">
            <span className="font-serif text-4xl">{kpi.value}</span>
            <span className="text-xs tracking-[0.2em] text-muted-foreground uppercase">{kpi.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">Últimas Propiedades</h2>
          <Link
            href="/dashboard/properties"
            className="text-xs tracking-[0.2em] text-muted-foreground uppercase transition-colors duration-500 hover:text-accent"
          >
            Ver todas
          </Link>
        </div>

        {latestProperties.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay propiedades cargadas todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-foreground/20 text-xs tracking-[0.2em] text-muted-foreground uppercase">
                  <th className="py-3 pr-4">Título</th>
                  <th className="py-3 pr-4">Precio</th>
                  <th className="py-3 pr-4">Estado</th>
                  <th className="py-3 pr-4">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {latestProperties.map((property) => (
                  <tr key={property.id} className="border-b border-foreground/10">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/dashboard/properties/${property.id}/edit`}
                        className="transition-colors duration-500 hover:text-accent"
                      >
                        {property.title}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      {property.currency} {property.price.toLocaleString("es-UY")}
                    </td>
                    <td className="py-3 pr-4">{PROPERTY_STATUS_LABELS[property.status] ?? property.status}</td>
                    <td className="py-3 pr-4">{new Date(property.updatedAt).toLocaleDateString("es-UY")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">Últimos Leads</h2>
          <Link
            href="/dashboard/pipeline"
            className="text-xs tracking-[0.2em] text-muted-foreground uppercase transition-colors duration-500 hover:text-accent"
          >
            Ver todos
          </Link>
        </div>

        {latestLeads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay leads cargados todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-foreground/20 text-xs tracking-[0.2em] text-muted-foreground uppercase">
                  <th className="py-3 pr-4">Nombre</th>
                  <th className="py-3 pr-4">Origen</th>
                  <th className="py-3 pr-4">Estado</th>
                  <th className="py-3 pr-4">Creado</th>
                </tr>
              </thead>
              <tbody>
                {latestLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-foreground/10">
                    <td className="py-3 pr-4">{lead.name}</td>
                    <td className="py-3 pr-4">{lead.source}</td>
                    <td className="py-3 pr-4">{STATUS_LABELS[lead.status] ?? lead.status}</td>
                    <td className="py-3 pr-4">{new Date(lead.createdAt).toLocaleDateString("es-UY")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
