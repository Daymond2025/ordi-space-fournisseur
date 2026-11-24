"use client";

import type { CSSProperties, ReactNode } from "react";
import { THEME_AUTH } from "./themeAuth";

// Valeurs « pseudo-aléatoires » fixes : identiques côté serveur et navigateur
// (pas de Math.random(), qui casserait l'hydratation).
const POINTS = Array.from({ length: 16 }, (_, i) => ({
  gauche: (i * 37 + 11) % 100,
  taille: 2 + ((i * 7) % 4),
  duree: 9 + ((i * 5) % 9),
  delai: -((i * 13) % 17),
  rot: (i * 47) % 360,
}));

function Monteur({ children, i, taille }: { children: ReactNode; i: number; taille?: number }) {
  const p = POINTS[i];
  return (
    <span
      className="animate-particule absolute bottom-0"
      style={{ left: `${p.gauche}%`, animationDuration: `${p.duree + 4}s`, animationDelay: `${p.delai}s`, fontSize: taille }}
    >
      {children}
    </span>
  );
}

/** Décor propre à chaque app, par-dessus le fond dégradé. */
function DecorParticulier() {
  switch (THEME_AUTH.decor) {
    // Commercial : étincelles dorées qui scintillent en montant (ventes, réussite).
    case "etincelles":
      return (
        <>
          {POINTS.map((p, i) => (
            <Monteur key={i} i={i} taille={10 + (i % 3) * 5}>
              <span className={`animate-scintille block ${i % 3 === 0 ? "text-amber-300" : "text-white"}`} style={{ animationDelay: `${p.delai / 3}s` }}>
                ✦
              </span>
            </Monteur>
          ))}
        </>
      );
    // Fournisseur : colis qui montent en tournant.
    case "colis":
      return (
        <>
          {POINTS.slice(0, 12).map((p, i) => (
            <Monteur key={i} i={i}>
              <span className="animate-tourne-lent block" style={{ animationDuration: `${8 + (i % 5)}s` }}>
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-white/60" style={{ width: 14 + (i % 4) * 6, height: 14 + (i % 4) * 6 }} fill="none" stroke="currentColor" strokeWidth={1.6}>
                  <path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5v-9z" />
                  <path d="M3 7.5L12 12l9-4.5M12 12v9" />
                </svg>
              </span>
            </Monteur>
          ))}
        </>
      );
    // Livreur : traits de vitesse + route en pointillés qui défile en bas.
    case "route":
      return (
        <>
          {POINTS.slice(0, 9).map((p, i) => (
            <span
              key={i}
              className="animate-vitesse absolute h-[2px] rounded-full bg-white/40"
              style={{ top: `${8 + i * 9}%`, width: 40 + (i % 4) * 30, animationDuration: `${1.6 + (i % 4) * 0.5}s`, animationDelay: `${p.delai / 4}s` }}
            />
          ))}
          <div className="absolute inset-x-0 top-[222px] h-9 bg-slate-900/25 md:bottom-0 md:top-auto md:h-16">
            <div className="animate-route absolute top-1/2 h-1.5 w-[200%] -translate-y-1/2 [background:repeating-linear-gradient(90deg,rgba(255,255,255,0.85)_0_34px,transparent_34px_68px)]" />
          </div>
        </>
      );
    // Partenaire : étiquettes de prix qui flottent (vitrine, boutique).
    case "etiquettes":
      return (
        <>
          {POINTS.slice(0, 11).map((p, i) => (
            <Monteur key={i} i={i}>
              <span className="animate-balance block" style={{ animationDelay: `${p.delai / 5}s` }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={i % 3 === 0 ? "text-amber-200/80" : "text-white/60"} style={{ width: 16 + (i % 3) * 7, height: 16 + (i % 3) * 7 }}>
                  <path d="M3 12V4h8l10 10-8 8L3 12z" />
                  <circle cx="7.5" cy="8.5" r="1.5" />
                </svg>
              </span>
            </Monteur>
          ))}
        </>
      );
    // Maintenancier : grands engrenages qui tournent lentement.
    case "engrenages":
      return (
        <>
          <Engrenage className="animate-tourne-lent absolute -left-16 top-10 h-56 w-56 text-white/10" />
          <Engrenage className="animate-tourne-inverse absolute -right-10 top-40 h-40 w-40 text-white/15" />
          <Engrenage className="animate-tourne-lent absolute bottom-24 left-1/3 h-28 w-28 text-white/10" />
          {POINTS.slice(0, 8).map((_, i) => (
            <Monteur key={i} i={i}>
              <span className="block h-1.5 w-1.5 rounded-full bg-cyan-200/80 shadow-[0_0_6px_2px_rgba(165,243,252,0.6)]" />
            </Monteur>
          ))}
        </>
      );
    // Client : bulles douces et cœurs qui montent.
    case "bulles":
      return (
        <>
          {POINTS.map((p, i) => (
            <Monteur key={i} i={i} taille={11 + (i % 3) * 5}>
              {i % 3 === 0 ? (
                <span className="block text-pink-200/90">♥</span>
              ) : (
                <span className="block rounded-full border border-white/50 bg-white/10" style={{ width: 8 + (i % 4) * 6, height: 8 + (i % 4) * 6 }} />
              )}
            </Monteur>
          ))}
        </>
      );
    // Admin : radar central (ondes) + grille de données.
    case "radar":
      return (
        <>
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:44px_44px]" />
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="animate-radar absolute left-1/2 top-1/2 h-[60vmax] w-[60vmax] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/40"
              style={{ animationDelay: `${i * 1.6}s` }}
            />
          ))}
          {POINTS.slice(0, 10).map((p, i) => (
            <span
              key={i}
              className="animate-scintille absolute h-1.5 w-1.5 rounded-full bg-cyan-200"
              style={{ left: `${p.gauche}%`, top: `${(p.gauche * 7) % 100}%`, animationDelay: `${p.delai / 4}s` }}
            />
          ))}
        </>
      );
    // Par défaut (constellation) : points lumineux.
    default:
      return (
        <>
          {POINTS.map((p, i) => (
            <Monteur key={i} i={i}>
              <span className="block rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.6)]" style={{ width: p.taille, height: p.taille }} />
            </Monteur>
          ))}
        </>
      );
  }
}

function Engrenage({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
      <path d="M43 4h14l2 11a36 36 0 0 1 9 4l9-7 10 10-7 9a36 36 0 0 1 4 9l11 2v14l-11 2a36 36 0 0 1-4 9l7 9-10 10-9-7a36 36 0 0 1-9 4l-2 11H43l-2-11a36 36 0 0 1-9-4l-9 7-10-10 7-9a36 36 0 0 1-4-9L5 57V43l11-2a36 36 0 0 1 4-9l-7-9 10-10 9 7a36 36 0 0 1 9-4l2-11zm7 30a16 16 0 1 0 0 32 16 16 0 0 0 0-32z" />
    </svg>
  );
}

/** Fond animé : dégradé de l'app, halos qui dérivent, décor particulier. */
export function FondAnime() {
  const [h1, h2, h3] = THEME_AUTH.halos;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: THEME_AUTH.degrade }} />
      <div className="animate-aurore absolute -left-1/4 -top-1/4 h-[70%] w-[80%] rounded-full blur-3xl" style={{ background: h1 }} />
      <div className="animate-aurore absolute -right-1/4 top-1/4 h-[60%] w-[70%] rounded-full blur-3xl [animation-delay:-6s]" style={{ background: h2 }} />
      <div className="animate-aurore absolute -bottom-1/4 left-1/4 h-[55%] w-[60%] rounded-full blur-3xl [animation-delay:-12s]" style={{ background: h3 }} />
      <DecorParticulier />
    </div>
  );
}

const CONFETTIS = Array.from({ length: 44 }, (_, i) => ({
  gauche: (i * 23 + 7) % 100,
  dx: ((i * 29) % 120) - 60,
  rot: 360 + ((i * 47) % 540),
  duree: 1.4 + ((i * 3) % 10) / 10,
  delai: ((i * 7) % 5) / 20,
  rond: i % 3 === 0,
}));

/** Pluie de confettis aux couleurs de l'app (connexion réussie). */
export function Confettis() {
  const couleurs = THEME_AUTH.confettis;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {CONFETTIS.map((c, i) => (
        <span
          key={i}
          className={`animate-confetti absolute -top-4 h-3 w-2 ${c.rond ? "rounded-full" : "rounded-[2px]"}`}
          style={
            {
              left: `${c.gauche}%`,
              background: couleurs[i % couleurs.length],
              animationDelay: `${c.delai}s`,
              "--dx": `${c.dx}px`,
              "--rot": `${c.rot}deg`,
              "--duree": `${c.duree}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
