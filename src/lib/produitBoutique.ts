/**
 * Champs "Boutique des livreurs" d'une fiche produit (état, prix barré,
 * réduction, commission de revente) — mêmes valeurs que Cordinateur_App_Web/
 * src/lib/produitBoutique.ts, alignées sur le backend (ETATS_PRODUIT côté
 * PHP, Produit::booted() pour les marques).
 */
export const ETATS_PRODUIT = [
  { valeur: "neuf", label: "Neuf" },
  { valeur: "quasi_neuf", label: "Quasi neuf" },
  { valeur: "occasion", label: "Occasion" },
  { valeur: "reconditionne", label: "Reconditionné" },
];

/** "Apple" est rangé sous "Macbook" et "Autre" sous "Autre" par le backend (Produit::booted()). */
export const MARQUES = ["HP", "Dell", "Lenovo", "Apple", "Asus", "Toshiba", "Chromebook", "Autre"];

/**
 * Listes partagées entre "Ajouter un produit" (EcranAjouterProduit.tsx) et
 * "Modifier" (EcranModifierProduit.tsx) — mêmes valeurs que Cordinateur_App_Web/
 * src/app/produit/nouveau/EcranChoixCategorieProduit.tsx.
 */
export const CATEGORIES_AJOUT: { icone: string; label: string }[] = [
  { icone: "/images/ordi-pc.png", label: "Ordinateur portable" },
  { icone: "/images/ordi-desktop.png", label: "Ordinateur bureau" },
  { icone: "/images/chargeur.png", label: "Chargeur" },
  { icone: "/images/souris.png", label: "Souris" },
  { icone: "/images/sac-pc.png", label: "Sacs pc" },
  // Icône provisoire (autres.png) — aucune icône dédiée "Logiciels" fournie
  // pour l'instant, à remplacer dès qu'elle est disponible. Catégorie
  // "Logiciels" déjà en base (seedée pour l'Espace Coordinateur), juste
  // jamais exposée ici : sans elle, un fournisseur ne peut pas ajouter de
  // logiciel/licence (voir aussi le sélecteur "Type de livraison" ci-dessous).
  { icone: "/images/autres.png", label: "Logiciels" },
  { icone: "/images/autres.png", label: "Autre" },
];

/** "Ordinateur portable" réutilise la catégorie existante "Ordinateurs portables" (même concept, écart de pluriel). */
export const NOMS_CATEGORIE_REELS: Record<string, string> = {
  "Ordinateur portable": "Ordinateurs portables",
};

/** "Ajouter un produit" — Physique (livré par un livreur) vs Numérique (licence/logiciel, aucune livraison). */
export const TYPES_LIVRAISON: { valeur: "physique" | "numerique"; label: string }[] = [
  { valeur: "physique", label: "Physique (avec livraison)" },
  { valeur: "numerique", label: "Numérique (logiciel / licence)" },
];

export const PROCESSEURS = [
  "Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9",
  "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "AMD Ryzen 9",
  "Apple M1", "Apple M2", "Apple M3", "Autre",
];
export const CARTES_GRAPHIQUES = [
  "Intel UHD Graphics", "Intel Iris Xe", "NVIDIA GeForce GTX", "NVIDIA GeForce RTX",
  "AMD Radeon", "Aucune (intégrée)", "Autre",
];
export const RAMS = ["4GB", "8GB", "16GB", "32GB", "64GB"];
export const TAILLES_ECRAN = ["11\"", "12\"", "13\"", "14\"", "15.6\"", "17\""];
export const SYSTEMES_EXPLOITATION = ["Windows 10", "Windows 11", "macOS", "Linux", "Chrome OS", "Sans système"];
export const TYPES_DISQUE = ["SSD", "HDD"];
export const COULEURS = ["Noir", "Gris", "Argent", "Blanc", "Bleu", "Autre"];
export const QUANTITES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40, 50, 100];
export const CADEAUX_DISPONIBLES = ["Souris", "Sac", "Chargeur", "Casque", "Clé USB", "Autre"];
