"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/lib/api";
import { CadreAuth, salutation } from "@/components/auth/kit/CadreAuth";
import { ChampFlottant, IconeCadenas, IconeEnveloppe } from "@/components/auth/kit/ChampFlottant";
import { BadgeSecurite, BoutonAuth, MessageErreur } from "@/components/auth/kit/BoutonAuth";
import type { HumeurMascotte } from "@/components/auth/kit/MascotteVivante";
import { THEME_AUTH } from "@/components/auth/kit/themeAuth";

const FORMAT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Connexion par e-mail + mot de passe — repli pour les comptes créés avant
 * le passage au téléphone+OTP (voir /connexion, désormais l'écran
 * principal). Le Fournisseur n'a pas de 2FA (roles_2fa_obligatoire() ne
 * liste que Coordinateur/Admin côté backend).
 */
export function EcranConnexionEmail() {
  const { user, pret, login } = useAuth();
  const router = useRouter();
  const r = THEME_AUTH.repliques;

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [compteurErreurs, setCompteurErreurs] = useState(0);
  const [chargement, setChargement] = useState(false);
  const [focus, setFocus] = useState<"email" | "mdp" | null>(null);
  const [accueil, setAccueil] = useState(true);
  const [tentative, setTentative] = useState(false);
  const emailValide = FORMAT_EMAIL.test(email.trim());
  const succes = pret && Boolean(user) && tentative;

  useEffect(() => {
    if (!pret || !user) return;
    if (!tentative) {
      router.replace("/");
      return;
    }
    const t = setTimeout(() => router.replace("/"), 1600);
    return () => clearTimeout(t);
  }, [pret, user, tentative, router]);

  useEffect(() => {
    const t = setTimeout(() => setAccueil(false), 2600);
    return () => clearTimeout(t);
  }, []);

  function signaler(message: string) {
    setErreur(message);
    setCompteurErreurs((n) => n + 1);
    navigator.vibrate?.(120);
  }

  async function onSoumettreConnexion(event: FormEvent) {
    event.preventDefault();
    setErreur(null);

    if (!email.trim() || !motDePasse) {
      signaler("Entre ton e-mail et ton mot de passe.");
      return;
    }

    setChargement(true);
    setTentative(true);
    try {
      await login(email.trim(), motDePasse);
    } catch (e) {
      setTentative(false);
      signaler(e instanceof ApiRequestError ? e.message : "Impossible de se connecter. Vérifiez votre connexion internet.");
    } finally {
      setChargement(false);
    }
  }

  let humeur: HumeurMascotte = "repos";
  let bulle = r.repos;
  if (succes) {
    humeur = "succes";
    bulle = r.succes;
  } else if (erreur) {
    humeur = "erreur";
    bulle = r.erreur;
  } else if (focus === "mdp") {
    humeur = "mdp";
    bulle = r.mdp;
  } else if (focus === "email") {
    humeur = "saisie";
    bulle = emailValide ? r.emailOk : r.email;
  } else if (accueil) {
    humeur = "salut";
    bulle = `${salutation()} ! ${r.salut}`;
  }

  return (
    <CadreAuth humeur={humeur} bulle={bulle} declencheur={compteurErreurs} succes={succes}>
      <form onSubmit={onSoumettreConnexion} className="flex flex-1 flex-col" noValidate>
        <h2 className="text-2xl font-black text-slate-900">Connexion</h2>
        <p className="mt-1.5 text-sm text-slate-500">Entre tes identifiants pour accéder à ton espace.</p>

        <div className="mt-7 flex flex-col gap-4">
          <ChampFlottant
            type="email"
            label="Adresse e-mail"
            value={email}
            onChange={(v) => {
              setEmail(v);
              setErreur(null);
            }}
            icone={<IconeEnveloppe />}
            valide={emailValide}
            enErreur={Boolean(erreur) && !email.trim()}
            declencheurErreur={compteurErreurs}
            autoComplete="email"
            onFocus={() => setFocus("email")}
            onBlur={() => setFocus(null)}
          />
          <ChampFlottant
            type="password"
            label="Mot de passe"
            value={motDePasse}
            onChange={(v) => {
              setMotDePasse(v);
              setErreur(null);
            }}
            icone={<IconeCadenas />}
            enErreur={Boolean(erreur)}
            declencheurErreur={compteurErreurs}
            autoComplete="current-password"
            onFocus={() => setFocus("mdp")}
            onBlur={() => setFocus(null)}
          />
        </div>

        <MessageErreur erreur={erreur} />

        <Link href="/mot-de-passe-oublie" className="mt-3 self-end text-xs font-bold text-[var(--auth-accent)] underline-offset-2 hover:underline">
          Mot de passe oublié ?
        </Link>

        <div className="min-h-6 flex-1" />

        <BoutonAuth type="submit" chargement={chargement} succes={succes} className="mt-8">
          Se connecter
        </BoutonAuth>

        <Link href="/connexion" className="mt-4 text-center text-sm font-bold text-[var(--auth-accent)] underline-offset-2 hover:underline">
          Se connecter par numéro WhatsApp
        </Link>

        <BadgeSecurite texte="Connexion sécurisée" />
      </form>
    </CadreAuth>
  );
}
