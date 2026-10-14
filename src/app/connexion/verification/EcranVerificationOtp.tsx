"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/lib/api";
import { SaisieCodeOtp } from "@/components/auth/SaisieCodeOtp";
import { BoutonAuthCompact } from "@/components/auth/BoutonAuthCompact";
import { ChevronLeftIcon } from "@/components/icons";

// Doit correspondre à OTP_LONGUEUR côté backend (app/Helpers/const.php).
const LONGUEUR_CODE = 6;
const DUREE_ATTENTE_RENVOI = 30;

function formaterTelephoneAffiche(telephone: string): string {
  return telephone.startsWith("+225") ? `+225 ${telephone.slice(4)}` : telephone;
}

export function EcranVerificationOtp() {
  const { demanderOtp, verifierOtpInscription } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const telephone = searchParams.get("telephone") ?? "";
  const userIdInitial = searchParams.get("user_id");

  const [userId, setUserId] = useState<number | null>(userIdInitial ? Number(userIdInitial) : null);
  const [code, setCode] = useState(searchParams.get("code_debug") ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [renvoiEnCours, setRenvoiEnCours] = useState(false);
  const [secondesRestantes, setSecondesRestantes] = useState(DUREE_ATTENTE_RENVOI);

  useEffect(() => {
    if (secondesRestantes <= 0) return;
    const minuteur = setTimeout(() => setSecondesRestantes((s) => s - 1), 1000);
    return () => clearTimeout(minuteur);
  }, [secondesRestantes]);

  async function onValider() {
    if (!userId || code.length < LONGUEUR_CODE) return;

    setErreur(null);
    setChargement(true);
    try {
      await verifierOtpInscription(userId, code);
      router.replace("/");
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de vérifier ce code. Vérifiez votre connexion internet.");
    } finally {
      setChargement(false);
    }
  }

  async function renvoyerCode() {
    if (!telephone) return;

    setErreur(null);
    setRenvoiEnCours(true);
    try {
      const resultat = await demanderOtp(telephone);
      if (resultat.userId) setUserId(resultat.userId);
      setCode(resultat.codeDebug ?? "");
      setSecondesRestantes(DUREE_ATTENTE_RENVOI);
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de renvoyer le code.");
    } finally {
      setRenvoiEnCours(false);
    }
  }

  return (
    <main className="bg-gradient-brand-blue mx-auto flex min-h-dvh w-full max-w-xl flex-col text-white md:my-6 md:min-h-[calc(100dvh-3rem)] md:max-h-[calc(100dvh-3rem)] md:overflow-y-auto md:rounded-[2rem] md:shadow-2xl md:shadow-slate-900/15 md:ring-1 md:ring-black/5">
      <div className="relative px-6 pt-6">
        <button type="button" onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      </div>

      <h1 className="mt-3 px-6 text-center text-2xl font-extrabold leading-snug">
        Vérification
        <br />
        de ton numéro
      </h1>

      <div className="mt-4 flex justify-center">
        <Image src="/images/mascotte.png" alt="" width={160} height={160} className="h-[140px] w-[140px] object-contain" priority />
      </div>

      <div className="relative mt-4 flex flex-1 flex-col rounded-t-[2rem] bg-white px-6 pb-8 pt-7 text-brand-ink">
        <p className="text-center text-sm text-brand-muted">
          Nous avons envoyé un code de confirmation par WhatsApp au numéro
          <br />
          <span className="font-bold text-[color:var(--brand-blue-end)]">{formaterTelephoneAffiche(telephone)}</span>.
        </p>

        <div className="mt-7">
          <SaisieCodeOtp longueur={LONGUEUR_CODE} valeur={code} onChange={setCode} />
        </div>

        {erreur ? <p className="mt-3 text-center text-xs text-rose-500">{erreur}</p> : null}

        <div className="mt-6 text-center text-sm">
          {secondesRestantes > 0 ? (
            <p className="text-brand-muted">Renvoyer le code ({secondesRestantes}s)</p>
          ) : (
            <button
              type="button"
              onClick={renvoyerCode}
              disabled={renvoiEnCours}
              className="font-semibold text-[color:var(--brand-blue-end)] underline underline-offset-2 disabled:opacity-60"
            >
              {renvoiEnCours ? "Envoi…" : "Renvoyer le code"}
            </button>
          )}
        </div>

        <div className="flex-1" />

        <BoutonAuthCompact type="button" onClick={onValider} disabled={!userId || code.length < LONGUEUR_CODE} chargement={chargement} texteChargement="Vérification…" className="mt-10">
          Valider
        </BoutonAuthCompact>
      </div>
    </main>
  );
}
