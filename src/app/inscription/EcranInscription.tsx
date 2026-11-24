"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/lib/api";
import { ChampPhotoProfil } from "@/components/auth/ChampPhotoProfil";
import { CadreAuth } from "@/components/auth/kit/CadreAuth";
import { ChampFlottant, IconeBoutique, IconePersonne } from "@/components/auth/kit/ChampFlottant";
import { BoutonAuth, BoutonRetour, Etapes, MessageErreur } from "@/components/auth/kit/BoutonAuth";
import type { HumeurMascotte } from "@/components/auth/kit/MascotteVivante";
import { THEME_AUTH } from "@/components/auth/kit/themeAuth";

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
  const r = THEME_AUTH.repliques;

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [compteurErreurs, setCompteurErreurs] = useState(0);
  const [chargement, setChargement] = useState(false);
  const [focus, setFocus] = useState(false);

  function signaler(message: string) {
    setErreur(message);
    setCompteurErreurs((n) => n + 1);
    navigator.vibrate?.(120);
  }

  async function onSoumettre(event: FormEvent) {
    event.preventDefault();
    setErreur(null);

    if (!telephone) {
      signaler("Numéro manquant — recommence depuis l'écran de connexion.");
      return;
    }
    if (!nom.trim() || !nomEntreprise.trim()) {
      signaler("Remplis tous les champs obligatoires.");
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
      signaler(premierMessageDeChamp ?? (e instanceof ApiRequestError ? e.message : "Impossible de créer le compte. Vérifiez votre connexion internet."));
    } finally {
      setChargement(false);
    }
  }

  const complet = Boolean(nom.trim() && nomEntreprise.trim());
  let humeur: HumeurMascotte = "repos";
  let bulle = r.nom;
  if (erreur) {
    humeur = "erreur";
    bulle = r.erreur;
  } else if (complet) {
    humeur = "saisie";
    bulle = "Tout est prêt, on crée ton compte ? ✨";
  } else if (focus) {
    humeur = "saisie";
  }

  return (
    <CadreAuth humeur={humeur} bulle={bulle} declencheur={compteurErreurs}>
      <form onSubmit={onSoumettre} className="flex flex-1 flex-col" noValidate>
        <div className="flex items-center gap-3">
          <BoutonRetour onClick={() => router.back()} />
          <div className="flex-1">
            <Etapes etapes={["Numéro", "Infos", "Code"]} active={1} />
          </div>
        </div>

        <h2 className="mt-5 text-2xl font-black text-slate-900">Crée ton compte</h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Espace Fournisseur
          {telephone ? <span className="font-bold text-[var(--auth-accent)]"> · +{telephone.replace(/^\+/, "")}</span> : null}
        </p>

        <div className="mt-5 flex justify-center">
          <ChampPhotoProfil onChange={setPhoto} />
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <ChampFlottant
            type="text"
            label="Nom"
            value={nom}
            onChange={(v) => {
              setNom(v);
              setErreur(null);
            }}
            icone={<IconePersonne />}
            valide={nom.trim().length > 1}
            enErreur={Boolean(erreur) && !nom.trim()}
            declencheurErreur={compteurErreurs}
            autoComplete="family-name"
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
          />
          <ChampFlottant
            type="text"
            label="Prénom (optionnel)"
            value={prenom}
            onChange={setPrenom}
            icone={<IconePersonne />}
            autoComplete="given-name"
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
          />
          <ChampFlottant
            type="text"
            label="Nom de l'entreprise"
            value={nomEntreprise}
            onChange={(v) => {
              setNomEntreprise(v);
              setErreur(null);
            }}
            icone={<IconeBoutique />}
            valide={nomEntreprise.trim().length > 1}
            enErreur={Boolean(erreur) && !nomEntreprise.trim()}
            declencheurErreur={compteurErreurs}
            autoComplete="organization"
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
          />
        </div>

        <MessageErreur erreur={erreur} />

        <BoutonAuth type="submit" chargement={chargement} texteChargement="Création…" className="mt-8">
          Créer mon compte
        </BoutonAuth>

        <Link href="/connexion" className="mt-4 text-center text-sm font-bold text-[var(--auth-accent)] underline-offset-2 hover:underline">
          Déjà un compte ? Se connecter
        </Link>
      </form>
    </CadreAuth>
  );
}
