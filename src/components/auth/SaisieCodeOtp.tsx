"use client";

import { useRef } from "react";

type Props = {
  longueur: number;
  valeur: string;
  onChange: (valeur: string) => void;
};

export function SaisieCodeOtp({ longueur, valeur, onChange }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chiffres = Array.from({ length: longueur }, (_, i) => valeur[i] ?? "");

  function definirChiffre(index: number, brut: string) {
    const chiffre = brut.replace(/\D/g, "").slice(-1);
    const suivant = chiffres.slice();
    suivant[index] = chiffre;
    onChange(suivant.join("").slice(0, longueur));

    if (chiffre && index < longueur - 1) {
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
    onChange(colle);
    refs.current[Math.min(colle.length, longueur - 1)]?.focus();
  }

  return (
    <div className="flex justify-center gap-2.5">
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
          maxLength={1}
          className="h-12 w-11 rounded-2xl border border-brand-line text-center text-lg font-bold text-brand-ink outline-none focus:border-[color:var(--brand-blue-end)]"
        />
      ))}
    </div>
  );
}
