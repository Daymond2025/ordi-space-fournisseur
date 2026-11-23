"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { permissionNotifications, sAbonnerAuxPush } from "@/lib/push";

/**
 * Notifications « persistantes avec sonnerie » (même module dans les apps
 * Coordinateur, Commercial et Client) :
 * - l'app interroge GET /moi/notifications/etat toutes les 10 s (30 s en
 *   arrière-plan) ;
 * - chaque nouvelle notification sonne, fait vibrer le téléphone et affiche
 *   un bandeau qui reste à l'écran jusqu'à ce qu'on le touche ;
 * - une notification urgente non lue fait re-sonner l'app toutes les 20 s ;
 * - app fermée : notification système via Web Push (public/sw.js).
 */

export type NotificationApp = {
  id: number;
  type_notification: string;
  titre: string | null;
  contenu: string;
  lien: string | null;
  urgente: boolean;
  lu: boolean;
  date_envoi: string;
};

type EtatNotifications = {
  non_lues: number;
  urgentes_non_lues: number;
  dernier_id: number;
  nouvelles: NotificationApp[];
};

type ContexteNotifications = {
  nonLues: number;
  /** Incrémenté à chaque nouvelle notification : la page Notifications se recharge. */
  version: number;
  rafraichir: () => void;
  marquerLue: (id: number) => Promise<void>;
  toutMarquerLu: () => Promise<void>;
};

const NotificationsContext = createContext<ContexteNotifications | null>(null);

const SON = "/sons/notification.wav";
const DELAI_VISIBLE_MS = 10_000;
const DELAI_ARRIERE_PLAN_MS = 30_000;
const REPETITION_URGENTE_MS = 20_000;
const CLE_RAPPEL_MASQUE = "ordispace.notifications.rappel-masque";

export function NotificationsProvider({
  children,
  resoudreLien,
}: {
  children: ReactNode;
  /** Écran à ouvrir pour une notification sans lien (ex. Admin : selon son type). */
  resoudreLien?: (n: NotificationApp) => string | null | undefined;
}) {
  const { token } = useAuth();
  const router = useRouter();
  const [nonLues, setNonLues] = useState(0);
  const [urgentes, setUrgentes] = useState(0);
  const [version, setVersion] = useState(0);
  const [bandeaux, setBandeaux] = useState<NotificationApp[]>([]);
  // Lus côté navigateur uniquement (rendu serveur : rien à afficher).
  const permissionNavigateur = useSyncExternalStore(sAbonnerAucun, permissionNotifications, () => "non-supporte" as const);
  const rappelMasqueStocke = useSyncExternalStore(sAbonnerAucun, lireRappelMasque, () => true);
  const [permissionForcee, setPermission] = useState<ReturnType<typeof permissionNotifications> | null>(null);
  const [rappelMasqueForce, setRappelMasque] = useState(false);
  const permission = permissionForcee ?? permissionNavigateur;
  const rappelMasque = rappelMasqueForce || rappelMasqueStocke;
  const dernierIdRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Son ----------------------------------------------------------------
  // Les navigateurs bloquent le son tant que l'utilisateur n'a pas touché la
  // page : le premier toucher (n'importe où) « déverrouille » la sonnerie.
  useEffect(() => {
    const audio = new Audio(SON);
    audio.preload = "auto";
    audioRef.current = audio;

    const deverrouiller = () => {
      audio.muted = true;
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => {})
        .finally(() => {
          audio.muted = false;
        });
      window.removeEventListener("pointerdown", deverrouiller);
      window.removeEventListener("keydown", deverrouiller);
    };
    window.addEventListener("pointerdown", deverrouiller);
    window.addEventListener("keydown", deverrouiller);
    return () => {
      window.removeEventListener("pointerdown", deverrouiller);
      window.removeEventListener("keydown", deverrouiller);
    };
  }, []);

  const sonner = useCallback((urgente = false) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
    navigator.vibrate?.(urgente ? [400, 150, 400, 150, 800] : [300, 150, 300]);
  }, []);

  // --- Interrogation du serveur -------------------------------------------
  const verifier = useCallback(async () => {
    if (!token) return;
    const premier = dernierIdRef.current === null;
    try {
      const etat = await apiFetch<EtatNotifications>(
        `/moi/notifications/etat${premier ? "" : `?apres_id=${dernierIdRef.current}`}`,
        { token }
      );
      setNonLues(etat.non_lues);
      setUrgentes(etat.urgentes_non_lues);

      // Premier tour (connexion, changement de compte) : on repart de zéro.
      if (premier) setBandeaux([]);
      const nouvelles = etat.nouvelles.filter((n) => !n.lu);
      if (!premier && nouvelles.length > 0) {
        setBandeaux((actuels) => [...nouvelles, ...actuels.filter((a) => !nouvelles.some((n) => n.id === a.id))].slice(0, 3));
        setVersion((v) => v + 1);
        sonner(nouvelles.some((n) => n.urgente));
      }
      dernierIdRef.current = Math.max(etat.dernier_id, dernierIdRef.current ?? 0);
    } catch {
      // Réseau coupé : on réessaiera au prochain tour.
    }
  }, [token, sonner]);

  useEffect(() => {
    dernierIdRef.current = null;
    if (!token) return;

    let minuterie: ReturnType<typeof setTimeout>;
    let actif = true;
    const boucle = async () => {
      await verifier();
      if (!actif) return;
      minuterie = setTimeout(boucle, document.visibilityState === "visible" ? DELAI_VISIBLE_MS : DELAI_ARRIERE_PLAN_MS);
    };
    boucle();

    const auRetour = () => {
      if (document.visibilityState === "visible") verifier();
    };
    document.addEventListener("visibilitychange", auRetour);

    // Push reçu pendant que l'app est à l'écran (public/sw.js) : on vérifie tout de suite.
    const surMessage = (e: MessageEvent) => {
      if (e.data?.type === "notification-push") verifier();
    };
    navigator.serviceWorker?.addEventListener("message", surMessage);

    return () => {
      actif = false;
      clearTimeout(minuterie);
      document.removeEventListener("visibilitychange", auRetour);
      navigator.serviceWorker?.removeEventListener("message", surMessage);
    };
  }, [token, verifier]);

  // Urgentes non lues : la sonnerie se répète tant que personne n'a réagi.
  useEffect(() => {
    if (urgentes === 0 || !token) return;
    const id = setInterval(() => sonner(true), REPETITION_URGENTE_MS);
    return () => clearInterval(id);
  }, [urgentes, token, sonner]);

  // --- Autorisation des notifications du téléphone -----------------------
  // Déjà autorisé : on (ré)enregistre l'abonnement pour l'utilisateur connecté.
  useEffect(() => {
    if (token && permissionNotifications() === "granted") sAbonnerAuxPush(token);
  }, [token]);

  async function activer() {
    if (!token) return;
    sonner();
    setPermission(await sAbonnerAuxPush(token, true));
  }

  function masquerRappel() {
    setRappelMasque(true);
    try {
      sessionStorage.setItem(CLE_RAPPEL_MASQUE, "1");
    } catch {
      // Stockage indisponible : masqué jusqu'au rechargement seulement.
    }
  }

  // --- Lecture -------------------------------------------------------------
  const marquerLue = useCallback(
    async (id: number) => {
      setBandeaux((b) => b.filter((n) => n.id !== id));
      if (!token) return;
      try {
        await apiFetch(`/moi/notifications/${id}/lue`, { method: "PATCH", token });
      } finally {
        verifier();
      }
    },
    [token, verifier]
  );

  const toutMarquerLu = useCallback(async () => {
    setBandeaux([]);
    if (!token) return;
    try {
      await apiFetch("/moi/notifications/tout-lu", { method: "PATCH", token });
    } finally {
      verifier();
    }
  }, [token, verifier]);

  function ouvrir(n: NotificationApp) {
    marquerLue(n.id);
    router.push(n.lien || resoudreLien?.(n) || "/notifications");
  }

  return (
    <NotificationsContext.Provider value={{ nonLues: token ? nonLues : 0, version, rafraichir: verifier, marquerLue, toutMarquerLu }}>
      {children}

      {token && bandeaux.length > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] mx-auto flex w-full max-w-xl flex-col gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          {bandeaux.map((n) => (
            <div
              key={n.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border-l-4 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.25)] ring-1 ring-black/5 ${
                n.urgente ? "border-rose-500" : "border-[#1d63e0]"
              }`}
            >
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 animate-pulse items-center justify-center rounded-full text-white ${
                  n.urgente ? "bg-rose-500" : "bg-[#1d63e0]"
                }`}
              >
                <IconeCloche className="h-4.5 w-4.5" />
              </span>
              <button type="button" onClick={() => ouvrir(n)} className="min-w-0 flex-1 text-left">
                <p className="text-sm font-bold text-slate-900">{n.titre || "Notification"}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{n.contenu}</p>
                <p className="mt-1 text-[11px] font-semibold text-[#1d63e0]">Toucher pour ouvrir</p>
              </button>
              <button
                type="button"
                onClick={() => marquerLue(n.id)}
                aria-label="Fermer la notification"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {token && permission === "default" && !rappelMasque ? (
        <div className="fixed inset-x-0 bottom-24 z-[90] mx-auto w-full max-w-xl px-3">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900 p-3 text-white shadow-xl">
            <IconeCloche className="h-5 w-5 shrink-0 text-amber-300" />
            <p className="flex-1 text-xs leading-snug">Activez les notifications et la sonnerie pour ne manquer aucune alerte.</p>
            <button type="button" onClick={activer} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-900">
              Activer
            </button>
            <button type="button" onClick={masquerRappel} aria-label="Plus tard" className="px-1 text-lg leading-none text-white/70">
              ×
            </button>
          </div>
        </div>
      ) : null}
    </NotificationsContext.Provider>
  );
}

function sAbonnerAucun(): () => void {
  return () => {};
}

function lireRappelMasque(): boolean {
  try {
    return sessionStorage.getItem(CLE_RAPPEL_MASQUE) === "1";
  } catch {
    return false;
  }
}

export function useNotifications(): ContexteNotifications {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications doit être utilisé dans NotificationsProvider");
  return ctx;
}

/** Cloche avec le nombre de notifications non lues — mène à /notifications. */
export function ClocheNotifications({ className = "" }: { className?: string }) {
  const { nonLues } = useNotifications();
  return (
    <Link
      href="/notifications"
      aria-label={nonLues > 0 ? `${nonLues} notification(s) non lue(s)` : "Notifications"}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full ${className}`}
    >
      <IconeCloche className="h-5.5 w-5.5" />
      {nonLues > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
          {nonLues > 99 ? "99+" : nonLues}
        </span>
      ) : null}
    </Link>
  );
}

function IconeCloche(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

/** Liste complète (page /notifications), rechargée à chaque nouvelle notification. */
export function ListeNotifications() {
  const { token } = useAuth();
  const router = useRouter();
  const { version, nonLues, marquerLue, toutMarquerLu } = useNotifications();
  const [liste, setListe] = useState<NotificationApp[] | null>(null);
  const [erreur, setErreur] = useState(false);
  const [essai, setEssai] = useState(0);

  useEffect(() => {
    if (!token) return;
    apiFetch<{ data: NotificationApp[] }>("/moi/notifications?per_page=50", { token })
      .then((page) => {
        setListe(page.data);
        setErreur(false);
      })
      .catch(() => setErreur(true));
  }, [token, version, essai]);

  function ouvrir(n: NotificationApp) {
    setListe((l) => l?.map((x) => (x.id === n.id ? { ...x, lu: true } : x)) ?? l);
    if (!n.lu) marquerLue(n.id);
    if (n.lien) router.push(n.lien);
  }

  async function toutLire() {
    setListe((l) => l?.map((x) => ({ ...x, lu: true })) ?? l);
    await toutMarquerLu();
  }

  return (
    <div className="flex flex-col gap-3">
      {nonLues > 0 ? (
        <button type="button" onClick={toutLire} className="self-end text-xs font-semibold text-[#1d63e0]">
          Tout marquer comme lu
        </button>
      ) : null}

      {erreur && liste === null ? (
        <div className="flex flex-col items-center gap-3 pt-10 text-center">
          <p className="text-sm text-slate-500">Impossible de charger les notifications.</p>
          <button type="button" onClick={() => setEssai((e) => e + 1)} className="rounded-full bg-[#1d63e0] px-4 py-2 text-xs font-bold text-white">
            Réessayer
          </button>
        </div>
      ) : liste === null ? (
        <p className="pt-6 text-center text-sm text-slate-500">Chargement…</p>
      ) : liste.length === 0 ? (
        <div className="flex flex-col items-center gap-3 pt-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <IconeCloche className="h-6 w-6" />
          </span>
          <p className="text-sm text-slate-500">Aucune notification pour le moment.</p>
        </div>
      ) : (
        liste.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => ouvrir(n)}
            className={`flex items-start gap-3 rounded-2xl p-4 text-left shadow-sm ${
              n.lu ? "bg-white" : `border-l-4 bg-blue-50 ${n.urgente ? "border-rose-500" : "border-[#1d63e0]"}`
            }`}
          >
            <span
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                n.lu ? "bg-slate-100 text-slate-400" : n.urgente ? "bg-rose-500 text-white" : "bg-[#1d63e0] text-white"
              }`}
            >
              <IconeCloche className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              {n.titre ? <p className={`text-sm text-slate-900 ${n.lu ? "font-semibold" : "font-bold"}`}>{n.titre}</p> : null}
              <p className={`text-sm leading-relaxed text-slate-700 ${n.titre ? "mt-0.5 text-xs" : ""}`}>{n.contenu}</p>
              <p className="mt-1.5 text-[11px] text-slate-400">
                {new Date(n.date_envoi).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            {!n.lu ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1d63e0]" /> : null}
          </button>
        ))
      )}
    </div>
  );
}
