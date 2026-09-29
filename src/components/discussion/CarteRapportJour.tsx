import { WarningIcon } from "@/components/icons";
import type { DonneesRapport } from "@/lib/types";

const LIGNES: {
  cle: keyof Omit<DonneesRapport, "date">;
  label: string;
  sousTexte?: string;
  degrade: string;
  bordure: string;
  texte: string;
}[] = [
  {
    cle: "envoyees",
    label: "Commandes envoyées",
    degrade: "linear-gradient(180deg, #E8F2FF 0%, #D3E8FF 100%)",
    bordure: "border-[color:var(--brand-blue-end)]",
    texte: "text-[color:var(--brand-blue-end)]",
  },
  {
    cle: "validees",
    label: "Commandes validées",
    degrade: "linear-gradient(180deg, #E7F9EE 0%, #CDF2DB 100%)",
    bordure: "border-green-500",
    texte: "text-green-600",
  },
  {
    cle: "reportees",
    label: "Commandes reportés",
    degrade: "linear-gradient(180deg, #FFF3E3 0%, #FFE4BF 100%)",
    bordure: "border-orange-400",
    texte: "text-orange-500",
  },
  {
    cle: "non_livre",
    label: "Commandes Non livré",
    sousTexte: "Livraison prévue demain",
    degrade: "linear-gradient(180deg, #EEF1F6 0%, #DCE2EC 100%)",
    bordure: "border-slate-400",
    texte: "text-slate-500",
  },
  {
    cle: "annulees",
    label: "Commandes annulées",
    degrade: "linear-gradient(180deg, #FDE8E8 0%, #FBD0D0 100%)",
    bordure: "border-rose-400",
    texte: "text-rose-500",
  },
];

function formaterDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Rapport quotidien enrichi — copié de
 * Cordinateur_App_Web/src/components/discussion/CarteRapportJour.tsx (même
 * écran d'origine).
 */
export function CarteRapportJour({ donnees }: { donnees: DonneesRapport }) {
  return (
    <div className="mx-4 overflow-hidden rounded-[18px] bg-white">
      <div className="bg-gradient-espace px-4 py-3 text-center text-white">
        <p className="text-sm font-extrabold uppercase tracking-wide">Rapport du jour</p>
        <p className="text-xs capitalize text-white/85">{formaterDate(donnees.date)}</p>
      </div>

      <div className="space-y-2.5 px-5 py-4">
        {LIGNES.map(({ cle, label, sousTexte, degrade, bordure, texte }) => (
          <div key={cle} className="flex h-[43px] items-center gap-2.5 rounded-[5px] bg-[#F6F8FE] px-2">
            <span
              className={`flex h-[29px] w-[31px] shrink-0 items-center justify-center rounded-[7px] border ${bordure} text-sm font-extrabold ${texte}`}
              style={{ background: degrade }}
            >
              {donnees[cle]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-brand-ink">{label}</span>
              {sousTexte ? (
                <span className="block truncate text-[11px] font-semibold text-[color:var(--brand-blue-end)]">{sousTexte}</span>
              ) : null}
            </span>
          </div>
        ))}

        <div className="flex items-start gap-2 rounded-xl bg-orange-50 px-3 py-2.5">
          <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
          <p className="text-xs text-orange-800">
            Retrouvez les motifs et plus de détails sous chaque commande. Contactez vos clients pour ne pas les perdre.
          </p>
        </div>
      </div>
    </div>
  );
}
