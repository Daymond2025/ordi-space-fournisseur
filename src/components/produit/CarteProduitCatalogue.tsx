import Image from "next/image";
import Link from "next/link";
import { MonitorIcon } from "@/components/icons";
import { formaterMontant, type ProduitCatalogue } from "@/lib/types";

function Badge({ couleur, label }: { couleur: "vert" | "noir"; label: string }) {
  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
        couleur === "vert" ? "bg-white/90 text-green-600" : "bg-black/80 text-white"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${couleur === "vert" ? "bg-green-500" : "bg-white"}`} />
      {label}
    </span>
  );
}

/**
 * Carte de la grille "Mes produits" — même structure que Cordinateur_App_Web/
 * CarteProduitCatalogue.tsx. Badges dérivés (aucune colonne dédiée) :
 * disponibilité de quantite_stock, "Non publié" de statut_produit !== valide.
 */
export function CarteProduitCatalogue({ produit }: { produit: ProduitCatalogue }) {
  const enRupture = produit.quantite_stock <= 0;
  const nonPublie = produit.statut_produit !== "valide";

  return (
    <Link href={`/produits/${produit.id}/detail`} className="block overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-900/5">
      <div className="relative aspect-square bg-[#F6F8FE]">
        {produit.images[0]?.url_image ? (
          <Image src={produit.images[0].url_image} alt={produit.nom_produit} fill className="object-cover" sizes="200px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-muted">
            <MonitorIcon className="h-8 w-8" />
          </div>
        )}

        <div className="absolute left-1.5 top-1.5 flex flex-wrap gap-1">
          {produit.est_booste ? <Badge couleur="vert" label="Booster" /> : null}
          {nonPublie ? <Badge couleur="noir" label="Non publié" /> : <Badge couleur="vert" label="Disponible" />}
        </div>

        {enRupture ? (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">Rupture</span>
        ) : null}
      </div>

      <div className="p-2.5">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-brand-ink">{produit.nom_produit}</p>
        <p className="mt-1 text-sm font-extrabold text-brand-ink">{formaterMontant(produit.prix_vente ?? produit.prix)}</p>

        <div
          className={`mt-2 flex items-center justify-between rounded-lg px-2 py-1 text-xs font-semibold ${
            enRupture ? "bg-rose-50 text-rose-500" : "bg-green-50 text-green-600"
          }`}
        >
          <span>Quantité</span>
          <span>{produit.quantite_stock}</span>
        </div>
      </div>
    </Link>
  );
}
