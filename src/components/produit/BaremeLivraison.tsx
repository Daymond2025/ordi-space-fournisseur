"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Localite } from "@/lib/types";

const MONTANT_DEFAUT_ABIDJAN = "1500";
const MONTANT_DEFAUT_HORS_ABIDJAN = "3000";

function construireValeurs(liste: Localite[], abidjan: string, horsAbidjan: string): Record<number, string> {
  const nouvelles: Record<number, string> = {};
  liste.forEach((localite) => {
    const montant = localite.type === "commune_abidjan" ? abidjan : horsAbidjan;
    if (montant.trim() !== "") nouvelles[localite.id] = montant;
  });
  return nouvelles;
}

/**
 * Barème de frais de livraison d'un produit — 2 montants (Abidjan / hors
 * Abidjan, à partir de 1500/3000 FCFA par défaut) plutôt qu'un champ par
 * commune : le fournisseur fixe un point de départ, appliqué à toutes les
 * localités du même type (Localite.type). Reconstruit en coulisses la même
 * structure `valeurs` (id de localité → montant) qu'avant, attendue par
 * ajouterBaremeAuFormData() — aucun changement côté soumission/backend.
 *
 * Mode modification (EcranModifierProduit) : `valeurs` arrive déjà rempli
 * avec le barème réel du produit (fixé par setFrais() côté parent, dans un
 * effet séparé) — on le détecte via valeursRef (toujours à jour, lue
 * seulement une fois les localités connues) pour EN DÉDUIRE les 2 montants
 * plutôt que d'écraser un barème personnalisé avec les valeurs par défaut.
 * Mode création : `valeurs` est vide au départ → défauts 1500/3000 appliqués.
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
  const [montantAbidjan, setMontantAbidjan] = useState(MONTANT_DEFAUT_ABIDJAN);
  const [montantHorsAbidjan, setMontantHorsAbidjan] = useState(MONTANT_DEFAUT_HORS_ABIDJAN);

  const valeursRef = useRef(valeurs);
  // Tenu à jour après chaque rendu (pas pendant : react-hooks/refs interdit
  // d'écrire une ref au corps du rendu) — sans dépendances, cet effet
  // s'exécute après CHAQUE commit, sans déclencher de nouveau fetch.
  useEffect(() => {
    valeursRef.current = valeurs;
  });

  useEffect(() => {
    let annule = false;
    apiFetch<Localite[]>("/localites", { token })
      .then((liste) => {
        if (annule) return;
        setLocalites(liste);

        const idAbidjanRenseigne = liste.find((l) => l.type === "commune_abidjan" && valeursRef.current[l.id])?.id;
        const idHorsAbidjanRenseigne = liste.find((l) => l.type === "ville" && valeursRef.current[l.id])?.id;
        const abidjan = idAbidjanRenseigne !== undefined ? valeursRef.current[idAbidjanRenseigne] : MONTANT_DEFAUT_ABIDJAN;
        const horsAbidjan =
          idHorsAbidjanRenseigne !== undefined ? valeursRef.current[idHorsAbidjanRenseigne] : MONTANT_DEFAUT_HORS_ABIDJAN;

        setMontantAbidjan(abidjan);
        setMontantHorsAbidjan(horsAbidjan);
        onChange(construireValeurs(liste, abidjan, horsAbidjan));
      })
      .catch(() => {
        if (!annule) setLocalites([]);
      });
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- volontaire : ne doit s'exécuter qu'une fois (valeursRef porte la valeur fraîche sans re-déclencher le fetch).
  }, [token]);

  function changerAbidjan(montant: string) {
    setMontantAbidjan(montant);
    if (localites) onChange(construireValeurs(localites, montant, montantHorsAbidjan));
  }

  function changerHorsAbidjan(montant: string) {
    setMontantHorsAbidjan(montant);
    if (localites) onChange(construireValeurs(localites, montantAbidjan, montant));
  }

  if (localites === null) return <p className="text-xs text-brand-muted">Chargement des localités…</p>;
  if (localites.length === 0) return <p className="text-xs text-brand-muted">Aucune localité disponible.</p>;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1 text-sm text-brand-ink">Livraison Abidjan</span>
        <div className="flex w-40 shrink-0 items-center rounded-xl border border-brand-line px-3 py-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={montantAbidjan}
            onChange={(e) => changerAbidjan(e.target.value)}
            placeholder="à partir de 1500"
            aria-label="Frais de livraison Abidjan"
            className="min-w-0 flex-1 text-right text-sm text-brand-ink outline-none placeholder:text-brand-muted"
          />
          <span className="ml-1.5 shrink-0 text-xs text-brand-muted">FCFA</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1 text-sm text-brand-ink">Livraison Hors-Abidjan</span>
        <div className="flex w-40 shrink-0 items-center rounded-xl border border-brand-line px-3 py-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={montantHorsAbidjan}
            onChange={(e) => changerHorsAbidjan(e.target.value)}
            placeholder="à partir de 3000"
            aria-label="Frais de livraison hors Abidjan"
            className="min-w-0 flex-1 text-right text-sm text-brand-ink outline-none placeholder:text-brand-muted"
          />
          <span className="ml-1.5 shrink-0 text-xs text-brand-muted">FCFA</span>
        </div>
      </div>
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
