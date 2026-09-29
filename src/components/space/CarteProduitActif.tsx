import Image from "next/image";
import Link from "next/link";
import { DoubleCheckIcon, MonitorIcon } from "@/components/icons";
import { formaterTempsRelatif } from "@/lib/temps";
import type { ProduitActif } from "@/lib/types";

/**
 * Carte "produit à activité récente" de l'écran Space — copiée de
 * Cordinateur_App_Web/src/components/space/CarteProduitActif.tsx (même
 * endpoint GET /produits/activite-recente, déjà scopé fournisseur côté
 * backend). Mène vers /produits/[id], pas encore mocké — stub provisoire en
 * attendant l'écran de détail produit fournisseur.
 */
export function CarteProduitActif({ produit }: { produit: ProduitActif }) {
  const { statistiques } = produit;

  return (
    <Link
      href={`/produits/${produit.produit_id}`}
      className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm shadow-slate-900/5"
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#EEF1F6]">
        {produit.photo ? (
          <Image src={produit.photo} alt={produit.nom_produit} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-muted">
            <MonitorIcon className="h-6 w-6" />
          </div>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-brand-ink">{produit.nom_produit}</p>
        <p className="mt-0.5 truncate text-xs text-brand-muted">
          <span className="font-semibold text-brand-ink">{statistiques.recues}</span> Commandes ·{" "}
          <span className="font-semibold text-green-600">{statistiques.livrees}</span> livrées ·{" "}
          <span className="font-semibold text-[color:var(--brand-blue-end)]">{statistiques.en_cours}</span> en cours ·{" "}
          <span className="font-semibold text-rose-500">{statistiques.annulees}</span> annulée
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-[11px] text-brand-muted">{formaterTempsRelatif(produit.derniere_activite)}</span>
        {produit.nouvelles_activites > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1 text-[11px] font-bold text-white">
            {produit.nouvelles_activites}
          </span>
        ) : (
          <DoubleCheckIcon className="h-4 w-4 text-[color:var(--brand-blue-end)]" />
        )}
      </div>
    </Link>
  );
}
