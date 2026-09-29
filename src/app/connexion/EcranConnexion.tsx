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
 * Le Fournisseur n'a pas de 2FA (roles_2fa_obligatoire() ne liste que
 * Coordinateur/Admin côté backend) — connexion simple email + mot de passe,
 * contrairement au Coordinateur/Admin.
 */
export function EcranConnexion() {
  const { user, pret, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (pret && user) router.replace("/");
  }, [pret, user, router]);

  async function onSoumettreConnexion(event: FormEvent) {
    event.preventDefault();
    setErreur(null);

    if (!email.trim() || !motDePasse) {
      setErreur("Entre ton e-mail et ton mot de passe.");
      return;
    }

    setChargement(true);
    try {
      await login(email, motDePasse);
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

      <form onSubmit={onSoumettreConnexion} className="relative -mt-6 flex flex-1 flex-col rounded-t-[2rem] bg-white px-6 pb-8 pt-5">
        <div className="mx-auto mb-8 h-1.5 w-12 rounded-full bg-brand-line" />

        <h2 className="text-center text-lg font-bold text-brand-ink">Entre tes identifiants</h2>

        <div className="mt-8 flex flex-col gap-3.5">
          <ChampAuth
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="Adresse e-mail"
            autoComplete="email"
            autoFocus
          />
          <ChampAuth
            type="password"
            value={motDePasse}
            onChange={setMotDePasse}
            placeholder="Mot de passe"
            autoComplete="current-password"
            erreur={erreur ?? undefined}
          />
        </div>

        <Link href="/mot-de-passe-oublie" className="mt-3 text-center text-xs font-semibold text-brand-muted underline underline-offset-2">
          Mot de passe oublié ?
        </Link>

        <div className="flex-1" />

        <BoutonAuthCompact chargement={chargement} texteChargement="Vérification…" className="mt-10">
          connexion
        </BoutonAuthCompact>

        <Link href="/inscription" className="mt-4 text-center text-sm font-semibold text-brand-muted underline underline-offset-2">
          Pas encore de compte ? Créer un compte
        </Link>
      </form>
    </main>
  );
}
