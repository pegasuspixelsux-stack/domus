"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await signOut(getFirebaseAuth());
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors duration-500 hover:text-accent"
    >
      {loading ? "Saliendo…" : "Cerrar Sesión"}
    </button>
  );
}
