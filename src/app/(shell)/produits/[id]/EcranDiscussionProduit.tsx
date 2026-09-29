"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ChevronLeftIcon, MonitorIcon } from "@/components/icons";
import { CarteCommandeDiscussion } from "@/components/discussion/CarteCommandeDiscussion";
import { BulleMessage } from "@/components/discussion/BulleMessage";
import { BarreDeSaisie } from "@/components/discussion/BarreDeSaisie";
import type { ConversationProduit, ItemFil, ProduitConversationHeader } from "@/lib/types";

/**
 * Discussion produit — même logique de conversation que
 * Cordinateur_App_Web/src/app/(shell)/produit/[id]/EcranDiscussionProduit.tsx
 * (même endpoint GET /produits/{id}/conversation, déjà accessible au
 * fournisseur propriétaire — Produit::estAccessibleConversationPar()).
 * Deux différences volontaires avec la version Coordinateur : l'en-tête (4
 * pastilles de stats séparées au lieu d'une ligne de texte, d'après le
 * mockup) et l'absence du bouton flottant "+" (créer une commande manuelle
 * est une action Coordinateur/Commercial, pas Fournisseur).
 */
export function EcranDiscussionProduit({ produitId }: { produitId: number }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [conversation, setConversation] = useState<ConversationProduit | null>(null);
  const [produit, setProduit] = useState<ProduitConversationHeader | null>(null);
  const [chargement, setChargement] = useState(true);

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

  async function recharger() {
    if (!token) return;
    const data = await apiFetch<ConversationProduit>(`/produits/${produitId}/conversation`, { token });
    setConversation(data);
  }

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<ConversationProduit>(`/produits/${produitId}/conversation`, { token })
      .then((data) => {
        if (!annule) setConversation(data);
      })
      .catch(() => {
        if (!annule) setConversation(null);
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [token, produitId]);

  async function envoyerMessage(texte: string) {
    if (!token) return;
    await apiFetch(`/produits/${produitId}/messages`, { method: "POST", token, body: { contenu: texte } });
    await recharger();
  }

  async function envoyerAudio(blob: Blob) {
    if (!token) return;
    const formData = new FormData();
    formData.append("fichier", blob, "message-vocal.webm");
    formData.append("type", "note_vocale");
    await apiFetch(`/produits/${produitId}/messages`, { method: "POST", token, body: formData });
    await recharger();
  }

  const items: ItemFil[] = conversation?.items ?? [];
  const nomProduit = produit?.nom_produit ?? `Produit #${produitId}`;
  const photo = produit?.images[0]?.url_image ?? null;
  const stats = conversation?.en_tete ?? { recues: 0, livrees: 0, annulees: 0, en_cours: 0 };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-brand-line bg-white px-3 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Retour"
            className="flex h-8 w-8 shrink-0 items-center justify-center text-brand-ink"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#EEF1F6]">
            {photo ? (
              <Image src={photo} alt={nomProduit} fill className="object-cover" sizes="40px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-brand-muted">
                <MonitorIcon className="h-5 w-5" />
              </div>
            )}
          </div>

          <p className="min-w-0 flex-1 truncate text-sm font-bold text-brand-ink">{nomProduit}</p>

          {/* Même icône que l'onglet "Paiement" de la nav du bas, mais une
              fonctionnalité différente propre à cet écran : "Centre de
              paiement des commissions" de CE produit — voir
              ProduitController::centrePaiement(). */}
          <button
            type="button"
            onClick={() => router.push(`/produits/${produitId}/paiement`)}
            aria-label="Centre de paiement"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F7FA]"
          >
            <Image src="/images/paiement.png" alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-brand-ink">
            {stats.recues} commandes reçu
          </span>
          <span className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-green-600">{stats.livrees} Livrée</span>
          <span className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-[color:var(--brand-blue-end)]">
            {stats.en_cours} En cours
          </span>
          <span className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-rose-500">{stats.annulees} Annulée</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto bg-[#f6f2ed]">
        <div className="space-y-3 px-3 py-4 pb-6">
          {chargement ? (
            <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-brand-muted">Aucune activité pour l&apos;instant.</p>
          ) : (
            items.map((item) =>
              item.type === "commande" ? (
                <CarteCommandeDiscussion key={`commande-${item.donnee.commande_id}`} carte={item.donnee} />
              ) : (
                <BulleMessage key={`message-${item.donnee.id}`} message={item.donnee} estMoi={item.donnee.auteur_id === user?.id} />
              )
            )
          )}
        </div>
      </div>

      <BarreDeSaisie onEnvoyer={envoyerMessage} onEnvoyerAudio={envoyerAudio} />
    </div>
  );
}
