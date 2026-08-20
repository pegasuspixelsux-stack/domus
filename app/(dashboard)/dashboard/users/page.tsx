import { requireRole } from "@/lib/auth/require-role";

export default async function UsersPage() {
  await requireRole(["admin"]);

  return (
    <div>
      <h1 className="font-serif text-3xl">Usuarios</h1>
      <p className="mt-4 text-muted-foreground">
        Próximamente: gestión de privilegios del equipo.
      </p>
    </div>
  );
}
