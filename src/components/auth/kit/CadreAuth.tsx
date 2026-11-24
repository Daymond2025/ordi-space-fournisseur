"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { MascotteVivante, type HumeurMascotte } from "./MascotteVivante";
import { Confettis, FondAnime } from "./DecorAuth";
import { THEME_AUTH } from "./themeAuth";

type Props = {
  humeur: HumeurMascotte;
  bulle: string;
  declencheur?: number;
  succes?: boolean;
  children: ReactNode;
};

/** Salutation selon l'heure du téléphone. */
export function salutation(): string {
  const heure = new Date().getHours();
  if (heure < 5 || heure >= 18) return "Bonsoir";
  if (heure < 12) return "Bonjour";
  return "Bon après-midi";
}

/**
 * Cadre commun des écrans de connexion/inscription : fond animé propre à
 * l'app, mascotte vivante (avec son accessoire), carte en verre dépoli ;
 * deux colonnes sur ordinateur. Couleurs : THEME_AUTH (themeAuth.ts).
 */
export function CadreAuth({ humeur, bulle, declencheur = 0, succes = false, children }: Props) {
  const t = THEME_AUTH;
  const variables = {
    "--auth-accent": t.accent,
    "--auth-accent-fin": t.accentFin,
    "--auth-accent-halo": t.accentHalo,
    "--auth-accent-ombre": t.accentOmbre,
  } as CSSProperties;

  return (
    <main className="relative min-h-dvh overflow-hidden text-slate-900" style={variables}>
      <FondAnime />
      {succes ? <Confettis /> : null}

      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col md:flex-row md:items-center md:gap-12 md:px-10">
        <section className="flex flex-col items-center px-6 pb-4 pt-8 text-center text-white md:flex-1 md:pb-0 md:pt-0">
          <p className="hidden text-xs font-bold uppercase tracking-[0.3em] text-white/70 md:block">Ordi&apos;Space</p>
          <h1 className="hidden text-4xl font-black leading-tight md:mt-2 md:block">Espace {t.espace}</h1>
          <p className="hidden max-w-sm text-sm text-white/80 md:mt-3 md:block">{t.slogan}</p>

          <div className="md:mt-10">
            <MascotteVivante
              humeur={humeur}
              bulle={bulle}
              declencheur={declencheur}
              taille="h-36 w-36 md:h-64 md:w-64"
              accessoire={<Accessoire />}
            />
          </div>
        </section>

        <section className="animate-carte-monte relative flex flex-1 flex-col rounded-t-[2.25rem] bg-white px-6 pb-8 pt-6 shadow-[0_-20px_60px_rgba(0,30,100,0.25)] md:w-[430px] md:flex-none md:rounded-[2.25rem] md:py-9 md:shadow-[0_30px_80px_rgba(0,30,100,0.35)]">
          <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-slate-300/70 md:hidden" />
          {children}
        </section>
      </div>
    </main>
  );
}

/** Élément propre à l'app, derrière la mascotte. */
function Accessoire() {
  const t = THEME_AUTH;
  switch (t.accessoire) {
    case "engrenage":
      return (
        <svg viewBox="0 0 100 100" className="animate-tourne-lent h-[130%] w-[130%] text-white/25" fill="currentColor" aria-hidden>
          <path d="M43 4h14l2 11a36 36 0 0 1 9 4l9-7 10 10-7 9a36 36 0 0 1 4 9l11 2v14l-11 2a36 36 0 0 1-4 9l7 9-10 10-9-7a36 36 0 0 1-9 4l-2 11H43l-2-11a36 36 0 0 1-9-4l-9 7-10-10 7-9a36 36 0 0 1-4-9L5 57V43l11-2a36 36 0 0 1 4-9l-7-9 10-10 9 7a36 36 0 0 1 9-4l2-11zm7 30a16 16 0 1 0 0 32 16 16 0 0 0 0-32z" />
        </svg>
      );
    case "radar":
      return (
        <span className="relative flex aspect-square w-[125%] items-center justify-center" aria-hidden>
          <span className="animate-radar-local absolute h-full w-full rounded-full border-2 border-cyan-200/60" />
          <span className="animate-radar-local absolute h-full w-full rounded-full border-2 border-cyan-200/60 [animation-delay:1.2s]" />
        </span>
      );
    case "logo":
      return t.logo ? (
        <span className="animate-balance absolute -right-6 -top-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-xl md:h-20 md:w-20" aria-hidden>
          <Image src={t.logo} alt="" width={120} height={120} className="h-full w-full object-contain" />
        </span>
      ) : null;
    case "etoile":
      return (
        <span className="relative h-full w-full" aria-hidden>
          <span className="animate-scintille absolute -left-3 top-3 text-2xl text-amber-300">✦</span>
          <span className="animate-scintille absolute -right-2 top-10 text-lg text-white [animation-delay:0.7s]">✦</span>
          <span className="animate-scintille absolute bottom-6 -left-5 text-base text-amber-200 [animation-delay:1.3s]">✦</span>
        </span>
      );
    case "coeur":
      return (
        <span className="relative h-full w-full" aria-hidden>
          <span className="animate-balance absolute -right-4 top-4 text-2xl text-pink-300">♥</span>
          <span className="animate-balance absolute -left-4 bottom-10 text-lg text-pink-200 [animation-delay:0.8s]">♥</span>
        </span>
      );
    case "colis":
      return (
        <span className="animate-balance absolute -right-7 bottom-6 text-4xl md:text-5xl" aria-hidden>
          📦
        </span>
      );
    case "casque":
      return (
        <span className="animate-balance absolute -left-7 bottom-8 text-4xl md:text-5xl" aria-hidden>
          🛵
        </span>
      );
    default:
      return null;
  }
}
