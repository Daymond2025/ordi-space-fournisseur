"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { ChampAuth } from "@/components/auth/ChampAuth";
import { SaisieCodeOtp } from "@/components/auth/SaisieCodeOtp";
import { BoutonAuthCompact } from "@/components/auth/BoutonAuthCompact";
import { ChevronLeftIcon } from "@/components/icons";

// Doit correspondre à OTP_LONGUEUR côté backend (app/Helpers/const.php) —
// même code à 6 chiffres que la connexion à deux facteurs, colonnes distinctes.
const LONGUEUR_CODE = 6;

type Etape = "email" | "code" | "confirmation";

/**
 * "Mot de passe oublié" — POST /auth/mot-de-passe/oublie puis
 * /auth/mot-de-passe/reinitialiser. Toujours le même message de succès à
 * l'étape 1, qu'un compte existe ou non pour cette adresse (le backend ne le
 * révèle jamais) : le fournisseur pense simplement "un code m'a été envoyé si
 * mon adresse est correcte" et passe à l'étape suivante dans tous les cas.
 */
export function EcranMotDePasseOublie() {
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function onDemanderCode(event: FormEvent) {
    event.preventDefault();
    setErreur(null);

    if (!email.trim()) {
      setErreur("Entre ton adresse e-mail.");
      return;
    }

    setChargement(true);
    try {
      await apiFetch("/auth/mot-de-passe/oublie", { method: "POST", body: { email: email.trim() } });
      setEtape("code");
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'envoyer le code. Vérifiez votre connexion internet.");
    } finally {
      setChargement(false);
    }
  }

  async function onReinitialiser(event: FormEvent) {
    event.preventDefault();
    setErreur(null);

    if (code.length < LONGUEUR_CODE) {
      setErreur("Entre le code reçu par e-mail.");
      return;
    }
    if (!motDePasse) {
      setErreur("Choisis un nouveau mot de passe.");
      return;
    }
    if (motDePasse !== confirmationMotDePasse) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }

    setChargement(true);
    try {
      await apiFetch("/auth/mot-de-passe/reinitialiser", {
        method: "POST",
        body: { email: email.trim(), code, password: motDePasse, password_confirmation: confirmationMotDePasse },
      });
      setEtape("confirmation");
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de réinitialiser le mot de passe. Vérifiez votre connexion internet.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-white pb-10 md:my-6 md:min-h-[calc(100dvh-3rem)] md:max-h-[calc(100dvh-3rem)] md:overflow-y-auto md:rounded-[2rem] md:shadow-2xl md:shadow-slate-900/15 md:ring-1 md:ring-black/5">
      <div className="bg-gradient-brand-blue relative flex flex-col items-center rounded-b-[2.5rem] px-6 pb-6 pt-6 text-white">
        {etape === "code" ? (
          <button
            type="button"
            onClick={() => {
              setEtape("email");
              setErreur(null);
            }}
            aria-label="Retour"
            className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        ) : null}

        <h1 className="mt-2 text-center text-2xl font-extrabold leading-snug">
          Mot de passe
          <br />
          oublié
        </h1>

        <Image src="/images/mascotte.png" alt="" width={275} height={274} className="mt-2 h-[130px] w-[131px] object-contain" priority />
      </div>

      {etape === "email" ? (
        <form onSubmit={onDemanderCode} className="relative -mt-6 flex flex-1 flex-col rounded-t-[2rem] bg-white px-6 pb-8 pt-5">
          <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-brand-line" />
          <h2 className="text-center text-lg font-bold text-brand-ink">Ton adresse e-mail</h2>
          <p className="mt-1.5 text-center text-xs text-brand-muted">
            On t&apos;envoie un code à 6 chiffres pour choisir un nouveau mot de passe.
          </p>

          <div className="mt-6">
            <ChampAuth type="email" value={email} onChange={setEmail} placeholder="Adresse e-mail" autoComplete="email" autoFocus erreur={erreur ?? undefined} />
          </div>

          <div className="flex-1" />

          <BoutonAuthCompact chargement={chargement} texteChargement="Envoi…" className="mt-10">
            envoyer le code
          </BoutonAuthCompact>

          <Link href="/connexion" className="mt-4 text-center text-sm font-semibold text-brand-muted underline underline-offset-2">
            Retour à la connexion
          </Link>
        </form>
      ) : etape === "code" ? (
        <form onSubmit={onReinitialiser} className="relative -mt-6 flex flex-1 flex-col rounded-t-[2rem] bg-white px-6 pb-8 pt-5">
          <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-brand-line" />
          <h2 className="text-center text-lg font-bold text-brand-ink">Nouveau mot de passe</h2>
          <p className="mt-1.5 text-center text-xs text-brand-muted">
            Code envoyé à <span className="font-bold text-[color:var(--brand-blue-end)]">{email}</span>, valable 30 minutes.
          </p>

          <div className="mt-6">
            <SaisieCodeOtp longueur={LONGUEUR_CODE} valeur={code} onChange={setCode} />
          </div>

          <div className="mt-6 flex flex-col gap-3.5">
            <ChampAuth type="password" value={motDePasse} onChange={setMotDePasse} placeholder="Nouveau mot de passe" autoComplete="new-password" />
            <ChampAuth
              type="password"
              value={confirmationMotDePasse}
              onChange={setConfirmationMotDePasse}
              placeholder="Confirmer le mot de passe"
              autoComplete="new-password"
            />
          </div>

          {erreur ? <p className="mt-3 text-center text-xs text-rose-500">{erreur}</p> : null}

          <div className="flex-1" />

          <BoutonAuthCompact chargement={chargement} texteChargement="Validation…" className="mt-8">
            valider
          </BoutonAuthCompact>

          <button
            type="button"
            onClick={onDemanderCode}
            disabled={chargement}
            className="mt-4 text-center text-sm font-semibold text-brand-muted underline underline-offset-2 disabled:opacity-60"
          >
            Renvoyer le code
          </button>
        </form>
      ) : (
        <div className="relative -mt-6 flex flex-1 flex-col items-center rounded-t-[2rem] bg-white px-6 pb-8 pt-5">
          <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-brand-line" />
          <h2 className="text-center text-lg font-bold text-brand-ink">Mot de passe mis à jour</h2>
          <p className="mt-1.5 text-center text-sm text-brand-muted">Connecte-toi avec ton nouveau mot de passe.</p>

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => router.push("/connexion")}
            className="bg-gradient-brand-blue mx-auto flex h-[43px] w-[234px] items-center justify-center rounded-[11px] border-2 border-white/40 text-sm font-semibold text-white shadow-md shadow-blue-200"
          >
            se connecter
          </button>
        </div>
      )}
    </main>
  );
}
