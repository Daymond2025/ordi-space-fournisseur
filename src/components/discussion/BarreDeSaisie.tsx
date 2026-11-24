"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { MicIcon, SendIcon } from "@/components/icons";
import { messageErreurApi } from "@/lib/api";

type Props = {
  onEnvoyer: (texte: string) => Promise<void>;
  iconeExtra?: ReactNode;
  onIconeExtra?: () => void;
  /** Absent = micro inerte (comportement historique), présent = enregistrement réel. */
  onEnvoyerAudio?: (blob: Blob) => Promise<void>;
};

function formaterDuree(secondes: number): string {
  const m = Math.floor(secondes / 60);
  const s = secondes % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Barre de saisie — copiée de Cordinateur_App_Web/Ordi'Space_Fournisseur_App
 * (même origine). Envoi de texte pleinement câblé, micro déclenche un vrai
 * enregistrement (MediaRecorder) quand `onEnvoyerAudio` est fourni.
 */
export function BarreDeSaisie({ onEnvoyer, iconeExtra, onIconeExtra, onEnvoyerAudio }: Props) {
  const [valeur, setValeur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [enregistrement, setEnregistrement] = useState<"inactif" | "en_cours" | "envoi">("inactif");
  const [duree, setDuree] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const flotRef = useRef<MediaStream | null>(null);
  const minuteurRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const texte = valeur.trim();
    if (!texte || envoi) return;

    setEnvoi(true);
    setErreur(null);
    try {
      await onEnvoyer(texte);
      setValeur("");
    } catch (e) {
      setErreur(messageErreurApi(e));
    } finally {
      setEnvoi(false);
    }
  }

  function arreterFlot() {
    flotRef.current?.getTracks().forEach((piste) => piste.stop());
    flotRef.current = null;
    if (minuteurRef.current) clearInterval(minuteurRef.current);
    minuteurRef.current = null;
  }

  async function demarrerEnregistrement() {
    if (!onEnvoyerAudio || enregistrement !== "inactif") return;
    setErreur(null);

    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErreur("Les notes vocales ne sont pas prises en charge par ce navigateur.");
      return;
    }

    try {
      const flot = await navigator.mediaDevices.getUserMedia({ audio: true });
      flotRef.current = flot;
      chunksRef.current = [];

      // Chrome/Android : webm/opus ; Safari/iPhone : mp4 (pas de webm).
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
      const recorder = mimeType ? new MediaRecorder(flot, { mimeType }) : new MediaRecorder(flot);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorderRef.current = recorder;
      recorder.start();

      setDuree(0);
      minuteurRef.current = setInterval(() => setDuree((d) => d + 1), 1000);
      setEnregistrement("en_cours");
    } catch {
      arreterFlot();
      setEnregistrement("inactif");
      setErreur("Micro inaccessible : autorise l'accès au micro pour ce site dans ton navigateur.");
    }
  }

  function annulerEnregistrement() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.ondataavailable = null;
      recorderRef.current.stop();
    }
    arreterFlot();
    chunksRef.current = [];
    setEnregistrement("inactif");
  }

  async function confirmerEnregistrement() {
    const recorder = recorderRef.current;
    if (!recorder || !onEnvoyerAudio) return;

    setEnregistrement("envoi");

    const blob: Blob = await new Promise((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
      recorder.stop();
    });
    arreterFlot();

    if (blob.size === 0) {
      setEnregistrement("inactif");
      setErreur("Enregistrement vide, réessaie en parlant un peu plus longtemps.");
      return;
    }

    try {
      await onEnvoyerAudio(blob);
    } catch (e) {
      setErreur(messageErreurApi(e));
    } finally {
      setEnregistrement("inactif");
    }
  }

  if (enregistrement !== "inactif") {
    return (
      <div className="flex items-center gap-3 border-t border-brand-line bg-white px-4 py-2.5">
        <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-rose-500" />
        <span className="flex-1 text-sm text-brand-muted">
          {enregistrement === "envoi" ? "Envoi…" : `Enregistrement… ${formaterDuree(duree)}`}
        </span>
        <button
          type="button"
          onClick={annulerEnregistrement}
          disabled={enregistrement === "envoi"}
          aria-label="Annuler"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-muted disabled:opacity-50"
        >
          ✕
        </button>
        <button
          type="button"
          onClick={confirmerEnregistrement}
          disabled={enregistrement === "envoi"}
          aria-label="Envoyer le message vocal"
          className="bg-gradient-espace flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50"
        >
          <SendIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-brand-line bg-white">
    {erreur ? (
      <p role="alert" className="px-4 pt-2 text-xs font-semibold text-rose-500">
        {erreur}
      </p>
    ) : null}
    <form onSubmit={onSubmit} className="flex items-center gap-2 px-3 py-2.5">
      {iconeExtra ? (
        <button
          type="button"
          onClick={onIconeExtra}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-muted"
          style={{ boxShadow: "1px 1px 2px 0px rgba(0, 0, 0, 0.25)" }}
        >
          {iconeExtra}
        </button>
      ) : null}
      <input
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        placeholder="Écris ton message"
        className="min-w-0 flex-1 rounded-full bg-[#F5F7FA] px-4 py-2.5 text-sm text-brand-ink outline-none placeholder:text-brand-muted"
      />
      <button
        type="button"
        onClick={demarrerEnregistrement}
        aria-label={onEnvoyerAudio ? "Enregistrer un message vocal" : "Message vocal (bientôt disponible)"}
        className="flex h-9 w-9 shrink-0 items-center justify-center text-brand-muted"
      >
        <MicIcon className="h-5 w-5" />
      </button>
      <button
        type="submit"
        disabled={!valeur.trim() || envoi}
        className="bg-gradient-espace flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50"
      >
        <SendIcon className="h-4 w-4" />
      </button>
    </form>
    </div>
  );
}
