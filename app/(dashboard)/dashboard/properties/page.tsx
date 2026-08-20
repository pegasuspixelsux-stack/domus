import { requireRole } from "@/lib/auth/require-role";

export default async function PropertiesPage() {
  await requireRole(["admin"]);

  return (
    <div>
      <h1 className="font-serif text-3xl">Propiedades</h1>
      <p className="mt-4 text-muted-foreground">
        Próximamente: gestión completa de propiedades (CRUD).
      </p>
    </div>
  );
}
