"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

export function RouteGuard({ children }: { children: ReactNode }) {
  const { user, pret } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (pret && !user) {
      router.replace("/connexion");
    }
  }, [pret, user, router]);

  if (!pret || !user) {
    return <div className="flex h-screen w-screen items-center justify-center text-sm text-brand-muted">Chargement…</div>;
  }

  return <>{children}</>;
}
