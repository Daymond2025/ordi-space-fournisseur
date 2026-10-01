"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { CarteProduitActif } from "@/components/space/CarteProduitActif";
import { CarteCommandeFournisseur } from "@/components/operations/CarteCommandeFournisseur";
import { ChevronLeftIcon } from "@/components/icons";
import { BUCKETS_COMMANDE, type BucketCommande } from "@/lib/statuts";
import type { CommandeCarte, ProduitActif, StatistiquesFournisseurMoi } from "@/lib/types";

type ReponseFournisseurMoi = { statistiques: StatistiquesFournisseurMoi };

type ReponseCommandesFournisseur = {
  commandes: { data: CommandeCarte[] };
  compteurs: Record<BucketCommande, number>;
};

/**
 * "Centre des commandes" — atteint depuis les cartes "Nouvelle commande"/
 * "Commandes en cours" de l'écran Space. Version self-service de
 * Cordinateur_App_Web/src/app/fournisseur/[id]/EcranDetailFournisseur.tsx
 * (même écran d'origine, mêmes composants/onglets), rejouée sur le
 * fournisseur du jeton courant plutôt que sur un {id} d'URL — endpoints déjà
 * en place (/fournisseur/moi, /produits/activite-recente,
 * /fournisseur/moi/commandes), aucun ajout backend nécessaire.
 */
export function EcranCommandes() {
  const { token } = useAuth();
  const router = useRouter();

  const [statistiques, setStatistiques] = useState<StatistiquesFournisseurMoi | null>(null);
  const [produits, setProduits] = useState<ProduitActif[]>([]);
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState<"chat" | "commandes">("chat");

  const [bucketActif, setBucketActif] = useState<BucketCommande>("nouvelle");
  const [commandes, setCommandes] = useState<CommandeCarte[]>([]);
  const [compteurs, setCompteurs] = useState<Record<BucketCommande, number> | null>(null);
  const [chargementCommandes, setChargementCommandes] = useState(true);

  useEffect(() => {
    if (!token) return;
    let annule = false;

    Promise.all([
      apiFetch<ReponseFournisseurMoi>("/fournisseur/moi", { token }),
      apiFetch<ProduitActif[]>("/produits/activite-recente", { token }),
    ])
      .then(([moi, produitsActifs]) => {
        if (annule) return;
        setStatistiques(moi.statistiques);
        setProduits(produitsActifs);
      })
      .catch(() => {
        if (!annule) {
          setStatistiques(null);
          setProduits([]);
        }
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token || onglet !== "commandes") return;
    let annule = false;

    // Pas de setChargementCommandes(true) ici : le state initial est déjà
    // `true` pour le premier chargement, et on évite le clignotement
    // "Chargement…" lors d'un simple changement de bucket (les anciennes
    // cartes restent affichées jusqu'à l'arrivée des nouvelles).
    const statuts = BUCKETS_COMMANDE.find((b) => b.id === bucketActif)?.statuts.join(",") ?? "";

    apiFetch<ReponseCommandesFournisseur>(`/fournisseur/moi/commandes?statut=${statuts}`, { token })
      .then((reponse) => {
        if (annule) return;
        setCommandes(reponse.commandes.data);
        setCompteurs(reponse.compteurs);
      })
      .catch(() => {
        if (!annule) setCommandes([]);
      })
      .finally(() => {
        if (!annule) setChargementCommandes(false);
      });

    return () => {
      annule = true;
    };
  }, [token, onglet, bucketActif]);

  return (
    <div>
      <div className="bg-gradient-espace relative rounded-b-[22px] px-4 pb-5 pt-6 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Retour"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-base font-extrabold uppercase tracking-wide">Centre des commandes</p>
              <p className="mt-0.5 truncate text-xs text-white/80">
                {statistiques ? `${statistiques.produits_total} Produits · ${statistiques.commandes_recues} Commandes` : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/statistiques")}
            aria-label="Statistiques"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20"
          >
            <Image src="/images/Icon-stats.png" alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
          </button>
        </div>
      </div>

      <div className="mx-4 mt-3 flex items-center gap-1 rounded-full bg-white p-1" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
        <button
          type="button"
          onClick={() => setOnglet("chat")}
          className={`flex-1 rounded-full py-2 text-center text-sm font-bold transition-colors ${
            onglet === "chat" ? "bg-gradient-espace text-white" : "text-brand-muted"
          }`}
        >
          Chat & commandes
        </button>
        <button
          type="button"
          onClick={() => setOnglet("commandes")}
          className={`flex-1 rounded-full py-2 text-center text-sm font-bold transition-colors ${
            onglet === "commandes" ? "bg-gradient-espace text-white" : "text-brand-muted"
          }`}
        >
          Commandes uniquement
        </button>
      </div>

      {onglet === "chat" ? (
        <div className="flex flex-col gap-2.5 px-4 pb-6 pt-4">
          {chargement ? (
            <p className="py-6 text-center text-sm text-brand-muted">Chargement…</p>
          ) : produits.length === 0 ? (
            <p className="py-6 text-center text-sm text-brand-muted">Aucune activité pour l&apos;instant.</p>
          ) : (
            produits.map((produit) => <CarteProduitActif key={produit.produit_id} produit={produit} />)
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto px-4 pb-1 pt-3">
            {BUCKETS_COMMANDE.map((bucket) => (
              <button
                key={bucket.id}
                type="button"
                onClick={() => setBucketActif(bucket.id)}
                className={`h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${
                  bucketActif === bucket.id ? "bg-gradient-espace text-white" : "bg-[#F5F7FA] text-brand-ink"
                }`}
              >
                {compteurs?.[bucket.id] ?? 0} {bucket.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 px-4 pb-6 pt-3">
            {chargementCommandes ? (
              <p className="py-6 text-center text-sm text-brand-muted">Chargement…</p>
            ) : commandes.length === 0 ? (
              <p className="py-6 text-center text-sm text-brand-muted">Aucune commande dans cette catégorie.</p>
            ) : (
              commandes.map((carte) => <CarteCommandeFournisseur key={carte.commande_id} carte={carte} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}
