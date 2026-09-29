"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ChevronLeftIcon, MonitorIcon } from "@/components/icons";
import { CarteStatistique } from "@/components/space/CarteStatistique";
import { SelecteurPeriode } from "@/components/space/SelecteurPeriode";
import { FeuilleModifierMontant } from "@/components/operations/FeuilleModifierMontant";
import {
  formaterMontant,
  type AchatExterneCentrePaiement,
  type PaiementItem,
  type PaiementsFournisseur,
  type PeriodeEspace,
} from "@/lib/types";

function formaterDateHeure(iso: string): { label: string; heure: string } {
  const date = new Date(iso.replace(" ", "T"));
  const heure = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const jour = new Date(date);
  jour.setHours(0, 0, 0, 0);
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const diffJours = Math.round((aujourdhui.getTime() - jour.getTime()) / 86_400_000);

  if (diffJours === 0) return { label: "Aujourd'hui", heure };
  if (diffJours === 1) return { label: "Hier", heure };
  return { label: date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }), heure };
}

const ONGLETS = [
  { valeur: "tous", label: "Tous" },
  { valeur: "a_payer", label: "À Payer" },
  { valeur: "paye", label: "Payé" },
] as const;

type Onglet = (typeof ONGLETS)[number]["valeur"];

/**
 * Trois états possibles selon `type`/`statut` — même palette que le Centre de
 * paiement d'un produit pour les montants (bg-orange-50/text-orange-500,
 * bg-green-50/text-green-600, voir FeuilleDetailTransactionJour.tsx), badge
 * plein en plus. Reproduit tel quel le texte du mockup, y compris son
 * incohérence : le badge d'un crédit en attente dit "À Payé" (bleu) alors que
 * le libellé à droite dit "À Recevoir" — vraisemblablement le composant badge
 * "À Payer" réutilisé sans changer le texte, mais gardé identique au mockup
 * à la demande explicite du PDG plutôt que "corrigé" en "À Recevoir" partout.
 */
const STYLES_STATUT = {
  a_payer: { badge: "bg-orange-500", badgeTexte: "À Payer", labelTexte: "À Payer", montantClasse: "bg-orange-50 text-orange-500" },
  paye: { badge: "bg-green-600", badgeTexte: "Payé", labelTexte: "Payé", montantClasse: "bg-green-50 text-green-600" },
  a_recevoir: {
    badge: "bg-[color:var(--brand-blue-end)]",
    badgeTexte: "À Payé",
    labelTexte: "À Recevoir",
    montantClasse: "bg-blue-50 text-[color:var(--brand-blue-end)]",
  },
} as const;

function styleDe(item: PaiementItem) {
  if (item.statut === "paye") return STYLES_STATUT.paye;
  return item.type === "achat_externe" ? STYLES_STATUT.a_payer : STYLES_STATUT.a_recevoir;
}

/** Onglet "Tous"/"À Payer"/"Payé" — "À Payer" ne filtre que les achats externes en attente, "Payé" prend les deux sources déjà réglées (voir le badge). */
function correspondAOnglet(item: PaiementItem, onglet: Onglet): boolean {
  if (onglet === "tous") return true;
  if (onglet === "paye") return item.statut === "paye";
  return item.type === "achat_externe" && item.statut === "en_attente";
}

function CartePaiement({ item, onSelectionner }: { item: PaiementItem; onSelectionner: () => void }) {
  const style = styleDe(item);
  const { label, heure } = formaterDateHeure(item.date_heure);

  return (
    <button
      type="button"
      onClick={onSelectionner}
      className="flex items-center gap-3 rounded-2xl bg-white p-3 text-left"
      style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}
    >
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[#F6F8FE]">
        {item.photo ? (
          <Image src={item.photo} alt="" fill className="object-cover" sizes="44px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-muted">
            <MonitorIcon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white ${style.badge}`}>{style.badgeTexte}</span>
        <p className="mt-1 truncate text-xs text-brand-muted">
          {label} à {heure}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[10px] text-brand-muted">{style.labelTexte}</p>
        <p className={`mt-1 rounded-md px-2.5 py-1 text-xs font-extrabold ${style.montantClasse}`}>{formaterMontant(item.montant)}</p>
      </div>
    </button>
  );
}

/**
 * Onglet "Paiement" (bottombar) — GET /fournisseur/moi/paiements. En-tête +
 * carte "Soldes" + 3 cartes stats : même technique de "cartes flottantes" que
 * "Space" (EcranAccueil.tsx)/Centre de paiement d'un produit
 * (EcranCentrePaiement.tsx). Toucher un achat externe rouvre
 * `FeuilleModifierMontant` (Centre de paiement d'un produit, inchangée) et
 * toucher un crédit de portefeuille mène à l'écran détail commande déjà
 * construit (`/commande/{id}`) — rien de nouveau côté écrans de destination.
 * "PAYER TOUT" reste volontairement inerte, comme le "Payer" du Centre de
 * paiement (aucun endpoint de règlement réel n'existe encore).
 */
export function EcranPaiement() {
  const { token } = useAuth();
  const router = useRouter();
  const [periode, setPeriode] = useState<PeriodeEspace>("semaine");
  const [onglet, setOnglet] = useState<Onglet>("tous");
  const [donnees, setDonnees] = useState<PaiementsFournisseur | null>(null);
  const [chargement, setChargement] = useState(true);
  const [achatSelectionne, setAchatSelectionne] = useState<PaiementItem | null>(null);

  function recharger() {
    if (!token) return;
    apiFetch<PaiementsFournisseur>(`/fournisseur/moi/paiements?periode=${periode}`, { token })
      .then(setDonnees)
      .catch(() => setDonnees(null));
  }

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<PaiementsFournisseur>(`/fournisseur/moi/paiements?periode=${periode}`, { token })
      .then((data) => {
        if (!annule) setDonnees(data);
      })
      .catch(() => {
        if (!annule) setDonnees(null);
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [token, periode]);

  function onSelectionner(item: PaiementItem) {
    if (item.type === "achat_externe") {
      setAchatSelectionne(item);
    } else if (item.commande_id) {
      router.push(`/commande/${item.commande_id}`);
    }
  }

  const achatSelectionneComplet: AchatExterneCentrePaiement | null = achatSelectionne
    ? {
        id: achatSelectionne.id,
        date_vente: achatSelectionne.date_vente ?? "",
        montant_vente: achatSelectionne.montant_vente ?? 0,
        commission_due: achatSelectionne.commission_due ?? achatSelectionne.montant,
        statut: achatSelectionne.statut,
        note: achatSelectionne.note ?? null,
        montant_modifie_propose: achatSelectionne.montant_modifie_propose ?? null,
        motif_modification: achatSelectionne.motif_modification ?? null,
        statut_modification: achatSelectionne.statut_modification ?? null,
      }
    : null;

  const itemsFiltres = (donnees?.items ?? []).filter((item) => correspondAOnglet(item, onglet));

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="bg-gradient-espace shrink-0 rounded-b-[30px] px-[26.5px] pt-4 text-white" style={{ height: "191px" }}>
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

          <p className="flex-1 text-base font-extrabold leading-none">Paiement</p>

          <SelecteurPeriode value={periode} onChange={setPeriode} largeurPx={112} hauteurPx={31} />
        </div>

        <div
          className="mt-4 flex items-center justify-between px-4"
          style={{
            width: "349px",
            height: "49px",
            borderRadius: "9px",
            background: "rgba(255, 255, 255, 0.29)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
          }}
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-white/80">Soldes</span>
          <span className="text-base font-extrabold">{donnees ? formaterMontant(donnees.solde) : "—"}</span>
        </div>
      </div>

      {/* Container blanc unique qui porte À LA FOIS les 3 cartes stats
          flottantes ET les onglets de statut juste en dessous — duplique la
          structure de EcranMesProduits.tsx. Cartes réduites (100×90) avec un
          plus grand espacement entre elles, et un léger espace vide (pas de
          "collé") entre le bas du rectangle "Soldes" et le haut des cartes. */}
      <div className="relative rounded-[21px] bg-white px-3 pb-3" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
        <div className="relative" style={{ height: "25px" }}>
          <div className="absolute inset-x-0 flex justify-center gap-4" style={{ transform: "translateY(-67px)" }}>
            <CarteStatistique
              type="montant"
              couleur="orange"
              labelColore
              largeurPx={100}
              hauteurPx={90}
              arrondiPx={18}
              valeur={donnees ? formaterMontant(donnees.total_a_payer) : "—"}
              label="À Payer"
            />
            <CarteStatistique
              type="montant"
              couleur="green"
              labelColore
              largeurPx={100}
              hauteurPx={90}
              arrondiPx={18}
              valeur={donnees ? formaterMontant(donnees.total_paye) : "—"}
              label="Payé"
            />
            <CarteStatistique
              type="montant"
              couleur="blue"
              labelColore
              largeurPx={100}
              hauteurPx={90}
              arrondiPx={18}
              valeur={donnees ? formaterMontant(donnees.total_a_recevoir) : "—"}
              label="À recevoir"
            />
          </div>
        </div>

        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {ONGLETS.map((option) => {
            const actif = onglet === option.valeur;
            return (
              <button
                key={option.valeur}
                type="button"
                onClick={() => setOnglet(option.valeur)}
                className={`shrink-0 whitespace-nowrap text-sm font-semibold transition-colors ${actif ? "text-white" : "text-brand-muted"}`}
                style={{
                  width: "108px",
                  height: "31px",
                  borderRadius: "15.5px",
                  ...(actif ? { background: "rgba(0, 119, 255, 1)", border: "2px solid rgba(255, 255, 255, 0.47)" } : {}),
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex flex-col gap-2.5 px-4 pb-4 pt-3">
          {chargement ? (
            <p className="py-6 text-center text-sm text-brand-muted">Chargement…</p>
          ) : itemsFiltres.length === 0 ? (
            <p className="py-6 text-center text-sm text-brand-muted">Aucun paiement pour l&apos;instant.</p>
          ) : (
            itemsFiltres.map((item) => (
              <CartePaiement key={`${item.type}-${item.id}`} item={item} onSelectionner={() => onSelectionner(item)} />
            ))
          )}
        </div>

        {donnees && donnees.total_a_payer > 0 ? (
          <div className="flex justify-center px-4 pb-6 pt-2">
            <button
              type="button"
              className="bg-gradient-espace flex items-center justify-between px-6 text-white"
              style={{
                width: "336px",
                height: "50px",
                borderRadius: "25px",
                border: "3px solid rgba(255, 255, 255, 0.59)",
                boxShadow: "0px 12px 12px 5px rgba(0, 0, 0, 0.15)",
              }}
            >
              <span className="text-left">
                <span className="block text-[10px] text-white/80">À Payé</span>
                <span className="block text-sm font-extrabold">PAYER TOUT</span>
              </span>
              <span className="text-base font-extrabold">{formaterMontant(donnees.total_a_payer)}</span>
            </button>
          </div>
        ) : null}
      </div>

      {achatSelectionneComplet && token ? (
        <FeuilleModifierMontant
          produitId={achatSelectionne!.produit_id!}
          token={token}
          achat={achatSelectionneComplet}
          photoProduit={achatSelectionne!.photo}
          onFermer={() => setAchatSelectionne(null)}
          onModifie={recharger}
        />
      ) : null}
    </div>
  );
}
