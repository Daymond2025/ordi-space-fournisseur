"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";
import type { PeriodeEspace } from "@/lib/types";

const OPTIONS: { value: PeriodeEspace; label: string }[] = [
  { value: "aujourd_hui", label: "Aujourd'hui" },
  { value: "semaine", label: "Cette semaine" },
  { value: "semaine_derniere", label: "Semaine dernière" },
  { value: "mois", label: "Ce mois-ci" },
  { value: "tout", label: "Tout" },
];

type Props = {
  value: PeriodeEspace;
  onChange: (valeur: PeriodeEspace) => void;
  /** Dimensions exactes du mockup (ex. "Paiement" : 112×31) — en style inline, n'affecte pas les autres écrans qui ne les passent pas. */
  largeurPx?: number;
  hauteurPx?: number;
};

/**
 * Pill "TOUT ▾" du header Space — copié de
 * Cordinateur_App_Web/src/components/space/SelecteurPeriode.tsx (variante
 * "pill" uniquement, cette app n'a pas de variante "compact"). Choix retenu
 * mais volontairement pas encore branché sur les 3 statistiques ci-dessous :
 * "Nouvelle commande"/"Commandes en cours" sont des compteurs à l'instant T
 * (file d'attente courante) et "Commission totale à payer" est un solde
 * courant — aucun des deux ne se découpe par période côté backend
 * aujourd'hui (voir FournisseurController::commandes()/portefeuille()).
 */
export function SelecteurPeriode({ value, onChange, largeurPx, hauteurPx }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;

    function surClicExterieur(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) setOuvert(false);
    }
    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }

    document.addEventListener("mousedown", surClicExterieur);
    document.addEventListener("keydown", surTouche);
    return () => {
      document.removeEventListener("mousedown", surClicExterieur);
      document.removeEventListener("keydown", surTouche);
    };
  }, [ouvert]);

  const selectionne = OPTIONS.find((o) => o.value === value) ?? OPTIONS[4];

  return (
    <div ref={conteneurRef} className="relative">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className={`flex h-8 items-center justify-between gap-1 whitespace-nowrap rounded-full bg-white/20 pl-3 pr-1.5 font-bold text-white ${
          largeurPx ? "text-[9px] tracking-normal" : "text-xs uppercase tracking-wide"
        }`}
        style={{
          ...(largeurPx ? { width: `${largeurPx}px`, textTransform: "uppercase" } : {}),
          ...(hauteurPx ? { height: `${hauteurPx}px` } : {}),
        }}
      >
        {selectionne.label}
        <span className={`flex shrink-0 items-center justify-center rounded-full bg-white/25 ${largeurPx ? "h-4 w-4" : "h-5 w-5"}`}>
          <ChevronDownIcon className={`h-3 w-3 transition-transform duration-200 ${ouvert ? "rotate-180" : ""}`} />
        </span>
      </button>

      {ouvert ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-44 overflow-hidden rounded-2xl border border-brand-line bg-white p-1.5 text-brand-ink shadow-xl">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOuvert(false);
              }}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                option.value === value ? "bg-blue-50 font-semibold text-[color:var(--brand-blue-end)]" : "hover:bg-[#F5F7FA]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
