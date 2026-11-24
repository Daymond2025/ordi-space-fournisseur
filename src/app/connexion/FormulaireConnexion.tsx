"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/lib/api";
import { CadreAuth, salutation } from "@/components/auth/kit/CadreAuth";
import { ChampFlottant, IconeTelephone } from "@/components/auth/kit/ChampFlottant";
import { BadgeSecurite, BoutonAuth, MessageErreur } from "@/components/auth/kit/BoutonAuth";
import type { HumeurMascotte } from "@/components/auth/kit/MascotteVivante";
import { THEME_AUTH } from "@/components/auth/kit/themeAuth";

/**
 * Connexion par numéro + OTP WhatsApp — même mécanisme que le Client. Un
 * numéro inconnu mène à l'inscription. Les comptes créés par e-mail/mot de
 * passe restent joignables via "Se connecter avec e-mail" (/connexion/email).
 */
export function FormulaireConnexion() {
  const { user, pret, demanderOtp } = useAuth();
  const router = useRouter();
  const r = THEME_AUTH.repliques;

  const [telephone, setTelephone] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [compteurErreurs, setCompteurErreurs] = useState(0);
  const [chargement, setChargement] = useState(false);
  const [focus, setFocus] = useState(false);
  const [accueil, setAccueil] = useState(true);
  const numeroValide = telephone.replace(/\D/g, "").length >= 10;

  useEffect(() => {
    if (pret && user) router.replace("/");
  }, [pret, user, router]);

  useEffect(() => {
    const t = setTimeout(() => setAccueil(false), 2600);
    return () => clearTimeout(t);
  }, []);

  function signaler(message: string) {
    setErreur(message);
    setCompteurErreurs((n) => n + 1);
    navigator.vibrate?.(120);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setErreur(null);

    if (!telephone.trim()) {
      signaler("Entre ton numéro whatsapp.");
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
      signaler(e instanceof ApiRequestError ? e.message : "Impossible de se connecter. Vérifiez votre connexion internet.");
    } finally {
      setChargement(false);
    }
  }

  let humeur: HumeurMascotte = "repos";
  let bulle = r.repos;
  if (erreur) {
    humeur = "erreur";
    bulle = r.erreur;
  } else if (focus) {
    humeur = "saisie";
    bulle = numeroValide ? r.telephoneOk : r.telephone;
  } else if (accueil) {
    humeur = "salut";
    bulle = `${salutation()} ! ${r.salut}`;
  }

  return (
    <CadreAuth humeur={humeur} bulle={bulle} declencheur={compteurErreurs}>
      <form onSubmit={onSubmit} className="flex flex-1 flex-col" noValidate>
        <h2 className="text-2xl font-black text-slate-900">Connexion</h2>
        <p className="mt-1.5 text-sm text-slate-500">Entre ton numéro WhatsApp : on t&apos;envoie un code.</p>

        <div className="mt-7">
          <ChampFlottant
            type="tel"
            label="Numéro WhatsApp"
            value={telephone}
            onChange={(v) => {
              setTelephone(v);
              setErreur(null);
            }}
            icone={<IconeTelephone />}
            indicatif
            valide={numeroValide}
            enErreur={Boolean(erreur)}
            declencheurErreur={compteurErreurs}
            autoComplete="tel-national"
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
          />
        </div>

        <MessageErreur erreur={erreur} />

        <div className="min-h-6 flex-1" />

        <BoutonAuth type="submit" chargement={chargement} texteChargement="Envoi du code…" className="mt-8">
          Recevoir mon code
        </BoutonAuth>

        <Link href="/connexion/email" className="mt-4 text-center text-sm font-bold text-[var(--auth-accent)] underline-offset-2 hover:underline">
          Se connecter avec e-mail et mot de passe
        </Link>

        <BadgeSecurite texte={THEME_AUTH.badge} />
      </form>
    </CadreAuth>
  );
}
