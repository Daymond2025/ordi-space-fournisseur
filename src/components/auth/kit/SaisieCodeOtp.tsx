"use client";

import { useEffect, useRef } from "react";

type Props = {
  longueur: number;
  valeur: string;
  onChange: (valeur: string) => void;
  /** Appelé dès que le code est complet (saisi ou collé) : validation automatique. */
  onComplet?: (code: string) => void;
  /** Cases plus grandes, qui s'illuminent à chaque chiffre (écran de connexion). */
  moderne?: boolean;
  autoFocus?: boolean;
};

export function SaisieCodeOtp({ longueur, valeur, onChange, onComplet, moderne = false, autoFocus = false }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chiffres = Array.from({ length: longueur }, (_, i) => valeur[i] ?? "");

  // Code effacé (ex. code refusé) : on repart de la première case.
  useEffect(() => {
    if (moderne && valeur === "") refs.current[0]?.focus();
  }, [moderne, valeur]);

  function changer(code: string) {
    onChange(code);
    if (code.length === longueur) onComplet?.(code);
  }

  function definirChiffre(index: number, brut: string) {
    const nettoye = brut.replace(/\D/g, "");
    // Code complet proposé par le téléphone (autocomplete one-time-code) ou tapé d'un coup.
    if (nettoye.length > 1) {
      const code = nettoye.slice(0, longueur);
      changer(code);
      refs.current[Math.min(code.length, longueur - 1)]?.focus();
      return;
    }

    const suivant = chiffres.slice();
    suivant[index] = nettoye;
    changer(suivant.join("").slice(0, longueur));

    if (nettoye && index < longueur - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function onKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !chiffres[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function onPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const colle = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, longueur);
    if (!colle) return;
    event.preventDefault();
    changer(colle);
    refs.current[Math.min(colle.length, longueur - 1)]?.focus();
  }

  return (
    <div className={`flex justify-center ${moderne ? "gap-2" : "gap-2.5"}`}>
      {chiffres.map((chiffre, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={chiffre}
          onChange={(e) => definirChiffre(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          onPaste={onPaste}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && index === 0}
          aria-label={`Chiffre ${index + 1} sur ${longueur}`}
          maxLength={index === 0 ? longueur : 1}
          className={
            moderne
              ? `h-14 w-12 rounded-2xl border-2 text-center text-2xl font-extrabold text-slate-900 outline-none transition-colors focus:border-[var(--auth-accent)] focus:shadow-[0_0_0_4px_var(--auth-accent-halo)] ${
                  chiffre ? "animate-case-allume border-[var(--auth-accent)] bg-white" : "border-slate-200 bg-white"
                }`
              : "h-12 w-11 rounded-2xl border border-brand-line text-center text-lg font-bold text-brand-ink outline-none focus:border-[color:var(--brand-blue-end)]"
          }
        />
      ))}
    </div>
  );
}
