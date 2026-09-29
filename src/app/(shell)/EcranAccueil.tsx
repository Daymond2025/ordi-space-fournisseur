"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { CarteStatistique } from "@/components/space/CarteStatistique";
import { SelecteurPeriode } from "@/components/space/SelecteurPeriode";
import { CarteProduitActif } from "@/components/space/CarteProduitActif";
import { UserIcon } from "@/components/icons";
import type {
  CompteursCommandesFournisseur,
  Pagination,
  PeriodeEspace,
  ProduitActif,
  ProfilFournisseur,
} from "@/lib/types";
import { formaterMontant } from "@/lib/types";

type ReponseCommandesFournisseur = {
  commandes: Pagination<unknown>;
  compteurs: CompteursCommandesFournisseur;
};

type ReponsePortefeuilleFournisseur = {
  solde: number;
  taux_commission: number;
  total_en_attente: number;
};

/**
 * "Space" — écran d'accueil de l'app Fournisseur (premier mockup reçu).
 * Combine profil (GET /moi/profil), compteurs de commandes en attente/en
 * cours (GET /fournisseur/moi/commandes, compteurs déjà calculés côté
 * backend), solde à payer (GET /fournisseur/moi/portefeuille) et la liste des
 * produits à activité récente (GET /produits/activite-recente, déjà scopée
 * fournisseur) — endpoints tous déjà en place, aucun ajout backend nécessaire
 * pour cet écran.
 */
export function EcranAccueil() {
  const { token } = useAuth();
  const [periode, setPeriode] = useState<PeriodeEspace>("tout");
  const [profil, setProfil] = useState<ProfilFournisseur | null>(null);
  const [compteurs, setCompteurs] = useState<CompteursCommandesFournisseur | null>(null);
  const [totalEnAttente, setTotalEnAttente] = useState<number | null>(null);
  const [produits, setProduits] = useState<ProduitActif[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!token) return;
    let annule = false;

    Promise.all([
      apiFetch<ProfilFournisseur>("/moi/profil", { token }),
      apiFetch<ReponseCommandesFournisseur>("/fournisseur/moi/commandes?per_page=1", { token }),
      apiFetch<ReponsePortefeuilleFournisseur>("/fournisseur/moi/portefeuille", { token }),
      apiFetch<ProduitActif[]>("/produits/activite-recente", { token }),
    ])
      .then(([profilData, commandesData, portefeuilleData, produitsActifs]) => {
        if (annule) return;
        setProfil(profilData);
        setCompteurs(commandesData.compteurs);
        setTotalEnAttente(portefeuilleData.total_en_attente);
        setProduits(produitsActifs);
      })
      .catch(() => {
        if (!annule) {
          setProfil(null);
          setCompteurs(null);
          setTotalEnAttente(null);
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

  const nomComplet = profil ? `${profil.prenom ?? ""} ${profil.nom}`.trim().toUpperCase() : "";

  return (
    <div>
      <div className="bg-gradient-espace relative rounded-b-[22px] px-4 pb-14 pt-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/profil"
              aria-label="Voir mon profil"
              className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border-2 border-white/50 bg-white/20"
            >
              {profil?.photo ? (
                <Image src={profil.photo} alt="" fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
              )}
            </Link>
            <div>
              <p className="text-sm">Bonjour, 👋</p>
              <p className="text-lg font-extrabold leading-tight">{chargement ? "…" : nomComplet || "—"}</p>
            </div>
          </div>

          <SelecteurPeriode value={periode} onChange={setPeriode} />
        </div>
      </div>

      {/* Container blanc qui englobe les 3 cartes stats — même technique que
          Cordinateur_App_Web/EcranSpace.tsx : le rectangle reste à sa position
          naturelle juste après le header, seules les cartes remontent dessus
          (translateY négatif), ce qui laisse le bord arrondi du container
          visible sous elles, exactement comme le mockup. */}
      <div className="relative rounded-[21px] bg-white px-3 pb-3" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
        <div className="relative" style={{ height: "44px" }}>
          <div className="absolute inset-x-0 flex gap-3" style={{ transform: "translateY(-52px)" }}>
            <CarteStatistique
              type="compte"
              couleur="pink"
              valeur={compteurs ? compteurs.nouvelle : 0}
              label="Nouvelle commande"
              indicateurNouveau={!!compteurs && compteurs.nouvelle > 0}
              href="/commandes"
            />
            <CarteStatistique
              type="compte"
              couleur="blue"
              valeur={compteurs ? compteurs.en_cours : 0}
              label="Commandes en cours"
              href="/commandes"
            />
            <CarteStatistique
              type="montant"
              couleur="orange"
              valeur={formaterMontant(totalEnAttente ?? 0)}
              label="Commission totale à payer"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-4 pb-6 pt-4">
        {chargement ? (
          <p className="py-6 text-center text-sm text-brand-muted">Chargement…</p>
        ) : produits.length === 0 ? (
          <p className="py-6 text-center text-sm text-brand-muted">Aucune activité récente pour l&apos;instant.</p>
        ) : (
          produits.map((produit) => <CarteProduitActif key={produit.produit_id} produit={produit} />)
        )}
      </div>
    </div>
  );
}
