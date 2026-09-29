"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, apiFetchAvecMeta } from "@/lib/api";
import { LIBELLES_STATUT } from "@/lib/statuts";
import { partager } from "@/lib/partage";
import { ChevronLeftIcon, ChevronDownIcon, MonitorIcon, ShareIcon } from "@/components/icons";
import { DetailCommande } from "@/components/discussion/DetailCommande";
import { BulleMessage } from "@/components/discussion/BulleMessage";
import { BarreDeSaisie } from "@/components/discussion/BarreDeSaisie";
import { TimelineSuivi } from "@/components/commande/TimelineSuivi";
import type { CommandeDetail, DonneesCommandeCreee, MessageConversation, SuiviEntree } from "@/lib/types";

function formaterDateCommande(iso: string): string {
  const date = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";

  return `${date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} · ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

/**
 * Détail commande (Suivi/Information) — même logique de conversation que
 * Cordinateur_App_Web/src/app/commande/[id]/EcranCommande.tsx (même
 * endpoints GET /commandes/{id}, /commandes/{id}/suivi, /commandes/{id}/messages
 * — accessibles au fournisseur propriétaire depuis cette passe, voir
 * Commande::estAccessiblePar()). Volontairement plus simple que la version
 * Coordinateur : pas de feuille de changement de statut libre (le fournisseur
 * n'a qu'un seul vrai pouvoir ici), pas de bouton WhatsApp/Appeler (le numéro
 * du client est déjà cliquable dans le détail). "Envoyer à un livreur" ne
 * fait plus l'appel direct : il ouvre l'écran dédié "Recherche d'un livreur"
 * (voir commande/[id]/recherche/EcranRechercheLivreur.tsx), qui appelle
 * marquerPreparee() lui-même.
 */
export function EcranCommande({ commandeId }: { commandeId: number }) {
  const { token } = useAuth();
  const router = useRouter();

  const [commande, setCommande] = useState<CommandeDetail | null>(null);
  const [apercu, setApercu] = useState<DonneesCommandeCreee | null>(null);
  const [onglet, setOnglet] = useState<"information" | "suivi">("information");
  const [suivi, setSuivi] = useState<SuiviEntree[] | null>(null);
  const [messages, setMessages] = useState<MessageConversation[]>([]);

  async function chargerMessages() {
    if (!token) return;
    const pagination = await apiFetch<{ data: MessageConversation[] }>(`/commandes/${commandeId}/messages`, { token });
    setMessages(pagination.data.filter((m) => m.type !== "commande_creee"));
  }

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetchAvecMeta<CommandeDetail>(`/commandes/${commandeId}`, { token })
      .then(({ data, meta }) => {
        if (annule) return;
        setCommande(data);
        setApercu((meta.apercu as DonneesCommandeCreee) ?? null);
      })
      .catch(() => {});

    return () => {
      annule = true;
    };
  }, [token, commandeId]);

  useEffect(() => {
    if (!token || onglet !== "suivi") return;
    let annule = false;

    apiFetch<SuiviEntree[]>(`/commandes/${commandeId}/suivi`, { token })
      .then((data) => {
        if (!annule) setSuivi(data);
      })
      .catch(() => {});

    apiFetch<{ data: MessageConversation[] }>(`/commandes/${commandeId}/messages`, { token })
      .then((pagination) => {
        if (!annule) setMessages(pagination.data.filter((m) => m.type !== "commande_creee"));
      })
      .catch(() => {});

    return () => {
      annule = true;
    };
  }, [onglet, token, commandeId]);

  async function envoyerMessage(texte: string) {
    if (!token) return;
    await apiFetch(`/commandes/${commandeId}/messages`, { method: "POST", token, body: { contenu: texte } });
    await chargerMessages();
  }

  async function envoyerAudio(blob: Blob) {
    if (!token) return;
    const formData = new FormData();
    formData.append("fichier", blob, "message-vocal.webm");
    formData.append("type", "note_vocale");
    await apiFetch(`/commandes/${commandeId}/messages`, { method: "POST", token, body: formData });
    await chargerMessages();
  }

  const titre = commande ? (LIBELLES_STATUT[commande.statut_commande] ?? commande.statut_commande) : "Commande";

  function partagerCommande() {
    if (!apercu) return;
    const lignes = [
      `Commande #${commandeId} — ${titre}`,
      `Produit : ${apercu.nom_produit}`,
      `Client : ${apercu.nom_client}${apercu.telephone ? ` (${apercu.telephone})` : ""}`,
      apercu.zone_livraison ? `Zone de livraison : ${apercu.zone_livraison}` : null,
      `Total : ${apercu.total.toLocaleString("fr-FR")} FCFA`,
    ].filter((ligne): ligne is string => ligne !== null);

    partager(lignes.join("\n"), `Commande #${commandeId}`);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-brand-line bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="flex h-8 w-8 shrink-0 items-center justify-center text-brand-ink">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-[color:var(--brand-blue-end)]">{titre}</p>
            {commande ? <p className="text-xs text-brand-muted">{formaterDateCommande(commande.date_commande)}</p> : null}
          </div>
          <button
            type="button"
            onClick={partagerCommande}
            disabled={!apercu}
            aria-label="Partager"
            className="flex h-8 w-8 shrink-0 items-center justify-center text-brand-ink disabled:opacity-40"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
        </div>

        {apercu ? (
          <div className="mt-3 flex gap-2.5 rounded-[9px] bg-white p-2.5" style={{ boxShadow: "1px 1px 2px 0px rgba(0, 0, 0, 0.25)" }}>
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[9px] bg-[#F6F8FE]">
              {apercu.photo ? (
                <Image src={apercu.photo} alt={apercu.nom_produit} fill className="object-cover" sizes="56px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-brand-muted">
                  <MonitorIcon className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-brand-ink">{apercu.nom_produit}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-brand-ink">{apercu.nom_client}</span>
                {apercu.zone_livraison ? (
                  <span className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-brand-muted">{apercu.zone_livraison}</span>
                ) : null}
              </div>
              {apercu.telephone ? (
                <a href={`tel:${apercu.telephone}`} className="mt-1.5 block text-sm font-semibold text-[color:var(--brand-blue-end)]">
                  {apercu.telephone}
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-3 flex rounded-full bg-[#EEF1F6] p-1">
          <button
            type="button"
            onClick={() => setOnglet("suivi")}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${onglet === "suivi" ? "bg-gradient-espace text-white" : "text-brand-muted"}`}
          >
            Suivie
          </button>
          <button
            type="button"
            onClick={() => setOnglet("information")}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${onglet === "information" ? "bg-gradient-espace text-white" : "text-brand-muted"}`}
          >
            Information
          </button>
        </div>
      </div>

      {onglet === "information" ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {apercu ? (
              <div className="overflow-hidden rounded-[9px] bg-white">
                <div className="px-3.5 pb-3.5 pt-3">
                  <DetailCommande donnees={apercu} />
                </div>
                <div className="h-4 w-full bg-black" />
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
            )}

            {commande?.statut_commande === "validee" ? (
              <button
                type="button"
                onClick={() => router.push(`/commande/${commandeId}/recherche`)}
                className="bg-gradient-brand-orange w-full rounded-full py-3 text-sm font-bold text-white"
              >
                Envoyer à un livreur
              </button>
            ) : commande?.statut_commande === "en_preparation" ? (
              // La commande est déjà dans le vivier (marquerPreparee() déjà
              // appelé) — permet de revenir sur l'écran de recherche après
              // l'avoir quitté (ex. bouton retour), sans relancer l'action.
              <button
                type="button"
                onClick={() => router.push(`/commande/${commandeId}/recherche`)}
                className="bg-gradient-brand-orange w-full rounded-full py-3 text-sm font-bold text-white"
              >
                Voir la recherche en cours
              </button>
            ) : null}
          </div>

          <BarreDeSaisie onEnvoyer={envoyerMessage} onEnvoyerAudio={envoyerAudio} />
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto bg-[#f6f2ed] px-4 py-4">
            <div className="rounded-[26px] bg-white p-4 shadow-sm shadow-slate-900/5">
              {suivi ? <TimelineSuivi entrees={suivi} /> : <p className="py-6 text-center text-sm text-brand-muted">Chargement…</p>}
            </div>

            {messages.map((message) => (
              <BulleMessage key={message.id} message={message} estMoi={false} />
            ))}
          </div>

          <button
            type="button"
            aria-label="Revenir en bas"
            className="absolute bottom-20 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg"
          >
            <ChevronDownIcon className="h-5 w-5" />
          </button>

          <BarreDeSaisie onEnvoyer={envoyerMessage} onEnvoyerAudio={envoyerAudio} />
        </div>
      )}
    </div>
  );
}
