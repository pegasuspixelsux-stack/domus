import { UsersTable } from "@/components/dashboard/users-table";
import { requireRole } from "@/lib/auth/require-role";
import { getAllUsers } from "@/lib/team/data";

export default async function UsersPage() {
  await requireRole(["admin"]);
  const users = await getAllUsers();

  return <UsersTable users={users} />;
}
