"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  CarteGraphiqueIcon,
  ChevronRightIcon,
  DisqueIcon,
  EcranIcon,
  EngrenageIcon,
  FenetresIcon,
  ImageIcon,
  MemoireIcon,
  ProcesseurIcon,
  TruckIcon,
} from "@/components/icons";
import { VisionneuseImages } from "./VisionneuseImages";
import { LIBELLE_ETAT_PRODUIT, formaterPrix, resumerSpecs, type ProduitDetailComplet } from "@/lib/produitDetail";

const ONGLETS = [
  { id: "cadeaux", label: "Les cadeaux" },
  { id: "description", label: "Description" },
  { id: "pack", label: "Pack complet" },
] as const;

const STATUTS_NON_VALIDE: Record<string, { label: string; classe: string }> = {
  en_attente: { label: "En attente de validation du Coordinateur", classe: "bg-blue-50 text-[color:var(--brand-blue-end)]" },
  corrige: { label: "En attente de validation du Coordinateur", classe: "bg-blue-50 text-[color:var(--brand-blue-end)]" },
  rejete: { label: "Rejeté par le Coordinateur", classe: "bg-rose-50 text-rose-600" },
};

type IconeSpec = ComponentType<SVGProps<SVGSVGElement>>;

const OMBRE_CARTE = "0px 1px 2px 0px rgba(0, 0, 0, 0.05)";

/**
 * Contenu de l'onglet "Infos produit" (Centre de paiement des commissions) —
 * réutilise la même fiche produit que Ordi'Space_Livreur_App_mobile/src/app/
 * boutique/produits/[id]/EcranDetailProduit.tsx (demande explicite du PDG :
 * "utiliser le même écran detail de produit que nous avons implémenté pour
 * le livreur"). Branché sur le même GET /produits/{id} (public).
 *
 * Volontairement OMIS par rapport à l'écran Livreur, car ce sont des actions
 * de revente qui n'ont pas de sens pour le fournisseur consultant SA propre
 * fiche (et échoueraient : ce sont des permissions livreur) : l'en-tête
 * retour/partage (déjà géré par l'écran Centre de paiement), "Je passe la
 * commande", le lien affilié, la carte "Fournisseur" (contact — le
 * fournisseur n'a pas besoin de se contacter lui-même). Le bloc "Commission"
 * ci-dessous reste affiché : c'est `commission_revente` (ce qu'un LIVREUR
 * toucherait en revendant ce produit sur sa Boutique) — un montant différent
 * et sans lien avec la commission que LE FOURNISSEUR doit sur ses achats
 * externes (voir le reste de cet écran, `centre-paiement`).
 */
export function InfosProduit({ produitId }: { produitId: number }) {
  const { token } = useAuth();
  const router = useRouter();
  const [produit, setProduit] = useState<ProduitDetailComplet | null>(null);
  const [imageActive, setImageActive] = useState(0);
  const [ongletActif, setOngletActif] = useState<(typeof ONGLETS)[number]["id"]>("cadeaux");
  const [visionneuseOuverte, setVisionneuseOuverte] = useState(false);

  useEffect(() => {
    let annule = false;
    apiFetch<ProduitDetailComplet>(`/produits/${produitId}`, { token: token ?? undefined })
      .then((data) => {
        if (!annule) setProduit(data);
      })
      .catch(() => {
        if (!annule) setProduit(null);
      });
    return () => {
      annule = true;
    };
  }, [produitId, token]);

  if (!produit) {
    return <p className="py-10 text-center text-sm text-brand-muted">Chargement du produit…</p>;
  }

  const specs = resumerSpecs(produit);
  const specsDetail = (
    [
      { label: "Processeur", valeur: produit.processeur, Icone: ProcesseurIcon },
      { label: "Disque dur", valeur: produit.stockage, Icone: DisqueIcon },
      { label: "Ram", valeur: produit.memoire_ram, Icone: MemoireIcon },
      { label: "Carte graphique", valeur: produit.carte_graphique, Icone: CarteGraphiqueIcon },
      { label: "Taille d'écran", valeur: produit.taille, Icone: EcranIcon },
      { label: "Système installé", valeur: produit.systeme_exploitation, Icone: FenetresIcon },
    ] as { label: string; valeur: string | null; Icone: IconeSpec }[]
  ).filter((s): s is { label: string; valeur: string; Icone: IconeSpec } => Boolean(s.valeur));

  const imagesCadeaux = produit.images_cadeaux ?? {};
  // Composé à l'affichage (cadeaux ∪ contenu_pack) plutôt que de ne lire que
  // `contenu_pack` : couvre aussi les produits existants dont le pack n'a
  // jamais été fusionné avec les cadeaux côté backend (créés/modifiés avant
  // ce comportement, ou retouchés séparément par le Coordinateur).
  const packComplet = Array.from(new Set([...(produit.cadeaux ?? []), ...(produit.contenu_pack ?? [])]));

  const fraisLivraisonMin =
    produit.frais_livraison.length > 0 ? Math.min(...produit.frais_livraison.map((f) => Number(f.montant))) : null;

  const statut = STATUTS_NON_VALIDE[produit.statut_produit];

  return (
    <div className="flex flex-col pb-6">
      {statut ? (
        <div className="px-2.5 pt-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${statut.classe}`}>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            {statut.label}
          </span>
          {produit.statut_produit === "rejete" && produit.motif_rejet ? (
            <div className="mt-2 rounded-2xl border border-rose-200 bg-rose-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600">Motif du rejet</p>
              <p className="mt-1 text-sm text-rose-700">{produit.motif_rejet}</p>
            </div>
          ) : null}

        </div>
      ) : null}

      <div className="relative h-[320px] w-full shrink-0 bg-[#f2f5fa]">
        {produit.images[imageActive] ? (
          <button
            type="button"
            onClick={() => setVisionneuseOuverte(true)}
            aria-label="Voir la photo en grand"
            className="block h-full w-full cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- domaine backend dynamique, pas de config next/image nécessaire ici */}
            <img src={produit.images[imageActive].url_image} alt="" className="h-full w-full object-cover" />
          </button>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-muted">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}
        {produit.etat_produit ? (
          <span
            className="absolute left-[13px] top-[15px] flex h-[22px] items-center rounded-lg px-2 text-xs font-bold leading-[14px] text-white"
            style={{ background: "linear-gradient(273.52deg, #FFCC00 -3.09%, #FF7800 98.47%)", boxShadow: OMBRE_CARTE }}
          >
            {LIBELLE_ETAT_PRODUIT[produit.etat_produit]}
          </span>
        ) : null}
        {produit.pourcentage_reduction ? (
          <span
            className="absolute right-3 top-[15px] flex h-[22px] items-center rounded px-2 text-xs font-bold leading-[14px] text-white"
            style={{ background: "linear-gradient(115.13deg, #FF9700 0%, #FFB800 100%)" }}
          >
            -{produit.pourcentage_reduction}%
          </span>
        ) : null}
      </div>

      {produit.images.length > 1 ? (
        <div className="flex shrink-0 gap-2 overflow-x-auto px-1 pb-[25px] pt-[9px]">
          {produit.images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setImageActive(index)}
              className="h-[87px] w-[112px] shrink-0 overflow-hidden rounded-[5px] border-2 bg-white"
              style={{ borderColor: index === imageActive ? "rgba(38, 128, 235, 1)" : "transparent" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- domaine backend dynamique, pas de config next/image nécessaire ici */}
              <img src={image.url_image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <div className="h-[25px] shrink-0" />
      )}

      <div className="mx-2.5 flex shrink-0 flex-col gap-1 rounded-xl bg-white p-4" style={{ boxShadow: OMBRE_CARTE }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-black px-2 py-1 text-[10px] font-extrabold text-white">
            {produit.nom_produit.split(" ")[0].toUpperCase()}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {produit.quantite_stock} pièces disponible
          </span>
          <span className="rounded-full bg-[#F2F5FA] px-2 py-0.5 text-[10px] font-semibold text-brand-muted">
            {produit.quantite_stock > 0 ? "En stock" : "Rupture"}
          </span>
        </div>

        <p className="text-xl font-extrabold text-brand-ink">{produit.nom_produit}</p>
        {specs.length > 0 ? <p className="text-xs text-brand-muted">{specs.join(" • ")}</p> : null}

        <div
          className="mt-2 flex min-h-[58px] flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg px-3 py-2"
          style={{ background: "rgba(242, 243, 255, 0.6)" }}
        >
          <div className="shrink-0">
            {/* Avant publication, prix_vente (prix public, fixé par le
                Coordinateur) est encore absent — plutôt que de n'afficher aucun
                chiffre, on retombe sur `prix` (le prix partenaire que LE
                FOURNISSEUR a lui-même saisi, toujours disponible). */}
            <p className="whitespace-nowrap text-[10px] text-brand-muted">
              {produit.prix_vente ? "Prix de vente" : "Mon prix partenaire (prix public à venir)"}
            </p>
            <div className="mt-0.5 flex items-baseline gap-2 whitespace-nowrap">
              <p className="text-[17px] font-extrabold text-orange-600">{formaterPrix(produit.prix_vente ?? produit.prix)} FCFA</p>
              {produit.prix_barre ? (
                <p className="text-[11px] text-brand-muted line-through">{formaterPrix(produit.prix_barre)}&nbsp;FCFA</p>
              ) : null}
            </div>
          </div>
          {produit.prix_barre && produit.prix_vente ? (
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-600">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> Économie&nbsp;
              {formaterPrix(Number(produit.prix_barre) - Number(produit.prix_vente))}&nbsp;F
            </span>
          ) : null}
        </div>

        {/* Le fournisseur ne peut jamais démarrer une négociation (réservé
            Coordinateur/Admin, voir MessageController::demarrerNegociationPrix())
            — juste consulter/répondre si le Coordinateur en a ouvert une. Placé
            juste sous la carte "Prix de vente" (retour de test réel), au lieu
            d'en haut de l'écran. Pastille rouge si un message de négociation du
            Coordinateur n'a pas encore été consulté (Produit::negociationALirePar()). */}
        {statut ? (
          <button
            type="button"
            onClick={() => router.push(`/produits/${produit.id}/negociation-prix`)}
            className="relative mt-1.5 flex w-full items-center justify-between rounded-md px-3 py-2"
            style={{ background: "rgba(242, 243, 255, 0.6)" }}
          >
            <span className="flex items-center gap-2 text-sm font-bold text-brand-ink">
              Négociation de prix
              {produit.negociation_a_lire ? (
                <span aria-label="Nouveau message" className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
              ) : null}
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-brand-muted" />
          </button>
        ) : null}

        {/* Informatif uniquement — jamais éditable par le fournisseur (prix_vente
            est verrouillé côté requête, voir StoreProduitRequest::rules()). Masqué
            tant que le produit n'est pas encore publié (prix_vente absent, donc
            marge pas encore définie par le Coordinateur). */}
        {produit.commission_ordispace !== null ? (
          <div
            className="relative mt-1.5 flex min-h-[51px] items-center justify-between rounded-md py-2 pl-5 pr-4"
            style={{ background: "rgba(29, 99, 224, 0.08)" }}
          >
            <span aria-hidden="true" className="absolute left-[5px] top-1 h-[42px] w-1 rounded-md" style={{ background: "var(--brand-blue-end)" }} />
            <span className="whitespace-nowrap text-lg font-light text-[color:var(--brand-blue-end)]">Commission Ordi&apos;Space</span>
            <span className="whitespace-nowrap text-lg font-extrabold text-[color:var(--brand-blue-end)]">
              {formaterPrix(produit.commission_ordispace)} FCFA
            </span>
          </div>
        ) : null}
      </div>

      <div className="mx-[11px] mt-3.5 shrink-0 rounded-[13px] bg-white p-4" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
        {specsDetail.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {specsDetail.map((spec) => (
              <div key={spec.label} className="flex items-center gap-1.5 rounded-xl bg-[#F7F8FF] px-2 py-2.5">
                <spec.Icone className="h-5 w-5 shrink-0 text-orange-500" />
                <div className="min-w-0">
                  <p className="truncate text-[9px] text-brand-muted">{spec.label}</p>
                  <p className="text-[10px] font-extrabold leading-tight text-brand-ink">{spec.valeur}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex gap-1 rounded-full bg-white p-1" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
          {ONGLETS.map((onglet) => (
            <button
              key={onglet.id}
              type="button"
              onClick={() => setOngletActif(onglet.id)}
              className={`flex-1 rounded-full py-2 text-[11px] font-extrabold transition-colors ${
                ongletActif === onglet.id ? "text-white shadow-[0px_3px_8px_0px_rgba(249,115,22,0.4)]" : "text-brand-muted"
              }`}
              style={ongletActif === onglet.id ? { background: "linear-gradient(90deg, #FBBF24 0%, #F97316 100%)" } : undefined}
            >
              {onglet.label}
            </button>
          ))}
        </div>

        <div className="mt-3 min-h-[305px] rounded-[13px] p-4 text-xs text-brand-muted" style={{ background: "rgba(247, 248, 255, 1)" }}>
          {ongletActif === "cadeaux" ? (
            produit.cadeaux && produit.cadeaux.length > 0 ? (
              <div className="flex flex-col gap-2">
                {produit.cadeaux.map((nom) => (
                  <div key={nom} className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F2F3FF]">
                      {imagesCadeaux[nom] ? (
                        // eslint-disable-next-line @next/next/no-img-element -- domaine backend dynamique, pas de config next/image nécessaire ici
                        <img src={imagesCadeaux[nom] as string} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-brand-muted" />
                      )}
                    </span>
                    <span className="text-sm font-semibold text-brand-ink">{nom}</span>
                  </div>
                ))}
              </div>
            ) : (
              "Aucun cadeau pour ce produit."
            )
          ) : ongletActif === "description" ? (
            produit.description ? (
              <p className="font-bold text-brand-ink">{produit.description}</p>
            ) : (
              "Aucune description."
            )
          ) : packComplet.length > 0 ? (
            <ul className="list-disc space-y-1 pl-4">
              {packComplet.map((item) => (
                <li key={item} className="text-brand-ink">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            "Pack non renseigné."
          )}
        </div>
      </div>

      {fraisLivraisonMin !== null || produit.duree_garantie_mois ? (
        <div className="mx-[11px] mt-3.5 flex shrink-0 flex-col gap-3 rounded-xl bg-white p-4" style={{ boxShadow: OMBRE_CARTE }}>
          {fraisLivraisonMin !== null ? (
            <div className="flex min-h-[44px] items-center gap-3">
              <TruckIcon viewBox="1 6 22 16" className="h-[14.67px] w-[20.17px] shrink-0" style={{ color: "rgba(255, 119, 0, 1)" }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-brand-ink">Livraison</p>
                <p className="mt-0.5 text-xs text-brand-muted">À partir de {formaterPrix(fraisLivraisonMin)}&nbsp;FCFA — selon la localité</p>
              </div>
            </div>
          ) : null}
          {produit.duree_garantie_mois ? (
            <div
              className="flex min-h-[56px] items-center gap-3 rounded-xl px-4 py-1.5"
              style={{ background: "linear-gradient(274.19deg, #23E755 3.13%, #008421 98.13%)" }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: "rgba(255, 255, 255, 0.54)" }}
              >
                <EngrenageIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 text-white">
                <p className="text-sm font-extrabold">Garantie</p>
                <p className="text-xs">{produit.duree_garantie_mois} mois</p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {visionneuseOuverte ? (
        <VisionneuseImages
          images={produit.images.map((image) => image.url_image)}
          indexInitial={imageActive}
          onFermer={() => setVisionneuseOuverte(false)}
        />
      ) : null}
    </div>
  );
}
