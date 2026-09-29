"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { CarteStatistiqueCatalogue } from "@/components/produit/CarteStatistiqueCatalogue";
import { CarteProduitCatalogue } from "@/components/produit/CarteProduitCatalogue";
import { ChevronLeftIcon, SearchIcon } from "@/components/icons";
import type { ProduitCatalogue, StatistiquesCatalogue } from "@/lib/types";

type Filtre = "tous" | "non_publies" | "booster" | "indisponible";

const ONGLETS: { valeur: Filtre; label: string }[] = [
  { valeur: "tous", label: "Tous" },
  { valeur: "non_publies", label: "Non publiés" },
  { valeur: "booster", label: "Booster" },
  { valeur: "indisponible", label: "Indisponible" },
];

/**
 * Onglet "Mes produits" (bottombar) — même écran que le Catalogue Espace
 * Coordinateur (Cordinateur_App_Web/EcranCatalogue.tsx), sans le sélecteur
 * "Fournisseur" (implicite : GET /produits et /produits/statistiques sont
 * déjà scopés au fournisseur connecté côté backend — voir
 * ProduitController::index()/statistiques()). Le fournisseur ne publie
 * jamais directement : "+" ouvre le même formulaire que le Coordinateur,
 * sauf qu'il finit "en_attente" (au Coordinateur de valider/publier), jamais
 * "valide" — voir ProduitController::store().
 */
export function EcranMesProduits() {
  const { token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<StatistiquesCatalogue | null>(null);
  const [produits, setProduits] = useState<ProduitCatalogue[]>([]);
  const [chargement, setChargement] = useState(true);
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<StatistiquesCatalogue>("/produits/statistiques", { token })
      .then((data) => {
        if (!annule) setStats(data);
      })
      .catch(() => {});

    return () => {
      annule = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let annule = false;

    const params = new URLSearchParams({ per_page: "50" });
    if (filtre === "tous") params.set("statut", "tous");
    if (filtre === "booster") {
      params.set("statut", "tous");
      params.set("booste", "1");
    }
    if (filtre === "indisponible") params.set("statut", "indisponible");
    // "non_publies" : pas de ?statut= — repli par défaut côté backend
    // (file_d'attente en_attente/corrige, voir filtrerCatalogueCoordinateur()
    // — même branche utilisée pour un fournisseur, qui ne voit que les siens).
    if (recherche.trim()) params.set("recherche", recherche.trim());

    apiFetch<{ data: ProduitCatalogue[] }>(`/produits?${params.toString()}`, { token })
      .then((pagination) => {
        if (!annule) setProduits(pagination.data);
      })
      .catch(() => {
        if (!annule) setProduits([]);
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [token, filtre, recherche]);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="bg-gradient-espace relative shrink-0 rounded-b-[22px] px-4 pb-24 pt-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Retour"
              className="flex h-[31px] w-8 shrink-0 items-center justify-center rounded-[7px]"
              style={{ background: "rgba(255, 255, 255, 0.23)" }}
            >
              <ChevronLeftIcon className="h-[19px] w-[19px]" />
            </button>
            <div>
              <p className="text-base font-extrabold leading-none">Mes produits</p>
              <p className="mt-1 text-xs text-white/80">Ordi&apos;Space</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRechercheOuverte((v) => !v)}
            aria-label="Rechercher un produit"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20"
          >
            <SearchIcon className="h-4 w-4" />
          </button>
        </div>

        {rechercheOuverte ? (
          <input
            autoFocus
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un produit…"
            className="mt-3 w-full rounded-full bg-white/20 px-4 py-2 text-sm text-white outline-none placeholder:text-white/70"
          />
        ) : null}
      </div>

      <div className="relative rounded-[21px] bg-white px-3 pb-3" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
        <div className="relative" style={{ height: "55px" }}>
          <div className="absolute inset-x-0 grid grid-cols-3 justify-items-center gap-3" style={{ transform: "translateY(-60px)" }}>
            <CarteStatistiqueCatalogue variante="total" valeur={stats?.total ?? 0} label="Total Produit" />
            <CarteStatistiqueCatalogue variante="booster" valeur={stats?.boostes ?? 0} label="Booster Ordi Space" />
            <CarteStatistiqueCatalogue variante="indisponible" valeur={stats?.indisponibles ?? 0} label="Plus disponible" />
          </div>
        </div>

        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {ONGLETS.map((onglet) => (
            <button
              key={onglet.valeur}
              type="button"
              onClick={() => setFiltre(onglet.valeur)}
              className={`h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${
                filtre === onglet.valeur ? "bg-gradient-espace text-white" : "bg-[#F5F7FA] text-brand-ink"
              }`}
            >
              {onglet.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex-1 px-4 py-4">
        <div className="grid grid-cols-2 gap-3 pb-6">
          {chargement ? (
            <p className="col-span-2 py-10 text-center text-sm text-brand-muted">Chargement…</p>
          ) : produits.length === 0 ? (
            <p className="col-span-2 py-10 text-center text-sm text-brand-muted">Aucun produit pour ce filtre.</p>
          ) : (
            produits.map((produit) => <CarteProduitCatalogue key={produit.id} produit={produit} />)
          )}
        </div>

        <button
          type="button"
          onClick={() => router.push("/produits/nouveau")}
          aria-label="Ajouter un produit"
          className="bg-gradient-espace fixed bottom-20 right-4 flex h-[50px] w-[50px] items-center justify-center rounded-full border-[3px] border-white text-2xl font-light text-white"
          style={{ boxShadow: "0px 12px 12px 12px rgba(29, 99, 224, 0.08)" }}
        >
          +
        </button>
      </div>
    </div>
  );
}
