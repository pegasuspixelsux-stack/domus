"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/auth/rbac";
import type { AdminUser } from "@/lib/team/data";
import { CreateUserModal } from "./create-user-modal";

export function UsersTable({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Usuarios</h1>
        <Button variant="primary" onClick={() => setCreating(true)}>
          Nuevo Usuario
        </Button>
      </div>

      {users.length === 0 ? (
        <p className="text-muted-foreground">No hay usuarios cargados todavía.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-foreground/20 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <th className="py-3 pr-4">Nombre</th>
                <th className="py-3 pr-4">Correo</th>
                <th className="py-3 pr-4">Rol</th>
                <th className="py-3 pr-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.uid} className="border-b border-foreground/10">
                  <td className="py-3 pr-4">{user.displayName}</td>
                  <td className="py-3 pr-4">{user.email}</td>
                  <td className="py-3 pr-4">{ROLE_LABELS[user.role]}</td>
                  <td className="py-3 pr-4">{user.active ? "Activo" : "Inactivo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <CreateUserModal
          onClose={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
