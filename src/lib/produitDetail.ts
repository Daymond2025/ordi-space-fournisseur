/**
 * "Infos produit" (Centre de paiement des commissions, onglet "Infos
 * produit") — mêmes types que Ordi'Space_Livreur_App_mobile/src/lib/
 * produitsBoutique.ts, réutilisés tels quels car le fournisseur consulte la
 * même fiche produit publique (GET /produits/{id}) que le livreur sur
 * "Boutique", juste sans les actions de revente (voir InfosProduit.tsx).
 */
export type ImageProduitDetail = {
  id: number;
  url_image: string;
  ordre_affichage: number;
};

export type EtatProduitDetail = "neuf" | "quasi_neuf" | "occasion" | "reconditionne";

export const LIBELLE_ETAT_PRODUIT: Record<EtatProduitDetail, string> = {
  neuf: "Neuf",
  quasi_neuf: "Quasi neuf",
  occasion: "Occasion",
  reconditionne: "Reconditionné",
};

export type FraisLivraisonProduitDetail = {
  id: number;
  montant: string;
  localite: { id: number; nom: string } | null;
};

export type ProduitDetailComplet = {
  id: number;
  nom_produit: string;
  description: string | null;
  /** Prix partenaire — le seul que le fournisseur fixe (voir StoreProduitRequest::rules()). */
  prix: string;
  marque: string | null;
  prix_vente: string | null;
  prix_barre: string | null;
  pourcentage_reduction: number | null;
  commission_revente: string | null;
  etat_produit: EtatProduitDetail | null;
  quantite_stock: number;
  type_livraison: "physique" | "numerique";
  duree_garantie_mois: number | null;
  processeur: string | null;
  memoire_ram: string | null;
  stockage: string | null;
  taille: string | null;
  systeme_exploitation: string | null;
  carte_graphique: string | null;
  couleur: string | null;
  cadeaux: string[] | null;
  /** Photo par cadeau sélectionné (clé = un des éléments de `cadeaux`), URL déjà résolue côté backend (Produit::imagesCadeaux()) — absente ou `null` si aucune photo fournie pour ce cadeau. */
  images_cadeaux: Record<string, string | null> | null;
  /** Contenu matériel du carton (ex. "Sacoche", "Souris") — distinct de `cadeaux` (incitation marketing), voir la migration contenu_pack. */
  contenu_pack: string[] | null;
  categorie: { id: number; nom_categorie: string } | null;
  images: ImageProduitDetail[];
  frais_livraison: FraisLivraisonProduitDetail[];
  statut_produit: string;
  date_ajout: string;
  /** Présent uniquement si statut_produit === "rejete" et que l'appelant est le fournisseur propriétaire (ou Coordinateur/Admin) — voir ProduitController::show(). */
  motif_rejet?: string | null;
  /** Marge Ordi'Space = prix_vente − prix, calculée côté backend (Produit::commissionOrdispace()) — null tant que non publié (prix_vente absent). Informatif, jamais éditable par le fournisseur. */
  commission_ordispace: number | null;
};

/** Résumé compact des specs principales — "Core i5 • 8 Go DDR4 • 256 Go SSD". */
export function resumerSpecs(produit: ProduitDetailComplet): string[] {
  return [produit.processeur, produit.memoire_ram, produit.stockage].filter((v): v is string => Boolean(v));
}

export function formaterPrix(prix: string | number): string {
  const nombre = typeof prix === "string" ? parseFloat(prix) : prix;
  return new Intl.NumberFormat("fr-FR").format(nombre);
}
