import type { CSSProperties } from "react";

type Variante = "total" | "booster" | "indisponible";

const CONFIG: Record<Variante, { cercleBg: string; chiffreStyle: CSSProperties; labelColor: string }> = {
  total: {
    cercleBg: "bg-blue-50",
    chiffreStyle: {
      backgroundImage: "linear-gradient(90deg, #1d63e0 0%, #38bdf8 100%)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    },
    labelColor: "rgba(29, 99, 224, 1)",
  },
  booster: {
    cercleBg: "bg-green-50",
    chiffreStyle: { color: "rgba(33, 127, 0, 1)" },
    labelColor: "rgba(33, 127, 0, 1)",
  },
  indisponible: {
    cercleBg: "bg-rose-50",
    chiffreStyle: { color: "rgba(255, 0, 0, 1)" },
    labelColor: "rgba(255, 0, 0, 1)",
  },
};

/** Carte de stat de l'écran "Mes produits" — même structure que Cordinateur_App_Web/CarteStatistiqueCatalogue.tsx, palette Fournisseur. */
export function CarteStatistiqueCatalogue({ valeur, label, variante }: { valeur: number; label: string; variante: Variante }) {
  const config = CONFIG[variante];

  return (
    <div
      className="flex h-[115px] w-[115px] flex-col items-center justify-center gap-2 rounded-[22px] bg-white px-2 text-center"
      style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-full ${config.cercleBg}`}>
        <span className="text-base font-extrabold leading-none" style={config.chiffreStyle}>
          {valeur}
        </span>
      </span>
      <span className="text-[11px] font-extrabold leading-none" style={{ color: config.labelColor }}>
        {label}
      </span>
    </div>
  );
}
