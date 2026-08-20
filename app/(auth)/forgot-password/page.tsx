import Link from "next/link";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getDefaultRouteForRole } from "@/lib/auth/rbac";
import { getSession } from "@/lib/auth/session";

export default async function ForgotPasswordPage() {
  const session = await getSession();
  if (session) redirect(getDefaultRouteForRole(session.role));

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-8">
      <Link
        href="/"
        className="absolute top-8 left-8 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors duration-500 hover:text-accent md:left-16"
      >
        ← Volver al Sitio
      </Link>

      <div className="mb-4 font-serif text-2xl text-foreground">Domus</div>
      <p className="mb-10 max-w-sm text-center text-sm text-muted-foreground">
        Ingrese su correo electrónico y le enviaremos un enlace para
        restablecer su contraseña.
      </p>

      <ForgotPasswordForm />

      <Link
        href="/login"
        className="mt-10 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors duration-500 hover:text-accent"
      >
        Volver a Iniciar Sesión
      </Link>
    </div>
  );
}
