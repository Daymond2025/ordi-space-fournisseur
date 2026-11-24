"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/lib/api";
import { CadreAuth } from "@/components/auth/kit/CadreAuth";
import { SaisieCodeOtp } from "@/components/auth/kit/SaisieCodeOtp";
import { BoutonAuth, BoutonRetour, MessageErreur } from "@/components/auth/kit/BoutonAuth";
import type { HumeurMascotte } from "@/components/auth/kit/MascotteVivante";
import { THEME_AUTH } from "@/components/auth/kit/themeAuth";

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
  const r = THEME_AUTH.repliques;

  const telephone = searchParams.get("telephone") ?? "";
  const userIdInitial = searchParams.get("user_id");

  const [userId, setUserId] = useState<number | null>(userIdInitial ? Number(userIdInitial) : null);
  const [code, setCode] = useState(searchParams.get("code_debug") ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [compteurErreurs, setCompteurErreurs] = useState(0);
  const [chargement, setChargement] = useState(false);
  const [succes, setSucces] = useState(false);
  const [renvoiEnCours, setRenvoiEnCours] = useState(false);
  const [codeRenvoye, setCodeRenvoye] = useState(false);
  const [secondesRestantes, setSecondesRestantes] = useState(DUREE_ATTENTE_RENVOI);

  useEffect(() => {
    if (secondesRestantes <= 0) return;
    const minuteur = setTimeout(() => setSecondesRestantes((s) => s - 1), 1000);
    return () => clearTimeout(minuteur);
  }, [secondesRestantes]);

  async function onValider(valeur = code) {
    if (!userId || valeur.length < LONGUEUR_CODE || chargement || succes) return;

    setErreur(null);
    setChargement(true);
    try {
      await verifierOtpInscription(userId, valeur);
      // Petite fête (saut + confettis) avant d'entrer dans l'app.
      setSucces(true);
      setTimeout(() => router.replace("/"), 1600);
    } catch (e) {
      setCode("");
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de vérifier ce code. Vérifiez votre connexion internet.");
      setCompteurErreurs((n) => n + 1);
      navigator.vibrate?.(120);
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
      setCodeRenvoye(true);
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de renvoyer le code.");
    } finally {
      setRenvoiEnCours(false);
    }
  }

  let humeur: HumeurMascotte = "code";
  let bulle = codeRenvoye ? "Nouveau code envoyé ! 💬" : r.code;
  if (succes) {
    humeur = "succes";
    bulle = r.succes;
  } else if (erreur) {
    humeur = "erreur";
    bulle = "Oups… ce code ne passe pas 😅";
  }

  return (
    <CadreAuth humeur={humeur} bulle={bulle} declencheur={compteurErreurs} succes={succes}>
      <BoutonRetour onClick={() => router.back()} />

      <h2 className="mt-3 text-2xl font-black text-slate-900">Vérification</h2>
      <p className="mt-1.5 text-sm text-slate-500">
        Saisis le code reçu sur WhatsApp au{" "}
        <span className="font-bold text-[var(--auth-accent)]">{formaterTelephoneAffiche(telephone)}</span>.
      </p>

      <div className="mt-7">
        <SaisieCodeOtp longueur={LONGUEUR_CODE} valeur={code} onChange={setCode} onComplet={onValider} moderne autoFocus />
      </div>

      <MessageErreur erreur={erreur} />

      <BoutonAuth
        type="button"
        onClick={() => onValider()}
        disabled={!userId || code.length < LONGUEUR_CODE}
        chargement={chargement}
        succes={succes}
        className="mt-8"
      >
        Valider le code
      </BoutonAuth>

      <p className="mt-5 text-center text-sm text-slate-500">
        Pas reçu ?{" "}
        {secondesRestantes > 0 ? (
          <span className="font-semibold tabular-nums text-slate-400">Renvoyer dans {secondesRestantes} s</span>
        ) : (
          <button
            type="button"
            onClick={renvoyerCode}
            disabled={renvoiEnCours}
            className="font-bold text-[var(--auth-accent)] underline-offset-2 hover:underline disabled:opacity-60"
          >
            {renvoiEnCours ? "Envoi…" : "Renvoyer le code"}
          </button>
        )}
      </p>
    </CadreAuth>
  );
}
