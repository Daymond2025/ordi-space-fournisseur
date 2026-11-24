"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

type Props = {
  type: "email" | "password" | "tel" | "text";
  label: string;
  value: string;
  onChange: (valeur: string) => void;
  icone: ReactNode;
  /** Coche verte à droite (ex. e-mail ou numéro au bon format). */
  valide?: boolean;
  enErreur?: boolean;
  /** Change à chaque erreur : rejoue l'animation « secoue ». */
  declencheurErreur?: number;
  /** Indicatif affiché devant le numéro (drapeau ivoirien + « +225 »). */
  indicatif?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
};

/**
 * Champ des écrans de connexion/inscription : libellé qui remonte quand on
 * écrit, icône, indicatif +225, coche de validation, œil pour le mot de
 * passe et alerte « Majuscules activées ». Couleur d'accent : --auth-accent.
 */
export function ChampFlottant({
  type,
  label,
  value,
  onChange,
  icone,
  valide,
  enErreur,
  declencheurErreur = 0,
  indicatif,
  autoComplete,
  autoFocus,
  onFocus,
  onBlur,
}: Props) {
  const id = useId();
  const [focus, setFocus] = useState(false);
  const [visible, setVisible] = useState(false);
  const [majuscules, setMajuscules] = useState(false);
  const estMotDePasse = type === "password";
  const flotte = focus || value.length > 0 || Boolean(indicatif);

  function verifierMajuscules(e: KeyboardEvent<HTMLInputElement>) {
    if (estMotDePasse) setMajuscules(e.getModifierState("CapsLock"));
  }

  return (
    <div>
      <div
        key={enErreur ? `e-${declencheurErreur}` : "ok"}
        className={`relative flex h-[58px] items-center gap-3 rounded-2xl border-2 bg-white/90 px-4 backdrop-blur transition-all duration-300 ${
          enErreur
            ? "animate-champ-secoue border-rose-400 shadow-[0_0_0_4px_rgba(244,63,94,0.12)]"
            : focus
              ? "border-[var(--auth-accent)] shadow-[0_0_0_4px_var(--auth-accent-halo)]"
              : "border-slate-200"
        }`}
      >
        <span className={`shrink-0 transition-colors ${focus ? "text-[var(--auth-accent)]" : "text-slate-400"}`}>{icone}</span>

        {indicatif ? (
          <span className="flex shrink-0 items-center gap-1.5 self-end pb-2">
            <span className="flex h-3.5 w-5 overflow-hidden rounded-[3px] shadow-sm">
              <span className="flex-1 bg-[#FF8200]" />
              <span className="flex-1 bg-white" />
              <span className="flex-1 bg-[#009E60]" />
            </span>
            <span className="text-[15px] font-semibold text-slate-700">+225</span>
          </span>
        ) : null}

        <div className="relative h-full min-w-0 flex-1">
          <label
            htmlFor={id}
            className={`pointer-events-none absolute left-0 transition-all duration-200 ${
              flotte ? "top-2 text-[11px] font-semibold text-[var(--auth-accent)]" : "top-1/2 -translate-y-1/2 text-sm text-slate-400"
            }`}
          >
            {label}
          </label>
          <input
            id={id}
            type={estMotDePasse && !visible ? "password" : type === "email" ? "email" : type === "tel" ? "tel" : "text"}
            inputMode={type === "email" ? "email" : type === "tel" ? "numeric" : undefined}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            autoCapitalize={type === "text" ? "words" : "none"}
            spellCheck={false}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={verifierMajuscules}
            onKeyUp={verifierMajuscules}
            onFocus={() => {
              setFocus(true);
              onFocus?.();
            }}
            onBlur={() => {
              setFocus(false);
              setMajuscules(false);
              onBlur?.();
            }}
            className="absolute inset-x-0 bottom-1.5 h-7 w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none"
          />
        </div>

        {valide && !estMotDePasse ? (
          <span className="animate-bulle-pop flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white" aria-label="Format valide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
        ) : null}

        {estMotDePasse ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="shrink-0 text-slate-400 transition-colors hover:text-[var(--auth-accent)]"
            aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
              {visible ? <path d="M3 3l18 18" /> : null}
            </svg>
          </button>
        ) : null}
      </div>

      {majuscules ? (
        <p className="animate-bulle-pop mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-600">
          <span aria-hidden>⇪</span> Majuscules activées
        </p>
      ) : null}
    </div>
  );
}

export function IconeEnveloppe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}

export function IconeCadenas() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="4" y="10" width="16" height="11" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function IconeTelephone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="6" y="2.5" width="12" height="19" rx="3" />
      <path d="M10.5 18.5h3" />
    </svg>
  );
}

export function IconePersonne() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

export function IconeBoutique() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M4 9l1.5-5h13L20 9" />
      <path d="M4 9h16v2a3 3 0 0 1-5.3 2A3 3 0 0 1 12 14a3 3 0 0 1-2.7-1A3 3 0 0 1 4 11V9z" />
      <path d="M5.5 14v6.5h13V14" />
    </svg>
  );
}
