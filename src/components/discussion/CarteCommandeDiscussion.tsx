"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDownIcon, MonitorIcon } from "@/components/icons";
import { formaterTempsRelatif } from "@/lib/temps";
import { DEGRADE_STATUT, LIBELLES_STATUT } from "@/lib/statuts";
import type { CommandeCarte } from "@/lib/types";

/**
 * Carte-commande repliable du fil de discussion produit — reprend le fil
 * fusionné de conversationProduit(). Copiée de
 * Cordinateur_App_Web/src/components/discussion/CarteCommandeDiscussion.tsx
 * (même écran d'origine). Le badge rouge compte les messages non lus de
 * CETTE commande précise, distinct du badge produit de l'accueil.
 */
export function CarteCommandeDiscussion({ carte }: { carte: CommandeCarte }) {
  const [ouvert, setOuvert] = useState(true);
  const router = useRouter();

  return (
    <div className="mx-4 overflow-hidden rounded-[9px] bg-white">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        style={{ background: DEGRADE_STATUT[carte.statut] ?? DEGRADE_STATUT.en_attente }}
        className="flex w-full items-center justify-between px-3.5 py-2 text-white"
      >
        <span className="flex items-center gap-2">
          <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
            <Image src="/images/discuter.png" alt="" width={20} height={20} className="h-5 w-5 object-contain" />
            {carte.nouvelles_activites > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {carte.nouvelles_activites}
              </span>
            ) : null}
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wide">
            {LIBELLES_STATUT[carte.statut] ?? carte.statut}
          </span>
        </span>

        <span className="flex h-[22px] w-[23px] shrink-0 items-center justify-center rounded-full border-2 border-white/28 bg-white">
          <ChevronDownIcon
            className={`h-3.5 w-3.5 text-[color:var(--brand-blue-end)] transition-transform duration-200 ${ouvert ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {ouvert ? (
        <div className="px-3 pb-3 pt-2.5">
          <div
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/commande/${carte.commande_id}`)}
            onKeyDown={(e) => e.key === "Enter" && router.push(`/commande/${carte.commande_id}`)}
            className="flex cursor-pointer gap-2.5 rounded-[9px] bg-white p-2.5"
            style={{ boxShadow: "1px 1px 2px 0px rgba(0, 0, 0, 0.25)" }}
          >
            <div className="relative h-[72px] w-[68px] shrink-0 overflow-hidden rounded-[9px] bg-[#F6F8FE]">
              {carte.photo ? (
                <Image src={carte.photo} alt={carte.nom_produit} fill className="object-cover" sizes="68px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-brand-muted">
                  <MonitorIcon className="h-6 w-6" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-brand-ink">{carte.description ?? carte.nom_produit}</p>

              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-brand-ink">
                  {carte.nom_client}
                </span>
                {carte.zone_localite ? (
                  <span className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-brand-muted">
                    {carte.zone_localite}
                  </span>
                ) : null}
              </div>

              {carte.telephone ? (
                <a
                  href={`tel:${carte.telephone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1.5 block text-sm font-semibold text-[color:var(--brand-blue-end)]"
                >
                  {carte.telephone}
                </a>
              ) : null}
            </div>
          </div>

          {carte.dernier_suivi ? (
            <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-[#F5F7FA] px-3 py-2">
              <div className="min-w-0 flex-1">
                {carte.dernier_suivi.acteur ? (
                  <p className="text-xs font-bold text-brand-ink">{carte.dernier_suivi.acteur}</p>
                ) : null}
                <p className="text-xs text-brand-muted">{carte.dernier_suivi.texte}</p>
              </div>
              <span className="shrink-0 text-[11px] text-brand-muted">{formaterTempsRelatif(carte.dernier_suivi.date)}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
