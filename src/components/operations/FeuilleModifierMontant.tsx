"use client";

import Image from "next/image";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { ChevronDownIcon, MonitorIcon } from "@/components/icons";
import { formaterMontant, type AchatExterneCentrePaiement } from "@/lib/types";

const CATEGORIES_MOTIF = ["Produit retourné par le client", "Remise accordée au client", "Erreur de saisie du montant", "Autre"];

/**
 * "Modifier le montant" (Centre de paiement des commissions) — le
 * fournisseur propose un montant réduit pour la commission d'un achat
 * externe, avec un motif. Ça ne fait JAMAIS baisser `commission_due` tout de
 * suite : la demande reste "en attente" jusqu'à validation d'un Coordinateur
 * (pas encore construite) — voir ProduitController::
 * demanderModificationAchatExterne(). En attendant, le montant original
 * continue d'être affiché comme dû (règle explicite du PDG).
 */
export function FeuilleModifierMontant({
  produitId,
  token,
  achat,
  photoProduit,
  onFermer,
  onModifie,
}: {
  produitId: number;
  token: string;
  achat: AchatExterneCentrePaiement;
  photoProduit: string | null;
  onFermer: () => void;
  onModifie: () => void;
}) {
  const [montant, setMontant] = useState(String(achat.montant_modifie_propose ?? achat.commission_due));
  const [categorie, setCategorie] = useState("");
  const [details, setDetails] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const montantSaisi = Number(montant);
  const montantValide = montant !== "" && montantSaisi > 0 && montantSaisi < achat.commission_due;

  async function confirmer() {
    if (enCours || !montantValide || !categorie) return;
    setErreur(null);
    setEnCours(true);

    try {
      await apiFetch(`/produits/${produitId}/achats-externes/${achat.id}/demander-modification`, {
        method: "POST",
        token,
        body: { montant_propose: montantSaisi, motif: details.trim() ? `${categorie} : ${details.trim()}` : categorie },
      });
      onModifie();
      onFermer();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onFermer}>
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-t-3xl bg-white pb-6 pt-3" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-brand-line" />
        <p className="pb-3 text-center text-sm font-bold text-brand-ink">Modifier le montant</p>

        <div className="mx-4 flex items-center gap-3 rounded-2xl bg-[#EEF5FF] p-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white">
            {photoProduit ? (
              <Image src={photoProduit} alt="" fill className="object-cover" sizes="44px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-brand-muted">
                <MonitorIcon className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-brand-ink">ACHAT EXTERNE</p>
            <p className="truncate text-[11px] text-brand-muted">
              {new Date(`${achat.date_vente}T00:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] text-brand-muted">À Payer</p>
            <p className="mt-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-3 py-1.5 text-xs font-extrabold text-white">
              {formaterMontant(achat.commission_due)}
            </p>
          </div>
        </div>

        <div className="mt-4 shrink-0 border-t border-brand-line" />

        <div className="flex flex-col gap-3 overflow-y-auto px-4 pt-4">
          <div className="flex items-center justify-between rounded-2xl border border-brand-line px-4 py-3">
            <input
              autoFocus
              inputMode="decimal"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="w-full text-sm text-brand-ink outline-none"
            />
            <span className="shrink-0 text-sm text-brand-muted">FCFA</span>
          </div>

          <div className="relative">
            <select
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-brand-line px-4 py-3 text-sm text-brand-ink"
            >
              <option value="" disabled>
                Motif
              </option>
              {CATEGORIES_MOTIF.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          </div>

          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Ecrire les motifs"
            rows={5}
            className="w-full resize-none rounded-2xl bg-[#F5F7FA] p-4 text-center text-sm text-brand-ink outline-none placeholder:text-brand-muted"
          />

          {montant !== "" && !montantValide ? (
            <p className="text-center text-xs text-rose-500">Le montant doit être positif et inférieur à {formaterMontant(achat.commission_due)}.</p>
          ) : null}
          {erreur ? <p className="text-center text-xs text-rose-500">{erreur}</p> : null}
        </div>

        <div className="flex shrink-0 gap-3 px-4 pt-4">
          <button
            type="button"
            onClick={onFermer}
            className="h-[52px] flex-1 rounded-full bg-gradient-to-r from-neutral-900 to-neutral-700 text-sm font-bold text-white"
          >
            Retour
          </button>
          <button
            type="button"
            disabled={enCours || !montantValide || !categorie}
            onClick={confirmer}
            className="h-[52px] flex-1 rounded-full bg-gradient-to-r from-blue-600 to-sky-400 text-sm font-bold text-white disabled:opacity-50"
          >
            {enCours ? "Envoi…" : "Modifier"}
          </button>
        </div>
      </div>
    </div>
  );
}
