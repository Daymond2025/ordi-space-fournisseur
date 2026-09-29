"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Localite } from "@/lib/types";

/**
 * Barème de frais de livraison d'un produit : un montant par localité (GET
 * /localites). Copié tel quel de Cordinateur_App_Web/src/components/produit/
 * BaremeLivraison.tsx. Seules les localités renseignées sont livrées —
 * `valeurs` : id de localité → montant saisi (vide = non livrée).
 */
export function BaremeLivraison({
  token,
  valeurs,
  onChange,
}: {
  token: string;
  valeurs: Record<number, string>;
  onChange: (valeurs: Record<number, string>) => void;
}) {
  const [localites, setLocalites] = useState<Localite[] | null>(null);

  useEffect(() => {
    let annule = false;
    apiFetch<Localite[]>("/localites", { token })
      .then((liste) => {
        if (!annule) setLocalites(liste);
      })
      .catch(() => {
        if (!annule) setLocalites([]);
      });
    return () => {
      annule = true;
    };
  }, [token]);

  if (localites === null) return <p className="text-xs text-brand-muted">Chargement des localités…</p>;
  if (localites.length === 0) return <p className="text-xs text-brand-muted">Aucune localité disponible.</p>;

  return (
    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
      {localites.map((localite) => (
        <div key={localite.id} className="flex items-center gap-3">
          <span className="min-w-0 flex-1 truncate text-sm text-brand-ink">{localite.nom}</span>
          <div className="flex w-36 shrink-0 items-center rounded-xl border border-brand-line px-3 py-2">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={valeurs[localite.id] ?? ""}
              onChange={(e) => onChange({ ...valeurs, [localite.id]: e.target.value })}
              placeholder="—"
              aria-label={`Frais de livraison ${localite.nom}`}
              className="min-w-0 flex-1 text-right text-sm text-brand-ink outline-none placeholder:text-brand-muted"
            />
            <span className="ml-1.5 shrink-0 text-xs text-brand-muted">FCFA</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Lignes `frais_livraison[i][localite_id|montant]` d'un FormData, pour les seules localités renseignées. */
export function ajouterBaremeAuFormData(formData: FormData, valeurs: Record<number, string>): void {
  Object.entries(valeurs)
    .filter(([, montant]) => montant.trim() !== "")
    .forEach(([localiteId, montant], index) => {
      formData.append(`frais_livraison[${index}][localite_id]`, localiteId);
      formData.append(`frais_livraison[${index}][montant]`, montant);
    });
}
