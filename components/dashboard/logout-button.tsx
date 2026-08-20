"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setLoading(true);
    setError(null);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      await signOut(getFirebaseAuth());
      router.push("/login");
      router.refresh();
    } catch {
      setError("No se pudo cerrar sesión. Intente de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error && (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors duration-500 hover:text-accent"
      >
        {loading ? "Saliendo…" : "Cerrar Sesión"}
      </button>
    </div>
  );
}
