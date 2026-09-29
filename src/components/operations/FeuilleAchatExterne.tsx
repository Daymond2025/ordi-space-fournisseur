"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

/**
 * Feuille "Ajouter un achat Externe" (Centre de paiement des commissions,
 * app Fournisseur) — déclare une vente du produit encaissée par le
 * fournisseur lui-même, hors du flux commande in-app. Voir
 * ProduitController::declarerAchatExterne() : la commission due est
 * calculée côté serveur (taux_commission du compte), jamais ici.
 */
export function FeuilleAchatExterne({
  produitId,
  token,
  onFermer,
  onDeclare,
}: {
  produitId: number;
  token: string;
  onFermer: () => void;
  onDeclare: () => void;
}) {
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const montantValide = Number(montant) > 0;

  async function confirmer() {
    if (enCours || !montantValide || !date) return;
    setErreur(null);
    setEnCours(true);

    try {
      await apiFetch(`/produits/${produitId}/achats-externes`, {
        method: "POST",
        token,
        body: { montant_vente: Number(montant), date_vente: date, note: note.trim() || undefined },
      });
      onDeclare();
      onFermer();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onFermer}>
      <div className="w-full max-w-md rounded-t-3xl bg-white pb-6 pt-3" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-line" />

        <div className="space-y-3 px-4">
          <p className="text-center text-sm font-bold text-brand-ink">Ajouter un achat Externe</p>
          <p className="text-center text-xs text-brand-muted">
            Une vente de ce produit que tu as encaissée toi-même, hors application. La commission due à Ordi&apos;space
            sera calculée sur le montant saisi.
          </p>

          <div>
            <label className="mb-1 block text-xs font-semibold text-brand-muted">Montant encaissé (FCFA)</label>
            <input
              autoFocus
              inputMode="decimal"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="Ex : 250000"
              className="w-full rounded-full border border-brand-line px-4 py-2.5 text-sm text-brand-ink outline-none placeholder:text-brand-muted"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-brand-muted">Date de la vente</label>
            <input
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-full border border-brand-line px-4 py-2.5 text-sm text-brand-ink outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-brand-muted">Note (facultatif)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex : Vente directe en boutique"
              className="w-full rounded-full border border-brand-line px-4 py-2.5 text-sm text-brand-ink outline-none placeholder:text-brand-muted"
            />
          </div>

          {erreur ? <p className="text-center text-xs text-rose-500">{erreur}</p> : null}

          <button
            type="button"
            disabled={enCours || !montantValide || !date}
            onClick={confirmer}
            className="bg-gradient-espace h-[52px] w-full rounded-full text-sm font-bold text-white disabled:opacity-50"
          >
            {enCours ? "Enregistrement…" : "Déclarer cette vente"}
          </button>
        </div>
      </div>
    </div>
  );
}
