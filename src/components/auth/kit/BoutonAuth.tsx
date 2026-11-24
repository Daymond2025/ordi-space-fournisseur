"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Bouton principal des écrans de connexion : reflet animé, chargement, puis « Connecté ! ». */
export function BoutonAuth({
  children,
  chargement,
  succes,
  texteChargement = "Vérification…",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; chargement?: boolean; succes?: boolean; texteChargement?: string }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || chargement || succes}
      className={`group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-[15px] font-extrabold text-white shadow-[0_14px_30px_var(--auth-accent-ombre)] transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed ${
        succes ? "bg-emerald-500" : "bg-[linear-gradient(90deg,var(--auth-accent),var(--auth-accent-fin))] disabled:opacity-70"
      } ${className}`}
    >
      {!succes && !chargement ? (
        <span aria-hidden className="animate-reflet pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      ) : null}
      {succes ? (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="animate-bulle-pop h-5 w-5">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          Connecté !
        </>
      ) : chargement ? (
        <>
          <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-white/40 border-t-white" />
          {texteChargement}
        </>
      ) : (
        <>
          {children}
          <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
        </>
      )}
    </button>
  );
}

export function MessageErreur({ erreur }: { erreur: string | null }) {
  if (!erreur) return null;
  return (
    <p role="alert" className="animate-bulle-pop mt-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
      <span aria-hidden>⚠️</span>
      {erreur}
    </p>
  );
}

/** Bouton rond « retour » en haut de la carte. */
export function BoutonRetour({ onClick, label = "Retour" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}

/** Badge rassurant sous le bouton. */
export function BadgeSecurite({ texte }: { texte: string }) {
  return (
    <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] font-semibold text-slate-500">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-emerald-500">
        <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" />
        <path d="M8.5 12l2.5 2.5 4.5-4.5" />
      </svg>
      {texte}
    </p>
  );
}

/** Indicateur d'étapes (inscription : Numéro → Informations → Code). */
export function Etapes({ etapes, active }: { etapes: string[]; active: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label={`Étape ${active + 1} sur ${etapes.length}`}>
      {etapes.map((etape, i) => (
        <li key={etape} className="flex flex-1 flex-col gap-1.5">
          <span
            className={`h-1.5 rounded-full transition-colors duration-500 ${
              i <= active ? "bg-[linear-gradient(90deg,var(--auth-accent),var(--auth-accent-fin))]" : "bg-slate-200"
            }`}
          />
          <span className={`text-[10px] font-bold uppercase tracking-wide ${i === active ? "text-[var(--auth-accent)]" : i < active ? "text-slate-500" : "text-slate-300"}`}>
            {i < active ? "✓ " : ""}
            {etape}
          </span>
        </li>
      ))}
    </ol>
  );
}
