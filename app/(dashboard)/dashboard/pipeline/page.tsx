import { requireRole } from "@/lib/auth/require-role";

export default async function PipelinePage() {
  await requireRole(["admin", "sales"]);

  return (
    <div>
      <h1 className="font-serif text-3xl">Pipeline de Leads</h1>
      <p className="mt-4 text-muted-foreground">
        Próximamente: vista Kanban/tabla de seguimiento de clientes.
      </p>
    </div>
  );
}
