import type { DonneesPropositionPrix } from "@/lib/types";

function formaterPrix(valeur: number): string {
  return `${Math.round(valeur).toLocaleString("fr-FR").replace(/ |,/g, " ")} CFA`;
}

/**
 * Instantané {prix_liste, prix_propose} publié au démarrage d'une
 * négociation de prix par le coordinateur — le fournisseur répond via
 * repondreNegociationPrix (voir MessageController côté backend), pas depuis
 * cette carte en lecture seule. Copiée de
 * Cordinateur_App_Web/src/components/discussion/CartePropositionPrix.tsx.
 */
export function CartePropositionPrix({ donnees }: { donnees: DonneesPropositionPrix }) {
  return (
    <div className="mx-4 overflow-hidden rounded-[18px] bg-white">
      <div className="bg-gradient-espace px-4 py-3 text-center text-white">
        <p className="text-sm font-extrabold uppercase tracking-wide">Négociation de prix</p>
      </div>

      <div className="space-y-2.5 px-5 py-4">
        <div className="rounded-[9px] bg-[#F6F8FE] px-3.5 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">Prix partenaire affiché</p>
          <p className="text-base font-extrabold text-[color:var(--brand-blue-end)]">{formaterPrix(donnees.prix_liste)}</p>
        </div>
        <div className="rounded-[9px] bg-green-50 px-3.5 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">Proposition du coordinateur</p>
          <p className="text-base font-extrabold text-green-700">{formaterPrix(donnees.prix_propose)}</p>
        </div>
      </div>
    </div>
  );
}
