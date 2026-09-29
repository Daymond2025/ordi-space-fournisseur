"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { BanIcon, ChevronLeftIcon, MinusBoxIcon, PencilIcon, PlusBoxIcon, TrashIcon } from "@/components/icons";

/** Statuts où le fournisseur peut encore corriger sa fiche — voir ProduitPolicy::update() (jamais "valide", réservé au Coordinateur ensuite). */
const STATUTS_MODIFIABLES = ["en_attente", "rejete", "corrige"];

/**
 * Feuille du menu ☰ (écran détail produit, onglet "Mes produits") — même
 * mockup que Cordinateur_App_Web/FeuilleMenuProduit.tsx, adapté au périmètre
 * fournisseur :
 * - "Ajouter du stock"/"Stock épuisé" : identiques (PATCH /produits/{id}/stock,
 *   ProduitPolicy::gererStock() les autorise déjà sur son propre produit).
 * - "Modifier" : PUT /produits/{id} (ProduitController::update(), pas
 *   modifierFiche() qui est Coordinateur-only) — n'est autorisé QUE quand
 *   statut_produit est en_attente/rejete/corrige (ProduitPolicy::update()) ;
 *   grisé sinon (produit déjà publié, à corriger via le Coordinateur).
 * - "Modifier le prix" : TOUJOURS désactivé — prix_vente reste fixé par le
 *   Coordinateur (voir StoreProduitRequest::rules(), Rule::prohibitedIf pour
 *   un fournisseur), jamais une action fournisseur, contrairement à la
 *   version Coordinateur de cette feuille.
 * - "Supprimer" : DELETE /produits/{id}, maintenant autorisé sur son propre
 *   produit (ProduitPolicy::delete(), étendu pour ce mockup) — bloqué si le
 *   produit a déjà été commandé, même garde-fou que côté Coordinateur.
 */
export function FeuilleMenuProduit({
  produitId,
  quantiteActuelle,
  statutProduit,
  token,
  onFermer,
  onApplique,
  onSupprime,
}: {
  produitId: number;
  quantiteActuelle: number;
  statutProduit: string;
  token: string;
  onFermer: () => void;
  onApplique: () => void;
  onSupprime: () => void;
}) {
  const router = useRouter();
  const [vue, setVue] = useState<"menu" | "ajouter-stock" | "supprimer">("menu");
  const [quantiteAjoutee, setQuantiteAjoutee] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const peutModifier = STATUTS_MODIFIABLES.includes(statutProduit);

  async function marquerEpuise() {
    if (enCours) return;
    setErreur(null);
    setEnCours(true);
    try {
      await apiFetch(`/produits/${produitId}/stock`, { method: "PATCH", token, body: { quantite_stock: 0 } });
      onApplique();
      onFermer();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  async function confirmerAjoutStock() {
    const delta = Number(quantiteAjoutee);
    if (enCours || !quantiteAjoutee.trim() || Number.isNaN(delta) || delta <= 0) return;
    setErreur(null);
    setEnCours(true);
    try {
      await apiFetch(`/produits/${produitId}/stock`, { method: "PATCH", token, body: { quantite_stock: quantiteActuelle + delta } });
      onApplique();
      onFermer();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  async function confirmerSuppression() {
    if (enCours) return;
    setErreur(null);
    setEnCours(true);
    try {
      await apiFetch(`/produits/${produitId}`, { method: "DELETE", token });
      onSupprime();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Une erreur est survenue.");
      setEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onFermer}>
      <div className="w-full max-w-md rounded-t-3xl bg-white pb-6 pt-3" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-line" />

        {vue === "menu" ? (
          <div className="space-y-3 px-4">
            <button
              type="button"
              onClick={() => setVue("ajouter-stock")}
              className="mx-auto flex h-[62px] w-[284px] items-center justify-center gap-2 rounded-[11px] text-sm font-bold"
              style={{ background: "rgba(232, 255, 223, 1)", border: "1px solid rgba(54, 206, 0, 1)", color: "rgba(28, 140, 0, 1)" }}
            >
              <PlusBoxIcon className="h-5 w-5" />
              Ajouter du stock
            </button>
            <button
              type="button"
              disabled={enCours}
              onClick={marquerEpuise}
              className="mx-auto flex h-[62px] w-[284px] items-center justify-center gap-2 rounded-[11px] text-sm font-bold disabled:opacity-50"
              style={{ background: "rgba(250, 236, 252, 1)", border: "1px solid rgba(255, 138, 88, 1)", color: "rgba(255, 90, 20, 1)" }}
            >
              <MinusBoxIcon className="h-5 w-5" />
              Stock épuisé
            </button>
            <button
              type="button"
              disabled={!peutModifier}
              onClick={() => {
                onFermer();
                router.push(`/produits/${produitId}/modifier`);
              }}
              aria-label={peutModifier ? "Modifier" : "Modifier (impossible : produit déjà publié, passe par le Coordinateur)"}
              className="mx-auto flex h-[62px] w-[284px] items-center justify-center gap-2 rounded-[11px] text-sm font-bold text-white disabled:bg-[#F5F7FA] disabled:text-brand-muted"
              style={peutModifier ? { background: "rgba(0, 119, 255, 1)" } : undefined}
            >
              <PencilIcon className="h-5 w-5" />
              Modifier
            </button>
            <button
              type="button"
              disabled
              aria-label="Modifier le prix — réservé au Coordinateur"
              className="mx-auto flex h-[62px] w-[284px] items-center justify-center gap-2 rounded-[11px] text-sm font-bold"
              style={{ background: "rgba(0, 119, 255, 0.24)", border: "1px solid rgba(0, 85, 255, 1)", color: "rgba(0, 85, 255, 1)" }}
            >
              <BanIcon className="h-5 w-5" />
              Modifier le prix
            </button>
            <button
              type="button"
              onClick={() => setVue("supprimer")}
              className="mx-auto flex h-[62px] w-[284px] items-center justify-center gap-2 rounded-[11px] text-sm font-bold text-white"
              style={{ background: "rgba(255, 0, 0, 1)" }}
            >
              <TrashIcon className="h-5 w-5" />
              Supprimer
            </button>

            {!peutModifier ? (
              <p className="text-center text-xs text-brand-muted">
                Ce produit est déjà publié : les corrections de fiche passent par le Coordinateur.
              </p>
            ) : null}
            {erreur ? <p className="text-center text-xs text-rose-500">{erreur}</p> : null}
          </div>
        ) : vue === "ajouter-stock" ? (
          <div className="space-y-3 px-4">
            <button type="button" onClick={() => setVue("menu")} className="flex items-center gap-1 text-sm font-semibold text-brand-ink">
              <ChevronLeftIcon className="h-4 w-4" /> Retour
            </button>
            <p className="text-center text-sm font-bold text-brand-ink">Ajouter du stock</p>
            <input
              autoFocus
              type="number"
              min={1}
              value={quantiteAjoutee}
              onChange={(e) => setQuantiteAjoutee(e.target.value)}
              placeholder="Quantité à ajouter"
              className="w-full rounded-full border border-brand-line px-4 py-2.5 text-center text-sm text-brand-ink outline-none placeholder:text-brand-muted"
            />
            {erreur ? <p className="text-center text-xs text-rose-500">{erreur}</p> : null}
            <button
              type="button"
              disabled={enCours || !quantiteAjoutee.trim()}
              onClick={confirmerAjoutStock}
              className="h-[62px] w-full rounded-[11px] border border-green-700 bg-green-600 text-sm font-bold text-white disabled:opacity-50"
            >
              {enCours ? "Enregistrement…" : "Confirmer"}
            </button>
          </div>
        ) : (
          <div className="space-y-3 px-4">
            <button type="button" onClick={() => setVue("menu")} className="flex items-center gap-1 text-sm font-semibold text-brand-ink">
              <ChevronLeftIcon className="h-4 w-4" /> Retour
            </button>
            <p className="text-center text-sm font-bold text-brand-ink">Supprimer ce produit ?</p>
            <p className="text-center text-xs text-brand-muted">Cette action est définitive, le produit sera supprimé pour de bon.</p>
            {erreur ? <p className="text-center text-xs text-rose-500">{erreur}</p> : null}
            <button
              type="button"
              disabled={enCours}
              onClick={confirmerSuppression}
              className="h-[62px] w-full rounded-[11px] border border-red-700 bg-red-600 text-sm font-bold text-white disabled:opacity-50"
            >
              {enCours ? "Suppression…" : "Confirmer la suppression"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
