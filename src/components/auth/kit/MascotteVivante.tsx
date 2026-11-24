"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { THEME_AUTH } from "./themeAuth";

export type HumeurMascotte = "salut" | "repos" | "saisie" | "mdp" | "erreur" | "succes" | "code";

type Props = {
  humeur: HumeurMascotte;
  /** Texte de la bulle de dialogue (vide : pas de bulle). */
  bulle?: string;
  /** Change à chaque nouvelle erreur pour rejouer l'animation « secoue ». */
  declencheur?: number;
  /** Classe de taille de l'image (ex. "h-40 w-40"). */
  taille?: string;
  /** Élément propre à l'app, derrière la mascotte (engrenage, radar, logo…). */
  accessoire?: ReactNode;
};

// Une seule image de la mascotte : ses « expressions » passent par le mouvement.
const POSE: Record<HumeurMascotte, string> = {
  salut: "rotate(0deg)",
  repos: "rotate(0deg)",
  // Se penche vers le champ en cours de saisie.
  saisie: "rotate(-8deg) translateX(-6px)",
  // Se baisse et se cache à moitié derrière la carte : « je ne regarde pas ».
  mdp: "translateY(78px) rotate(-16deg) scale(0.9)",
  erreur: "rotate(0deg)",
  succes: "rotate(0deg)",
  code: "rotate(6deg)",
};

const REACTION: Partial<Record<HumeurMascotte, string>> = {
  salut: "animate-mascotte-salut",
  erreur: "animate-mascotte-secoue",
  succes: "animate-mascotte-saute",
};

/**
 * Mascotte des écrans de connexion/inscription : flotte (ou « roule » selon
 * l'app), s'incline avec la souris ou en penchant le téléphone, réagit à
 * chaque étape et parle dans une bulle.
 */
export function MascotteVivante({ humeur, bulle, declencheur = 0, taille = "h-36 w-36", accessoire }: Props) {
  const [inclinaison, setInclinaison] = useState({ x: 0, y: 0 });
  const cadre = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const appliquer = (x: number, y: number) => {
      if (cadre.current !== null) return;
      cadre.current = requestAnimationFrame(() => {
        cadre.current = null;
        setInclinaison({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
      });
    };

    const surSouris = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      appliquer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    // Téléphone penché (Android ; sur iPhone l'accès demande une autorisation, on s'en passe).
    const surOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      appliquer(e.gamma / 30, (e.beta - 45) / 30);
    };

    window.addEventListener("pointermove", surSouris);
    window.addEventListener("deviceorientation", surOrientation);
    return () => {
      window.removeEventListener("pointermove", surSouris);
      window.removeEventListener("deviceorientation", surOrientation);
      if (cadre.current !== null) cancelAnimationFrame(cadre.current);
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center [perspective:800px]">
      {bulle ? (
        <div
          key={bulle}
          className="animate-bulle-pop relative z-10 mb-3 max-w-[260px] rounded-2xl bg-white px-4 py-2.5 text-center text-sm font-bold text-slate-800 shadow-[0_12px_30px_rgba(0,30,90,0.25)]"
          role="status"
          aria-live="polite"
          // La salutation dépend de l'heure : elle peut différer entre serveur et navigateur.
          suppressHydrationWarning
        >
          {bulle}
          <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white" />
        </div>
      ) : null}

      <div className="relative">
        {accessoire ? <div className="pointer-events-none absolute inset-0 flex items-center justify-center">{accessoire}</div> : null}
        <div
          className="relative transition-transform duration-300 ease-out"
          style={{ transform: `rotateY(${inclinaison.x * 14}deg) rotateX(${-inclinaison.y * 10}deg)` }}
        >
          <div className={THEME_AUTH.posture === "roule" ? "animate-mascotte-roule" : "animate-mascotte-flotte"}>
            <div key={`${humeur}-${declencheur}`} className={REACTION[humeur] ?? ""}>
              <Image
                src="/images/mascotte.png"
                alt="Mascotte Ordi'Space"
                width={275}
                height={274}
                priority
                className={`${taille} object-contain drop-shadow-[0_18px_25px_rgba(0,30,90,0.35)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]`}
                style={{ transform: POSE[humeur] }}
              />
            </div>
          </div>
        </div>
      </div>

      <span aria-hidden className="animate-ombre-respire mt-1 h-3 w-24 rounded-[50%] bg-slate-900/40 blur-[3px]" />
    </div>
  );
}
