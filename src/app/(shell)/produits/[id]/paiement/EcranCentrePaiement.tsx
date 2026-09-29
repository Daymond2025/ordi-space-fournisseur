"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ChevronLeftIcon, ArrowDownLeftIcon, ArrowUpRightIcon, MonitorIcon } from "@/components/icons";
import { CarteStatistique } from "@/components/space/CarteStatistique";
import { SelecteurPeriode } from "@/components/space/SelecteurPeriode";
import { FeuilleAchatExterne } from "@/components/operations/FeuilleAchatExterne";
import { FeuilleDetailTransactionJour } from "@/components/operations/FeuilleDetailTransactionJour";
import { FeuilleModifierMontant } from "@/components/operations/FeuilleModifierMontant";
import { InfosProduit } from "@/components/produit/InfosProduit";
import {
  formaterMontant,
  type AchatExterneCentrePaiement,
  type CentrePaiementProduit,
  type PeriodeEspace,
  type ProduitConversationHeader,
  type TransactionJourCentrePaiement,
} from "@/lib/types";

function formaterDateCreation(iso: string): string {
  const date = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** "Aujourd'hui" / "Hier" / nom du jour (7 derniers jours) / date complète — jamais de regroupement par semaine pour l'instant (voir ProduitController::centrePaiement()). */
function formaterLabelJour(dateStr: string): { label: string; date: string } {
  const jour = new Date(`${dateStr}T00:00:00`);
  const dateFormatee = jour.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase().replace(/ /g, " - ");

  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const diffJours = Math.round((aujourdhui.getTime() - jour.getTime()) / 86_400_000);

  if (diffJours === 0) return { label: "Aujourd'hui", date: dateFormatee };
  if (diffJours === 1) return { label: "Hier", date: dateFormatee };
  if (diffJours > 1 && diffJours < 7) {
    return { label: jour.toLocaleDateString("fr-FR", { weekday: "long" }).replace(/^./, (c) => c.toUpperCase()), date: dateFormatee };
  }
  return { label: dateFormatee, date: dateFormatee };
}

/**
 * "Centre de paiement des commissions" d'un produit — atteint depuis l'icône
 * "Paiement" de la discussion produit (même icône que l'onglet "Paiement" de
 * la nav du bas, fonctionnalité différente : ici scopée à CE produit). Voir
 * ProduitController::centrePaiement().
 */
export function EcranCentrePaiement({ produitId }: { produitId: number }) {
  const { token } = useAuth();
  const router = useRouter();

  const [produit, setProduit] = useState<ProduitConversationHeader | null>(null);
  const [donnees, setDonnees] = useState<CentrePaiementProduit | null>(null);
  const [periode, setPeriode] = useState<PeriodeEspace>("semaine");
  const [onglet, setOnglet] = useState<"transaction" | "infos">("transaction");
  const [chargement, setChargement] = useState(true);
  const [feuilleAchatOuverte, setFeuilleAchatOuverte] = useState(false);
  const [jourSelectionne, setJourSelectionne] = useState<TransactionJourCentrePaiement | null>(null);
  const [achatSelectionne, setAchatSelectionne] = useState<AchatExterneCentrePaiement | null>(null);

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<ProduitConversationHeader>(`/produits/${produitId}`, { token })
      .then((data) => {
        if (!annule) setProduit(data);
      })
      .catch(() => {});

    return () => {
      annule = true;
    };
  }, [token, produitId]);

  function rechargerDonnees() {
    if (!token) return;
    apiFetch<CentrePaiementProduit>(`/produits/${produitId}/centre-paiement?periode=${periode}`, { token })
      .then(setDonnees)
      .catch(() => setDonnees(null))
      .finally(() => setChargement(false));
  }

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<CentrePaiementProduit>(`/produits/${produitId}/centre-paiement?periode=${periode}`, { token })
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
  }, [token, produitId, periode]);

  const photo = produit?.images[0]?.url_image ?? null;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="bg-gradient-espace shrink-0 rounded-b-[22px] px-3 pb-9 pt-4 text-white">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.back()} aria-label="Retour" className="flex h-7 w-7 shrink-0 items-center justify-center">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-white/40 bg-white/20">
            {photo ? (
              <Image src={photo} alt="" fill className="object-cover" sizes="32px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <MonitorIcon className="h-3.5 w-3.5" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold">{produit?.nom_produit ?? `Produit #${produitId}`}</p>
            {produit ? <p className="truncate text-[10px] text-white/75">Date de création : {formaterDateCreation(produit.date_ajout)}</p> : null}
          </div>

          <SelecteurPeriode value={periode} onChange={setPeriode} />
        </div>

        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-2xl bg-white/15 p-3">
            <p className="text-[11px] font-semibold text-white/80">Chiffre d&apos;affaires</p>
            <p className="text-[10px] text-white/60">De ce produit</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-white">
                <ArrowDownLeftIcon className="h-3.5 w-3.5" />
              </span>
              <span className="text-base font-extrabold">{donnees ? formaterMontant(donnees.chiffre_affaires) : "—"}</span>
            </div>
          </div>
          <div className="flex-1 rounded-2xl bg-white/15 p-3">
            <p className="text-[11px] font-semibold text-white/80">Total a payer</p>
            <p className="text-[10px] text-white/60">Ordi&apos;space</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-400 text-white">
                <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </span>
              <span className="text-base font-extrabold">{donnees ? formaterMontant(donnees.total_a_payer) : "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Container blanc qui englobe les 3 pastilles de statut — même
          technique que l'écran Space (EcranAccueil.tsx) : le rectangle reste
          à sa position naturelle juste après le header, seules les cartes
          remontent dessus (translateY négatif), assez pour toucher le bas
          des cartes "Chiffre d'affaires"/"Total a payer" au-dessus. */}
      <div className="relative rounded-[21px] bg-white px-3 pb-4" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
        <div className="relative" style={{ height: "72px" }}>
          <div className="absolute inset-x-0 flex gap-3" style={{ transform: "translateY(-26px)" }}>
            <CarteStatistique
              type="compte"
              couleur="pink"
              valeur={donnees ? donnees.compteurs.nouvelle : 0}
              label="Nouvelle commande"
              indicateurNouveau={!!donnees && donnees.compteurs.nouvelle > 0}
            />
            <CarteStatistique type="compte" couleur="green" valeur={donnees ? donnees.compteurs.terminees : 0} label="Commandes terminées" />
            <CarteStatistique type="compte" couleur="rose" valeur={donnees ? donnees.compteurs.annulees : 0} label="Commandes Annuler" />
          </div>
        </div>
      </div>

      <div className="mx-4 mt-5 flex items-center gap-1 rounded-full bg-white p-1" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
        <button
          type="button"
          onClick={() => setOnglet("transaction")}
          className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${onglet === "transaction" ? "bg-gradient-espace text-white" : "text-brand-muted"}`}
        >
          Transaction
        </button>
        <button
          type="button"
          onClick={() => setOnglet("infos")}
          className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${onglet === "infos" ? "bg-gradient-espace text-white" : "text-brand-muted"}`}
        >
          Infos produit
        </button>
      </div>

      {onglet === "transaction" ? (
        <div className="flex flex-col gap-2.5 px-4 pb-6 pt-4">
          {chargement ? (
            <p className="py-6 text-center text-sm text-brand-muted">Chargement…</p>
          ) : !donnees || donnees.transactions.length === 0 ? (
            <p className="py-6 text-center text-sm text-brand-muted">Aucune transaction sur cette période.</p>
          ) : (
            donnees.transactions.map((transaction) => {
              const { label, date } = formaterLabelJour(transaction.date);
              return (
                <button
                  type="button"
                  key={`${transaction.date}-${transaction.statut}`}
                  onClick={() => setJourSelectionne(transaction)}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3 text-left"
                  style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}
                >
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[#F6F8FE]">
                    {photo ? (
                      <Image src={photo} alt="" fill className="object-cover" sizes="44px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-brand-muted">
                        <MonitorIcon className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-brand-ink">{label}</p>
                    <p className="truncate text-[11px] text-brand-muted">{date}</p>
                  </div>

                  <div className="shrink-0 text-center">
                    <p className="text-[10px] text-brand-muted">Commande</p>
                    <p className="rounded-md bg-[#F5F7FA] px-2 py-0.5 text-xs font-bold text-brand-ink">
                      {String(transaction.nombre_commandes).padStart(2, "0")}
                    </p>
                  </div>

                  {/* "Versé"/"En attente de versement" décrit le paiement Ordi'Space →
                      fournisseur (voir Fournisseur::payerCreditsEnAttente()), jamais
                      une commission due PAR le fournisseur — à ne pas confondre avec
                      les achats externes ci-dessous. */}
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-brand-muted">{transaction.statut === "paye" ? "Versé" : "En attente"}</p>
                    <p className={`text-xs font-extrabold ${transaction.statut === "paye" ? "text-green-600" : "text-orange-500"}`}>
                      {formaterMontant(transaction.montant)}
                    </p>
                  </div>
                </button>
              );
            })
          )}

          {donnees && donnees.achats_externes.length > 0 ? (
            <>
              <p className="mt-2 px-1 text-xs font-bold text-brand-muted">Achats externes déclarés</p>
              {donnees.achats_externes.map((achat) => (
                <button
                  type="button"
                  key={achat.id}
                  onClick={() => setAchatSelectionne(achat)}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3 text-left"
                  style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}
                >
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[#F6F8FE]">
                    {photo ? (
                      <Image src={photo} alt="" fill className="object-cover" sizes="44px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-brand-muted">
                        <MonitorIcon className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-brand-ink">{formaterMontant(achat.montant_vente)} encaissés</p>
                    <p className="truncate text-[11px] text-brand-muted">
                      {new Date(`${achat.date_vente}T00:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                      {achat.note ? ` — ${achat.note}` : ""}
                    </p>
                    {/* La demande n'a encore aucun effet sur commission_due tant qu'un
                        Coordinateur ne l'a pas approuvée (pas encore construit). */}
                    {achat.statut_modification === "en_attente" ? (
                      <p className="truncate text-[11px] font-semibold text-blue-600">
                        Modification demandée : {formaterMontant(achat.montant_modifie_propose ?? 0)} (en attente de validation)
                      </p>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-brand-muted">{achat.statut === "paye" ? "Payé" : "À Payer"}</p>
                    <p className={`text-xs font-extrabold ${achat.statut === "paye" ? "text-green-600" : "text-orange-500"}`}>
                      {formaterMontant(achat.commission_due)}
                    </p>
                  </div>
                </button>
              ))}
            </>
          ) : null}
        </div>
      ) : (
        <InfosProduit produitId={produitId} />
      )}

      {onglet === "transaction" ? (
        <div className="px-4 pb-6 pt-2">
          <button
            type="button"
            onClick={() => setFeuilleAchatOuverte(true)}
            className="bg-gradient-espace w-full rounded-full py-3.5 text-sm font-bold text-white"
          >
            Ajouter un achat Externe
          </button>
        </div>
      ) : null}

      {feuilleAchatOuverte && token ? (
        <FeuilleAchatExterne
          produitId={produitId}
          token={token}
          onFermer={() => setFeuilleAchatOuverte(false)}
          onDeclare={rechargerDonnees}
        />
      ) : null}

      {jourSelectionne && token ? (
        <FeuilleDetailTransactionJour
          produitId={produitId}
          token={token}
          date={jourSelectionne.date}
          statut={jourSelectionne.statut}
          montantTotal={jourSelectionne.montant}
          nombreCommandes={jourSelectionne.nombre_commandes}
          photoProduit={photo}
          onFermer={() => setJourSelectionne(null)}
        />
      ) : null}

      {achatSelectionne && token ? (
        <FeuilleModifierMontant
          produitId={produitId}
          token={token}
          achat={achatSelectionne}
          photoProduit={photo}
          onFermer={() => setAchatSelectionne(null)}
          onModifie={rechargerDonnees}
        />
      ) : null}
    </div>
  );
}
