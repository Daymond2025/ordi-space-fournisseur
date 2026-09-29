/**
 * Vocabulaire des statuts de commande — copié de
 * Cordinateur_App_Web/src/lib/statuts.ts (même 5 buckets déjà utilisés côté
 * backend, voir FournisseurController::commandes()/compteurs).
 */
export const LIBELLES_STATUT: Record<string, string> = {
  en_attente: "En attente",
  validee: "Validée",
  en_preparation: "En attente de livraison",
  en_livraison: "Livraison en cours",
  livree: "Livrée",
  annulee: "Annulée",
  reportee: "Reportée",
  client_injoignable: "Client injoignable",
  numero_incorrect: "Numéro incorrect",
};

/**
 * Dégradé (valeur CSS `background`, pas une classe Tailwind) par statut —
 * pastille d'en-tête de la carte commande dans le fil de discussion produit.
 */
export const DEGRADE_STATUT: Record<string, string> = {
  en_attente: "linear-gradient(90deg, #6F1A7A 0%, #CB30E0 100%)",
  validee: "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)",
  en_preparation: "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)",
  en_livraison: "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)",
  livree: "linear-gradient(274.19deg, #23E755 3.13%, #008421 98.13%)",
  annulee: "linear-gradient(90deg, #992224 0%, #FF383C 100%)",
  reportee: "linear-gradient(273.52deg, #FF7800 -3.09%, #FF8000 98.47%)",
  client_injoignable: "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)",
  numero_incorrect: "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)",
};

/** Couleur de texte/icône (classe Tailwind) par statut — timeline de suivi. */
export const COULEUR_TEXTE_STATUT: Record<string, string> = {
  en_attente: "text-[color:var(--brand-blue-end)]",
  validee: "text-[color:var(--brand-blue-end)]",
  en_preparation: "text-[color:var(--brand-blue-end)]",
  en_livraison: "text-[color:var(--brand-blue-end)]",
  livree: "text-green-600",
  annulee: "text-rose-500",
  reportee: "text-orange-500",
  client_injoignable: "text-[color:var(--brand-blue-end)]",
  numero_incorrect: "text-[color:var(--brand-blue-end)]",
};

export type BucketCommande = "nouvelle" | "en_cours" | "attention" | "livree" | "annulee";

/**
 * Regroupement des 9 statuts réels en 5 buckets — onglet "Commandes
 * uniquement" du Centre des commandes. Même bucket "id" que les clés de
 * `compteurs` renvoyées par GET /fournisseur/moi/commandes.
 */
export const BUCKETS_COMMANDE: {
  id: BucketCommande;
  label: string;
  statuts: string[];
  degrade: string;
  libelleCarte: string;
}[] = [
  {
    id: "nouvelle",
    label: "New cmd",
    statuts: ["en_attente"],
    degrade: "rgba(0, 0, 0, 1)",
    libelleCarte: "Nouvelle commande",
  },
  {
    id: "en_cours",
    label: "En cours",
    statuts: ["validee", "en_preparation", "en_livraison"],
    degrade: "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)",
    libelleCarte: "Livraison en cours",
  },
  {
    id: "attention",
    label: "En Attentes",
    statuts: ["reportee", "client_injoignable", "numero_incorrect"],
    degrade: "linear-gradient(273.52deg, #FFCC00 -3.09%, #FF7800 98.47%)",
    libelleCarte: "Commande en attente",
  },
  {
    id: "livree",
    label: "Livrée",
    statuts: ["livree"],
    degrade: "linear-gradient(274.19deg, #23E755 3.13%, #008421 98.13%)",
    libelleCarte: "Commande livrée",
  },
  {
    id: "annulee",
    label: "Annulée",
    statuts: ["annulee"],
    degrade: "linear-gradient(273.52deg, #FF00E6 -3.09%, #FF2600 98.47%)",
    libelleCarte: "Commande annulée",
  },
];

/** Retrouve le bucket d'affichage (couleur + libellé) à partir d'un vrai statut_commande. */
export function trouverBucketCommande(statut: string) {
  return BUCKETS_COMMANDE.find((bucket) => bucket.statuts.includes(statut)) ?? BUCKETS_COMMANDE[0];
}
