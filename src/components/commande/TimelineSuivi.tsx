import Image from "next/image";
import { BoxIcon, TruckIcon } from "@/components/icons";
import { COULEUR_TEXTE_STATUT, LIBELLES_STATUT } from "@/lib/statuts";
import type { SuiviEntree } from "@/lib/types";

function formaterDateHeure(iso: string): string {
  const date = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";

  return `Le ${date.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" })} à ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

/**
 * Icône + libellé narratif pour les 3 étapes couvertes par les images
 * fournies — les autres statuts gardent une icône/couleur génériques.
 */
function resoudreEtape(entree: SuiviEntree): { image: string | null; label: string | null; couleur: string } {
  if (entree.action === "commande_creee") {
    return { image: "/images/commande-passer.png", label: "Commande passée", couleur: "text-[color:var(--brand-blue-end)]" };
  }

  const statutApres = entree.donnees?.statut_apres;

  if (statutApres === "en_attente") {
    return { image: "/images/commande-mise-attente.png", label: "commande mise en attente", couleur: "text-fuchsia-600" };
  }

  if (statutApres === "en_livraison") {
    return { image: "/images/commande-en-cours.png", label: LIBELLES_STATUT.en_livraison, couleur: COULEUR_TEXTE_STATUT.en_livraison };
  }

  return {
    image: null,
    label: statutApres ? (LIBELLES_STATUT[statutApres] ?? statutApres) : null,
    couleur: statutApres ? (COULEUR_TEXTE_STATUT[statutApres] ?? "text-brand-muted") : "text-brand-muted",
  };
}

/**
 * Timeline verticale du suivi d'une commande — GET /commandes/{id}/suivi.
 * Copiée de Cordinateur_App_Web/src/components/commande/TimelineSuivi.tsx
 * (même écran d'origine). La dernière entrée (statut actuel) est grisée.
 */
export function TimelineSuivi({ entrees }: { entrees: SuiviEntree[] }) {
  if (entrees.length === 0) {
    return <p className="py-6 text-center text-sm text-brand-muted">Aucun événement pour l&apos;instant.</p>;
  }

  return (
    <div>
      {entrees.map((entree, index) => {
        const dernier = index === entrees.length - 1;
        const { image, label, couleur } = resoudreEtape(entree);
        const couleurEffective = dernier ? "text-brand-muted" : couleur;
        const Icone = image ? null : entree.donnees?.statut_apres === "livree" ? TruckIcon : BoxIcon;

        return (
          <div key={entree.id} className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              {image ? (
                <Image src={image} alt="" width={40} height={40} className={`h-10 w-10 object-contain ${dernier ? "opacity-40 grayscale" : ""}`} />
              ) : Icone ? (
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F7FA] ${couleurEffective}`}>
                  <Icone className="h-4 w-4" />
                </span>
              ) : null}
            </div>

            <div className="flex flex-col items-center pt-1">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dernier ? "bg-slate-400" : "bg-[color:var(--brand-blue-end)]"}`} />
              {!dernier ? <span className={`my-1 w-px flex-1 ${dernier ? "bg-brand-line" : "bg-[color:var(--brand-blue-end)]"}`} /> : null}
            </div>

            <div className={`min-w-0 flex-1 ${dernier ? "" : "pb-4"}`}>
              {label ? <p className={`text-sm font-bold ${couleurEffective}`}>{label}</p> : null}
              <p className="text-sm text-brand-ink">{entree.details}</p>
              <p className="mt-0.5 text-xs text-brand-muted">{formaterDateHeure(entree.date_heure)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
