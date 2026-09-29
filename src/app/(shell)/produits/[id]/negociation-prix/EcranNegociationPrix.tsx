"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ChevronLeftIcon } from "@/components/icons";
import { BulleMessage } from "@/components/discussion/BulleMessage";
import { BarreDeSaisie } from "@/components/discussion/BarreDeSaisie";
import type { MessageConversation, ProduitConversationHeader } from "@/lib/types";

/**
 * "Négociation de prix" (app Fournisseur) — même écran que Cordinateur_App_Web/
 * src/app/produit/[id]/negociation-prix/EcranNegociationPrix.tsx, fil séparé
 * de la discussion générale (Message.est_negociation_prix, voir
 * MessageController). Le fournisseur ne peut JAMAIS démarrer une négociation
 * (MessageController::demarrerNegociationPrix() est réservé Coordinateur/Admin
 * — "c'est la plateforme qui propose une contre-offre, pas l'inverse") : il
 * consulte et répond seulement, via repondreNegociationPrix() déjà ouvert à
 * son rôle (Produit::estAccessibleConversationPar()). CartePropositionPrix
 * (déjà présente dans BulleMessage.tsx) affiche la contre-offre en lecture
 * seule ; toute réponse (accepter, contre-proposer, discuter) passe par un
 * message texte classique dans ce même fil.
 */
export function EcranNegociationPrix({ produitId }: { produitId: number }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [produit, setProduit] = useState<ProduitConversationHeader | null>(null);
  const [messages, setMessages] = useState<MessageConversation[]>([]);
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

  async function charger() {
    if (!token) return;
    const pagination = await apiFetch<{ data: MessageConversation[] }>(`/produits/${produitId}/negociation-prix`, { token });
    setMessages(pagination.data);
  }

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<{ data: MessageConversation[] }>(`/produits/${produitId}/negociation-prix`, { token })
      .then((pagination) => {
        if (!annule) setMessages(pagination.data);
      })
      .catch(() => {
        if (!annule) setMessages([]);
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
    await apiFetch(`/produits/${produitId}/negociation-prix/messages`, { method: "POST", token, body: { contenu: texte } });
    await charger();
  }

  async function envoyerAudio(blob: Blob) {
    if (!token) return;
    const formData = new FormData();
    formData.append("fichier", blob, "message-vocal.webm");
    formData.append("type", "note_vocale");
    await apiFetch(`/produits/${produitId}/negociation-prix/messages`, { method: "POST", token, body: formData });
    await charger();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="bg-gradient-espace flex items-center gap-3 px-4 py-4 text-white">
        <button type="button" onClick={() => router.back()} aria-label="Retour" className="flex h-8 w-8 shrink-0 items-center justify-center">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <p className="text-base font-extrabold leading-none">Négociation de prix</p>
          {produit ? <p className="mt-1 text-xs text-white/80">{produit.nom_produit}</p> : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#f6f2ed]">
        <div className="space-y-3 px-3 py-4">
          {chargement ? (
            <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
          ) : messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-brand-muted">
              Aucune proposition pour l&apos;instant — le Coordinateur t&apos;enverra une contre-offre ici s&apos;il en propose une.
            </p>
          ) : (
            messages.map((message) => <BulleMessage key={message.id} message={message} estMoi={message.auteur_id === user?.id} />)
          )}
        </div>
      </div>

      <BarreDeSaisie onEnvoyer={envoyerMessage} onEnvoyerAudio={envoyerAudio} />
    </div>
  );
}
