import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getDefaultRouteForRole } from "@/lib/auth/rbac";
import { getSession } from "@/lib/auth/session";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(getDefaultRouteForRole(session.role));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-8">
      <div className="mb-10 font-serif text-2xl text-foreground">Domus</div>
      <LoginForm />
    </div>
  );
}
