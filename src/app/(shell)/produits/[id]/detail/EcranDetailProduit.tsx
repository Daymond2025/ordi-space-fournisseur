"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ChevronLeftIcon } from "@/components/icons";
import { InfosProduit } from "@/components/produit/InfosProduit";
import { FeuilleMenuProduit } from "@/components/produit/FeuilleMenuProduit";
import type { ProduitConversationHeader } from "@/lib/types";

function formaterDate(iso: string): string {
  const date = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
}

/**
 * "Détail produit" (onglet "Mes produits") — identique à l'écran détail
 * produit du Livreur (Ordi'Space_Livreur_App_mobile/.../EcranDetailProduit.tsx,
 * voir InfosProduit.tsx qui porte tout le contenu, déjà réutilisé par le
 * Centre de paiement), avec en plus une icône menu dans le header ouvrant
 * FeuilleMenuProduit (voir ce fichier pour le détail des actions).
 */
export function EcranDetailProduit({ produitId }: { produitId: number }) {
  const { token } = useAuth();
  const router = useRouter();
  const [produit, setProduit] = useState<ProduitConversationHeader | null>(null);
  const [menuOuvert, setMenuOuvert] = useState(false);
  // Incrémenté après une action du menu (stock) pour forcer InfosProduit à
  // se remonter et refetcher — plus simple qu'exposer un refresh() externe
  // depuis un composant qui gère déjà son propre fetch en interne.
  const [cleRafraichissement, setCleRafraichissement] = useState(0);

  function chargerProduit() {
    if (!token) return;
    apiFetch<ProduitConversationHeader>(`/produits/${produitId}`, { token })
      .then(setProduit)
      .catch(() => {});
  }

  useEffect(() => {
    chargerProduit();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargerProduit lit token/produitId via clôture, pas besoin de la lister
  }, [token, produitId]);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="bg-gradient-espace flex h-[80px] shrink-0 items-center px-4 text-white">
        <div className="flex w-full items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Retour"
            className="flex h-[31px] w-8 shrink-0 items-center justify-center rounded-[7px]"
            style={{ background: "rgba(255, 255, 255, 0.23)" }}
          >
            <ChevronLeftIcon className="h-[19px] w-[19px]" />
          </button>
          <div className="flex-1">
            <p className="text-base font-extrabold leading-none">Détail produit</p>
            {produit ? <p className="mt-1 text-xs text-white/80">Enregistré le {formaterDate(produit.date_ajout)}</p> : null}
          </div>
          <button type="button" onClick={() => setMenuOuvert(true)} aria-label="Menu" className="flex h-8 w-8 shrink-0 items-center justify-center">
            <Image src="/images/menu.png" alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
          </button>
        </div>
      </div>

      <InfosProduit key={cleRafraichissement} produitId={produitId} />

      {menuOuvert && token && produit ? (
        <FeuilleMenuProduit
          produitId={produitId}
          quantiteActuelle={produit.quantite_stock}
          statutProduit={produit.statut_produit}
          token={token}
          onFermer={() => setMenuOuvert(false)}
          onApplique={() => {
            chargerProduit();
            setCleRafraichissement((c) => c + 1);
          }}
          onSupprime={() => router.replace("/produits")}
        />
      ) : null}
    </div>
  );
}
