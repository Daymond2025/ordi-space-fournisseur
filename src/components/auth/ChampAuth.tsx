"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

type Props = {
  type: "email" | "password" | "text" | "tel";
  value: string;
  onChange: (valeur: string) => void;
  placeholder: string;
  erreur?: string;
  autoFocus?: boolean;
  autoComplete?: string;
};

/**
 * Champ email/mot de passe des écrans d'authentification — même gabarit
 * visuel que sur les autres apps (Coordinateur, Livreur, App_Mobile) : boîte
 * arrondie h-14, bordure brand-line. Bascule œil ouvert/fermé pour le mot de
 * passe.
 */
export function ChampAuth({ type, value, onChange, placeholder, erreur, autoFocus, autoComplete }: Props) {
  const [visible, setVisible] = useState(false);
  const estMotDePasse = type === "password";

  return (
    <div>
      <div
        className={`flex h-14 items-center gap-2.5 rounded-2xl border bg-white px-4 ${
          erreur ? "border-rose-400" : "border-brand-line"
        }`}
      >
        <input
          type={estMotDePasse && !visible ? "password" : "text"}
          inputMode={type === "email" ? "email" : type === "tel" ? "tel" : undefined}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent text-sm text-brand-ink outline-none placeholder:text-brand-muted"
        />
        {estMotDePasse ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="shrink-0 text-brand-muted"
            aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {visible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        ) : null}
      </div>
      {erreur ? <p className="mt-1.5 text-xs text-rose-500">{erreur}</p> : null}
    </div>
  );
}
