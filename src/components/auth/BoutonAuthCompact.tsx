"use client";

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  chargement?: boolean;
  texteChargement?: string;
};

/**
 * Bouton "connexion" / "Valider" des écrans d'authentification — dimensions
 * et rayon repris d'App_Mobile (234×43, radius 11px) pour rester visuellement
 * identique aux autres apps.
 */
export function BoutonAuthCompact({
  chargement,
  texteChargement = "Veuillez patienter…",
  children,
  disabled,
  className,
  ...rest
}: Props) {
  return (
    <button
      type="submit"
      disabled={disabled || chargement}
      className={`bg-gradient-brand-blue mx-auto flex h-[43px] w-[234px] items-center justify-center rounded-[11px] border-2 border-white/40 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-opacity disabled:opacity-60 ${className ?? ""}`}
      {...rest}
    >
      {chargement ? texteChargement : children}
    </button>
  );
}
