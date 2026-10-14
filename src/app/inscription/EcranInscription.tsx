"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/lib/api";
import { ChampAuth } from "@/components/auth/ChampAuth";
import { ChampPhotoProfil } from "@/components/auth/ChampPhotoProfil";
import { BoutonAuthCompact } from "@/components/auth/BoutonAuthCompact";
import { ChevronLeftIcon } from "@/components/icons";

/**
 * Numéro inconnu à l'écran /connexion — finalise la création du compte par
 * téléphone+OTP (uniformisation de l'auth, voir TelephoneAuthController::
 * inscrire()). Seul le nom de l'entreprise s'ajoute aux champs d'identité
 * habituels (voir InscrireTelephoneRequest, required_if fournisseur) —
 * contrairement au Livreur, aucun document n'est exigé.
 */
export function EcranInscription() {
  const { inscrireParTelephone } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const telephone = searchParams.get("telephone") ?? "";

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function onSoumettre(event: FormEvent) {
    event.preventDefault();
    setErreur(null);

    if (!telephone) {
      setErreur("Numéro manquant — recommence depuis l'écran de connexion.");
      return;
    }
    if (!nom.trim() || !nomEntreprise.trim()) {
      setErreur("Remplis tous les champs obligatoires.");
      return;
    }

    setChargement(true);
    try {
      const resultat = await inscrireParTelephone(telephone, nom, prenom.trim() || undefined, nomEntreprise, photo || undefined);
      const params = new URLSearchParams({ telephone, user_id: String(resultat.userId) });
      if (resultat.codeDebug) params.set("code_debug", resultat.codeDebug);

      router.push(`/connexion/verification?${params.toString()}`);
    } catch (e) {
      const premierMessageDeChamp = e instanceof ApiRequestError ? Object.values(e.fields ?? {})[0]?.[0] : undefined;
      setErreur(premierMessageDeChamp ?? (e instanceof ApiRequestError ? e.message : "Impossible de créer le compte. Vérifiez votre connexion internet."));
    } finally {
      setChargement(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-white pb-10 md:my-6 md:min-h-[calc(100dvh-3rem)] md:max-h-[calc(100dvh-3rem)] md:overflow-y-auto md:rounded-[2rem] md:shadow-2xl md:shadow-slate-900/15 md:ring-1 md:ring-black/5">
      <div className="bg-gradient-brand-blue relative flex flex-col items-center rounded-b-[2.5rem] px-6 pb-6 pt-6 text-white">
        <button type="button" onClick={() => router.back()} className="absolute left-4 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>

        <h1 className="mt-2 text-center text-2xl font-extrabold leading-snug">
          Crée ton compte
          <br />
          Fournisseur
        </h1>

        <Image src="/images/mascotte.png" alt="" width={275} height={274} className="mt-2 h-[130px] w-[131px] object-contain" priority />
      </div>

      <form onSubmit={onSoumettre} className="relative -mt-6 flex flex-1 flex-col rounded-t-[2rem] bg-white px-6 pb-8 pt-5">
        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-brand-line" />

        <h2 className="text-center text-lg font-bold text-brand-ink">Tes informations</h2>
        {telephone ? (
          <p className="mt-1 text-center text-sm font-semibold text-[color:var(--brand-blue-end)]">+{telephone.replace(/^\+/, "")}</p>
        ) : null}

        <div className="mt-4 flex justify-center">
          <ChampPhotoProfil onChange={setPhoto} />
        </div>

        <div className="mt-4 flex flex-col gap-3.5">
          <ChampAuth type="text" value={nom} onChange={setNom} placeholder="Nom" autoComplete="family-name" autoFocus />
          <ChampAuth type="text" value={prenom} onChange={setPrenom} placeholder="Prénom (optionnel)" autoComplete="given-name" />
          <ChampAuth type="text" value={nomEntreprise} onChange={setNomEntreprise} placeholder="Nom de l'entreprise" autoComplete="organization" />
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
