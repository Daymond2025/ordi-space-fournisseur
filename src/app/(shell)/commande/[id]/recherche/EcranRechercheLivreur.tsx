"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, apiFetchAvecMeta, ApiRequestError } from "@/lib/api";
import { ChevronLeftIcon, TruckIcon, XCircleIcon } from "@/components/icons";
import { formaterMontant, type CommandeDetail, type DonneesCommandeCreee, type ProfilFournisseur } from "@/lib/types";

// Le vivier (voir CommandeController::marquerPreparee()/LivraisonController::index())
// ne pousse rien au front : on vérifie nous-mêmes, à intervalle régulier, si
// un livreur a accepté (le seul signal client-side possible sans websocket).
const INTERVALLE_POLLING_MS = 4000;

/**
 * "Recherche d'un livreur" — ouvert depuis EcranCommande.tsx (bouton
 * "Envoyer à un livreur"/"Voir la recherche en cours"). Déclenche
 * POST /commandes/{id}/preparee (idempotent : si déjà en recherche, ne
 * rappelle pas), qui notifie en vrai (Web Push) les livreurs actuellement
 * disponibles — voir PushNotificationService::envoyerAuxLivreursDisponibles().
 * Le vivier lui-même reste "pull" (n'importe quel livreur peut le voir et
 * l'accepter, voir LivraisonController::index()) : cet écran ne fait que
 * surveiller si c'est arrivé, sans sélection manuelle d'un livreur précis
 * (décision confirmée avec l'utilisateur).
 */
export function EcranRechercheLivreur({ commandeId }: { commandeId: number }) {
  const { token } = useAuth();
  const router = useRouter();

  const [commande, setCommande] = useState<CommandeDetail | null>(null);
  const [apercu, setApercu] = useState<DonneesCommandeCreee | null>(null);
  const [profil, setProfil] = useState<ProfilFournisseur | null>(null);
  const [demarrageEnCours, setDemarrageEnCours] = useState(true);
  const [actionEnCours, setActionEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const enRecherche = useRef(false);

  const chargerCommande = useCallback(async () => {
    if (!token) return null;
    const { data, meta } = await apiFetchAvecMeta<CommandeDetail>(`/commandes/${commandeId}`, { token });
    setCommande(data);
    setApercu((meta.apercu as DonneesCommandeCreee) ?? null);
    return data;
  }, [token, commandeId]);

  // Démarrage : lance la recherche si elle ne l'est pas déjà (idempotent —
  // revenir sur cet écran après un aller-retour ne la relance pas).
  useEffect(() => {
    if (!token) return;
    let annule = false;

    (async () => {
      try {
        const [profilData, commandeData] = await Promise.all([
          apiFetch<ProfilFournisseur>("/moi/profil", { token }),
          chargerCommande(),
        ]);
        if (annule) return;
        setProfil(profilData);

        if (commandeData?.statut_commande === "validee") {
          await apiFetch(`/commandes/${commandeId}/preparee`, { method: "POST", token });
          if (annule) return;
          await chargerCommande();
        }

        if (!annule) enRecherche.current = true;
      } catch (e) {
        if (!annule) setErreur(e instanceof ApiRequestError ? e.message : "Impossible de lancer la recherche.");
      } finally {
        if (!annule) setDemarrageEnCours(false);
      }
    })();

    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, commandeId]);

  // Polling : dès qu'un livreur accepte, la livraison quitte
  // "en_attente_livreur" — on revient alors sur le détail commande.
  useEffect(() => {
    if (!token || demarrageEnCours) return;

    const minuteur = setInterval(async () => {
      if (!enRecherche.current) return;
      const data = await chargerCommande().catch(() => null);
      if (data && data.statut_commande !== "validee" && data.livraison?.statut_livraison !== "en_attente_livreur") {
        enRecherche.current = false;
        router.replace(`/commande/${commandeId}`);
      }
    }, INTERVALLE_POLLING_MS);

    return () => clearInterval(minuteur);
  }, [token, demarrageEnCours, commandeId, router, chargerCommande]);

  async function augmenterFrais() {
    if (!token || actionEnCours) return;
    setActionEnCours(true);
    setErreur(null);
    try {
      await apiFetch(`/commandes/${commandeId}/frais-livraison/augmenter`, { method: "POST", token });
      await chargerCommande();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'augmenter les frais de livraison.");
    } finally {
      setActionEnCours(false);
    }
  }

  async function relancerRecherche() {
    if (!token || actionEnCours) return;
    setActionEnCours(true);
    setErreur(null);
    try {
      const data = await chargerCommande();
      if (data?.statut_commande === "validee") {
        await apiFetch(`/commandes/${commandeId}/preparee`, { method: "POST", token });
        await chargerCommande();
      }
      enRecherche.current = true;
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de relancer la recherche.");
    } finally {
      setActionEnCours(false);
    }
  }

  async function annulerRecherche() {
    if (!token || actionEnCours) return;
    setActionEnCours(true);
    setErreur(null);
    enRecherche.current = false;
    try {
      await apiFetch(`/commandes/${commandeId}/annuler-recherche`, { method: "POST", token });
      router.replace(`/commande/${commandeId}`);
    } catch (e) {
      enRecherche.current = true;
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'annuler la recherche.");
      setActionEnCours(false);
    }
  }

  const zoneCollecte = profil?.zone_couverte ?? "—";
  const zoneLivraison = apercu?.zone_livraison ?? "—";

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-3 border-b border-brand-line px-4 py-3">
        <button
          type="button"
          onClick={() => router.push(`/commande/${commandeId}`)}
          aria-label="Retour"
          className="flex h-8 w-8 shrink-0 items-center justify-center text-brand-ink"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <p className="text-base font-extrabold text-brand-ink">Livreur Space</p>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto bg-[#f2f5fa]">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10">
          <div className="relative flex h-[190px] w-[190px] items-center justify-center">
            <span className="absolute inset-0 rounded-full border-2 border-[color:var(--brand-blue-end)]/40" />
            <span className="absolute inset-0 animate-ping rounded-full border-2 border-[color:var(--brand-blue-end)]" style={{ animationDuration: "2.5s" }} />
            <span className="absolute left-0 right-0 top-1/2 h-px bg-[color:var(--brand-blue-end)]/30" />
            <div className="relative flex h-[100px] w-[100px] items-center justify-center rounded-full bg-white shadow-lg shadow-blue-900/10">
              <div className="bg-gradient-espace flex h-[62px] w-[62px] items-center justify-center rounded-full">
                <TruckIcon className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg font-extrabold text-brand-ink">Recherche d&apos;un livreur à proximité…</p>
            <p className="mt-1.5 text-sm text-brand-muted">Nous contactons les livreurs les mieux notés dans votre secteur.</p>
          </div>
        </div>

        <div className="rounded-t-[26px] bg-white px-5 pb-6 pt-5 shadow-[0px_-8px_20px_rgba(0,0,0,0.06)]">
          <p className="text-center text-sm font-bold text-brand-ink">
            {zoneCollecte} - {zoneLivraison}
          </p>

          <div className="mt-4 flex items-center gap-2.5">
            <div className="flex h-14 flex-1 items-center justify-between rounded-2xl border border-brand-line px-4">
              <span className="text-xs text-brand-muted">Frais de livraison</span>
              <span className="text-sm font-extrabold text-brand-ink">
                {commande ? formaterMontant(commande.frais_livraison) : "—"}
              </span>
            </div>
            <button
              type="button"
              onClick={augmenterFrais}
              disabled={actionEnCours || demarrageEnCours}
              className="h-14 shrink-0 rounded-2xl bg-[color:var(--brand-blue-end)] px-5 text-sm font-bold text-white disabled:opacity-60"
            >
              Augmenter
            </button>
          </div>

          <div className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5">
            <p className="text-center text-xs font-semibold text-rose-500">
              Augmenter les frais de livraison pour trouver rapidement un livreur
            </p>
          </div>

          {erreur ? <p className="mt-3 text-center text-xs text-rose-500">{erreur}</p> : null}

          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={relancerRecherche}
              disabled={actionEnCours || demarrageEnCours}
              className="flex items-center justify-center gap-2 rounded-full bg-blue-50 py-3.5 text-sm font-bold text-[color:var(--brand-blue-end)] disabled:opacity-60"
            >
              <XCircleIcon className="h-4 w-4" />
              Assigner à un livreur
            </button>
            <button
              type="button"
              onClick={annulerRecherche}
              disabled={actionEnCours || demarrageEnCours}
              className="flex items-center justify-center gap-2 rounded-full bg-[#EEF1F6] py-3.5 text-sm font-bold text-brand-ink disabled:opacity-60"
            >
              <XCircleIcon className="h-4 w-4" />
              Annuler la recherche
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
