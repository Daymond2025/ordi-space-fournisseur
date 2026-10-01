"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { EyeOffIcon, PinIcon } from "@/components/icons";

/**
 * Feuille d'actions d'une carte "produit à activité récente" (écran Space) —
 * "Épingler"/"retirer" (retour de test réel), même style visuel que
 * FeuilleMenuProduit.tsx. POST/DELETE produits/{id}/epingler-accueil et POST
 * produits/{id}/retirer-accueil (MessageController) — le fournisseur ne voit
 * que ses propres produits sur cet écran, aucune policy supplémentaire ici.
 */
export function FeuilleActionsCarteProduitActif({
  produitId,
  epingle,
  token,
  onFermer,
  onApplique,
}: {
  produitId: number;
  epingle: boolean;
  token: string;
  onFermer: () => void;
  onApplique: () => void;
}) {
  const [enCours, setEnCours] = useState(false);

  async function basculerEpingle() {
    if (enCours) return;
    setEnCours(true);
    try {
      await apiFetch(`/produits/${produitId}/epingler-accueil`, { method: epingle ? "DELETE" : "POST", token });
      onApplique();
    } finally {
      setEnCours(false);
    }
  }

  async function retirer() {
    if (enCours) return;
    setEnCours(true);
    try {
      await apiFetch(`/produits/${produitId}/retirer-accueil`, { method: "POST", token });
      onApplique();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onFermer}>
      <div className="w-full max-w-md rounded-t-3xl bg-white pb-6 pt-3" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-line" />

        <div className="space-y-3 px-4">
          <button
            type="button"
            disabled={enCours}
            onClick={basculerEpingle}
            className="mx-auto flex h-[62px] w-[284px] items-center justify-center gap-2 rounded-[11px] text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "rgba(0, 119, 255, 1)" }}
          >
            <PinIcon className="h-5 w-5" />
            {epingle ? "Désépingler" : "Épingler"}
          </button>
          <button
            type="button"
            disabled={enCours}
            onClick={retirer}
            className="mx-auto flex h-[62px] w-[284px] items-center justify-center gap-2 rounded-[11px] text-sm font-bold disabled:opacity-50"
            style={{ background: "rgba(250, 236, 252, 1)", border: "1px solid rgba(255, 138, 88, 1)", color: "rgba(255, 90, 20, 1)" }}
          >
            <EyeOffIcon className="h-5 w-5" />
            Retirer de la liste
          </button>
          <p className="text-center text-xs text-brand-muted">
            Une carte retirée réapparaît automatiquement dès qu&apos;une nouvelle commande arrive.
          </p>
        </div>
      </div>
    </div>
  );
}
