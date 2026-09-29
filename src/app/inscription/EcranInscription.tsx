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
 * Contrairement au Coordinateur (créé par un Administrateur, aucun écran
 * d'inscription à répliquer), le Fournisseur s'auto-inscrit — seul chemin
 * d'onboarding existant pour ce rôle (POST /auth/register, voir
 * roles_auto_inscription() côté backend). Contrairement au Livreur, aucun
 * document n'est exigé : seul le nom de l'entreprise s'ajoute aux champs
 * d'identité habituels (voir RegisterRequest, required_if fournisseur).
 */
export function EcranInscription() {
  const { user, pret, register } = useAuth();
  const router = useRouter();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (pret && user) router.replace("/");
  }, [pret, user, router]);

  async function onSoumettre(event: FormEvent) {
    event.preventDefault();
    setErreur(null);

    if (!nom.trim() || !nomEntreprise.trim() || !email.trim() || !motDePasse) {
      setErreur("Remplis tous les champs obligatoires.");
      return;
    }

    if (motDePasse !== confirmationMotDePasse) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }

    setChargement(true);
    try {
      await register({
        nom,
        prenom: prenom.trim() || undefined,
        nom_entreprise: nomEntreprise,
        telephone: telephone.trim() || undefined,
        email,
        password: motDePasse,
        password_confirmation: confirmationMotDePasse,
      });
    } catch (e) {
      // Formulaire à plusieurs champs (contrairement à la connexion, qui n'a
      // qu'une seule cause d'erreur possible) : on affiche le premier message
      // de champ renvoyé par la validation quand il existe, plus précis que
      // le message générique "Les données envoyées ne sont pas valides.".
      const premierMessageDeChamp = e instanceof ApiRequestError ? Object.values(e.fields ?? {})[0]?.[0] : undefined;
      setErreur(premierMessageDeChamp ?? (e instanceof ApiRequestError ? e.message : "Impossible de créer le compte. Vérifiez votre connexion internet."));
    } finally {
      setChargement(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-white pb-10 md:my-6 md:min-h-[calc(100dvh-3rem)] md:max-h-[calc(100dvh-3rem)] md:overflow-y-auto md:rounded-[2rem] md:shadow-2xl md:shadow-slate-900/15 md:ring-1 md:ring-black/5">
      <div className="bg-gradient-brand-blue relative flex flex-col items-center rounded-b-[2.5rem] px-6 pb-6 pt-6 text-white">
        <h1 className="mt-2 text-center text-2xl font-extrabold leading-snug">
          Crée ton compte
          <br />
          Fournisseur
        </h1>

        <Image
          src="/images/mascotte.png"
          alt=""
          width={275}
          height={274}
          className="mt-2 h-[130px] w-[131px] object-contain"
          priority
        />
      </div>

      <form onSubmit={onSoumettre} className="relative -mt-6 flex flex-1 flex-col rounded-t-[2rem] bg-white px-6 pb-8 pt-5">
        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-brand-line" />

        <h2 className="text-center text-lg font-bold text-brand-ink">Tes informations</h2>

        <div className="mt-6 flex flex-col gap-3.5">
          <ChampAuth type="text" value={nom} onChange={setNom} placeholder="Nom" autoComplete="family-name" autoFocus />
          <ChampAuth type="text" value={prenom} onChange={setPrenom} placeholder="Prénom (optionnel)" autoComplete="given-name" />
          <ChampAuth type="text" value={nomEntreprise} onChange={setNomEntreprise} placeholder="Nom de l'entreprise" autoComplete="organization" />
          <ChampAuth type="tel" value={telephone} onChange={setTelephone} placeholder="Téléphone (optionnel)" autoComplete="tel" />
          <ChampAuth type="email" value={email} onChange={setEmail} placeholder="Adresse e-mail" autoComplete="email" />
          <ChampAuth type="password" value={motDePasse} onChange={setMotDePasse} placeholder="Mot de passe" autoComplete="new-password" />
          <ChampAuth
            type="password"
            value={confirmationMotDePasse}
            onChange={setConfirmationMotDePasse}
            placeholder="Confirmer le mot de passe"
            autoComplete="new-password"
          />
        </div>

        {erreur ? <p className="mt-4 text-center text-xs text-rose-500">{erreur}</p> : null}

        <BoutonAuthCompact chargement={chargement} texteChargement="Création…" className="mt-6">
          créer mon compte
        </BoutonAuthCompact>

        <Link href="/connexion" className="mt-4 text-center text-sm font-semibold text-brand-muted underline underline-offset-2">
          Déjà un compte ? Se connecter
        </Link>
      </form>
    </main>
  );
}
