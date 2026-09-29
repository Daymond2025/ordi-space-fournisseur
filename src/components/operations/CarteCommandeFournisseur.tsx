"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDownIcon, MonitorIcon } from "@/components/icons";
import { formaterTempsRelatif } from "@/lib/temps";
import { trouverBucketCommande } from "@/lib/statuts";
import type { CommandeCarte } from "@/lib/types";

/**
 * Carte commande — onglet "Commandes uniquement" du Centre des commandes.
 * Copiée de Cordinateur_App_Web/src/components/operations/CarteCommandeFournisseur.tsx
 * (même écran d'origine). En-tête coloré par bucket de statut, badge de
 * messages non lus affiché seulement s'il y en a.
 */
export function CarteCommandeFournisseur({ carte }: { carte: CommandeCarte }) {
  const [ouvert, setOuvert] = useState(true);
  const router = useRouter();
  const bucket = trouverBucketCommande(carte.statut);

  return (
    <div className="overflow-hidden rounded-[9px] bg-white" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className="flex w-full items-center justify-between px-3.5 py-2 text-white"
        style={{ background: bucket.degrade }}
      >
        <span className="flex items-center gap-2">
          {carte.nouvelles_activites > 0 ? (
            <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
              <Image src="/images/discuter.png" alt="" width={20} height={20} className="h-5 w-5 object-contain" />
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {carte.nouvelles_activites}
              </span>
            </span>
          ) : null}
          <span className="text-xs font-extrabold uppercase tracking-wide">{bucket.libelleCarte}</span>
        </span>

        <span className="flex h-[22px] w-[23px] shrink-0 items-center justify-center rounded-full border-2 border-white/28 bg-white">
          <ChevronDownIcon
            className={`h-3.5 w-3.5 text-[color:var(--brand-blue-end)] transition-transform duration-200 ${ouvert ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {ouvert ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => router.push(`/commande/${carte.commande_id}`)}
          onKeyDown={(e) => e.key === "Enter" && router.push(`/commande/${carte.commande_id}`)}
          className="relative flex cursor-pointer gap-2.5 p-2.5"
        >
          <span className="absolute right-2.5 top-2.5 text-[11px] text-brand-muted">
            {formaterTempsRelatif(carte.derniere_action)}
          </span>

          <div className="relative h-[72px] w-[68px] shrink-0 overflow-hidden rounded-[9px] bg-[#F6F8FE]">
            {carte.photo ? (
              <Image src={carte.photo} alt={carte.nom_produit} fill className="object-cover" sizes="68px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-brand-muted">
                <MonitorIcon className="h-6 w-6" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pr-14">
            <p className="truncate text-sm font-bold text-brand-ink">{carte.nom_produit}</p>

            <span className="mt-1.5 inline-block rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-brand-ink">
              {carte.nom_client}
            </span>

            <p className="mt-1.5 truncate text-sm">
              {carte.zone_localite ? <span className="text-brand-muted">{carte.zone_localite}</span> : null}
              {carte.zone_localite && carte.telephone ? " · " : null}
              {carte.telephone ? (
                <a
                  href={`tel:${carte.telephone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-[color:var(--brand-blue-end)]"
                >
                  {carte.telephone}
                </a>
              ) : null}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
