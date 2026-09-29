"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons";
import { DetailCommande } from "@/components/discussion/DetailCommande";
import type { DonneesCommandeCreee } from "@/lib/types";

/**
 * Instantané immuable de la commande à sa création — carte système à part
 * dans le fil de discussion produit. Copiée de
 * Cordinateur_App_Web/src/components/discussion/CarteNouvelleCommande.tsx.
 */
export function CarteNouvelleCommande({ donnees }: { donnees: DonneesCommandeCreee }) {
  const [ouvert, setOuvert] = useState(true);

  return (
    <div className="mx-4 overflow-hidden rounded-[9px] bg-white">
      <button type="button" onClick={() => setOuvert((v) => !v)} className="relative flex w-full items-center justify-center bg-black px-3.5 py-2.5">
        <span className="text-xs font-extrabold uppercase tracking-wide text-white underline decoration-[color:var(--brand-blue-end)] decoration-2 underline-offset-4">
          Nouvelle commande
        </span>

        <span className="absolute right-3 flex h-[22px] w-[23px] shrink-0 items-center justify-center rounded-full bg-white">
          <ChevronDownIcon className={`h-3.5 w-3.5 text-black transition-transform duration-200 ${ouvert ? "rotate-180" : ""}`} />
        </span>
      </button>

      {ouvert ? (
        <>
          <div className="px-3.5 pb-3.5 pt-3">
            <DetailCommande donnees={donnees} />
          </div>
          <div className="h-4 w-full bg-black" />
        </>
      ) : null}
    </div>
  );
}
