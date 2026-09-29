"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ChevronLeftIcon, MonitorIcon } from "@/components/icons";
import { SelecteurPeriode } from "@/components/space/SelecteurPeriode";
import { CarteStatistique } from "@/components/space/CarteStatistique";
import type { PeriodeEspace, ProduitPlusVendu, ProfilFournisseur, StatistiquesFournisseur } from "@/lib/types";

function formaterDot(valeur: number, suffixe: string): string {
  return `${Math.round(valeur).toLocaleString("en-US").replace(/,/g, ".")} ${suffixe}`;
}

function formaterComma(valeur: number): string {
  return `${Math.round(valeur).toLocaleString("en-US")} F`;
}

function libellePeriodePrecedente(periode: PeriodeEspace): string {
  switch (periode) {
    case "aujourd_hui":
      return "vs hier";
    case "semaine":
      return "vs semaine dernière";
    case "semaine_derniere":
      return "vs il y a 2 semaines";
    case "mois":
      return "vs mois passé";
    default:
      return "";
  }
}

function CarteProduitVendu({ produit }: { produit: ProduitPlusVendu }) {
  return (
    <div className="flex items-center gap-3 border-b border-brand-line py-3 last:border-b-0">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#F6F8FE]">
        {produit.photo ? (
          <Image src={produit.photo} alt={produit.nom_produit ?? ""} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-muted">
            <MonitorIcon className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-brand-ink">{produit.nom_produit}</p>
        <p className="text-xs text-brand-muted">{produit.quantite_vendue} vendus</p>
      </div>
      <span className="shrink-0 text-sm font-bold text-brand-ink">{formaterComma(produit.montant)}</span>
    </div>
  );
}

/**
 * "Statistiques" (Profil → Statistique) — même écran que Cordinateur_App_Web/
 * src/app/fournisseur/[id]/statistiques/EcranStatistiquesFournisseur.tsx
 * (tableau de bord qu'utilise le Coordinateur pour un fournisseur donné),
 * juste sur GET /fournisseur/moi/statistiques (soi-même) au lieu de
 * /fournisseurs/{id}/statistiques.
 */
export function EcranStatistiques() {
  const { token } = useAuth();
  const router = useRouter();

  const [nomEntreprise, setNomEntreprise] = useState("");
  const [periode, setPeriode] = useState<PeriodeEspace>("semaine");
  const [stats, setStats] = useState<StatistiquesFournisseur | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<ProfilFournisseur>("/moi/profil", { token })
      .then((data) => {
        if (!annule) setNomEntreprise(data.nom_entreprise);
      })
      .catch(() => {});

    return () => {
      annule = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<StatistiquesFournisseur>(`/fournisseur/moi/statistiques?periode=${periode}`, { token })
      .then((data) => {
        if (!annule) setStats(data);
      })
      .catch(() => {
        if (!annule) setStats(null);
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [token, periode]);

  const croissance = stats?.croissance_pourcentage ?? null;
  const positive = croissance !== null && croissance >= 0;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="bg-gradient-espace shrink-0 rounded-b-[30px] px-4 pb-10 pt-4 text-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Retour"
            className="flex h-[31px] w-8 shrink-0 items-center justify-center rounded-[7px]"
            style={{ background: "rgba(255, 255, 255, 0.23)" }}
          >
            <ChevronLeftIcon className="h-[19px] w-[19px]" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-base font-extrabold leading-none">Statistiques</p>
            <p className="mt-1 truncate text-xs text-white/80">{nomEntreprise}</p>
          </div>

          <SelecteurPeriode value={periode} onChange={setPeriode} />
        </div>
      </div>

      <div className="-mt-6 px-[26px]">
        <div
          className="flex flex-col items-center justify-center rounded-[24px] bg-white p-6 text-center"
          style={{ height: "140px", boxShadow: "0px 12px 12px 12px rgba(29, 99, 224, 0.08)" }}
        >
          <p className="text-sm text-brand-muted">Chiffre d&apos;Affaires</p>
          <p className="mt-1 text-2xl font-extrabold text-[color:var(--brand-blue-end)]">{formaterDot(stats?.chiffre_affaires ?? 0, "F")}</p>
          {croissance !== null ? (
            <span
              className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                positive ? "bg-blue-50 text-[color:var(--brand-blue-end)]" : "bg-rose-50 text-rose-500"
              }`}
            >
              {positive ? "↗" : "↘"} {positive ? "+" : ""}
              {croissance}% {libellePeriodePrecedente(periode)}
            </span>
          ) : (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#F5F7FA] px-3 py-1 text-xs font-bold text-brand-muted">
              Pas de comparaison disponible
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 justify-items-center gap-3 px-4">
        <CarteStatistique type="compte" couleur="blue" valeur={stats?.produits_vendus ?? 0} label="Produits vendus" />
        <CarteStatistique type="compte" couleur="orange" valeur={stats?.commandes_recues ?? 0} label="Commandes reçues" />
        <CarteStatistique type="compte" couleur="green" valeur={stats?.commandes_livrees ?? 0} label="Commandes Livrées" />
        <CarteStatistique type="compte" couleur="pink" valeur={stats?.produits_distincts_vendus ?? 0} label="Produits les plus vendus" />
        <CarteStatistique type="compte" couleur="rose" valeur={stats?.commandes_annulees ?? 0} label="Commandes Annulées" />
        <CarteStatistique type="montant" couleur="blue" valeur={formaterDot(stats?.commission_ordispace ?? 0, "F")} label="Commission Ordi'space" />
      </div>

      <div className="mx-4 mt-5 flex items-center justify-between border-b border-brand-line pb-2 text-sm text-brand-muted">
        <span>Produit les plus vendus</span>
        <span className="font-bold text-brand-ink">{stats?.produits_distincts_vendus ?? 0}</span>
      </div>

      <div className="mx-4 mb-6 rounded-2xl bg-white px-4" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
        {chargement ? (
          <p className="py-6 text-center text-sm text-brand-muted">Chargement…</p>
        ) : (stats?.produits_plus_vendus.length ?? 0) === 0 ? (
          <p className="py-6 text-center text-sm text-brand-muted">Aucune vente pour l&apos;instant.</p>
        ) : (
          stats?.produits_plus_vendus.map((produit) => <CarteProduitVendu key={produit.produit_id} produit={produit} />)
        )}
      </div>
    </div>
  );
}
