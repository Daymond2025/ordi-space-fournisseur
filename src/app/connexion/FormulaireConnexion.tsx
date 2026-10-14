"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/lib/api";
import { ChampAuth } from "@/components/auth/ChampAuth";
import { BoutonAuthCompact } from "@/components/auth/BoutonAuthCompact";

/**
 * Connexion par numéro + OTP WhatsApp — uniformisation de l'auth, même
 * mécanisme que le Client (voir Ordi’Space_App_Mobile/src/app/connexion).
 * Les comptes déjà créés par e-mail/mot de passe restent joignables via le
 * lien "Se connecter avec e-mail" ci-dessous (/connexion/email, ancien
 * EcranConnexion inchangé) — aucune migration forcée.
 */
export function FormulaireConnexion() {
  const { user, pret, demanderOtp } = useAuth();
  const router = useRouter();

  const [telephone, setTelephone] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (pret && user) router.replace("/");
  }, [pret, user, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setErreur(null);

    if (!telephone.trim()) {
      setErreur("Entre ton numéro whatsapp.");
      return;
    }

    setChargement(true);
    try {
      const resultat = await demanderOtp(telephone);
      const params = new URLSearchParams({ telephone });

      if (resultat.compteExistant && resultat.userId) {
        params.set("user_id", String(resultat.userId));
        if (resultat.codeDebug) params.set("code_debug", resultat.codeDebug);
        router.push(`/connexion/verification?${params.toString()}`);
      } else {
        router.push(`/inscription?${params.toString()}`);
      }
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de se connecter. Vérifiez votre connexion internet.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-white pb-10 md:my-6 md:min-h-[calc(100dvh-3rem)] md:max-h-[calc(100dvh-3rem)] md:overflow-y-auto md:rounded-[2rem] md:shadow-2xl md:shadow-slate-900/15 md:ring-1 md:ring-black/5">
      <div className="bg-gradient-brand-blue relative flex flex-col items-center rounded-b-[2.5rem] px-6 pb-6 pt-6 text-white">
        <h1 className="mt-2 text-center text-2xl font-extrabold leading-snug">
          Connecte-toi
          <br />à ton espace Fournisseur
        </h1>

        <Image
          src="/images/mascotte.png"
          alt=""
          width={275}
          height={274}
          className="mt-2 h-[178px] w-[179px] object-contain"
          priority
        />
      </div>

      <form onSubmit={onSubmit} className="relative -mt-6 flex flex-1 flex-col rounded-t-[2rem] bg-white px-6 pb-8 pt-5">
        <div className="mx-auto mb-8 h-1.5 w-12 rounded-full bg-brand-line" />

        <h2 className="text-center text-lg font-bold text-brand-ink">Entre ton numéro whatsapp</h2>

        <div className="mt-8">
          <ChampAuth type="tel" value={telephone} onChange={setTelephone} placeholder="Numéro whatsapp" autoComplete="tel" autoFocus erreur={erreur ?? undefined} />
        </div>

        <div className="flex-1" />

        <BoutonAuthCompact chargement={chargement} texteChargement="Vérification…" className="mt-10">
          connexion
        </BoutonAuthCompact>

        <Link href="/connexion/email" className="mt-4 text-center text-sm font-semibold text-brand-muted underline underline-offset-2">
          Se connecter avec e-mail et mot de passe
        </Link>
      </form>
    </main>
  );
}
