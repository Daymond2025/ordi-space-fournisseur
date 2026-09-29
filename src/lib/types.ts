/**
 * Forme enrichie de GET /moi/profil pour le rôle Fournisseur — voir
 * MoiController::profil() côté backend (branche ROLE_FOURNISSEUR, ajoutée
 * pour cette app). `taux_commission`/`solde_portefeuille` sont en lecture
 * seule ici (fixés par le staff) ; les autres champs se modifient via
 * PATCH /fournisseur/moi/profil (FournisseurController::modifierMonProfil).
 */
export type ProfilFournisseur = {
  id: number;
  nom: string;
  prenom: string | null;
  email: string;
  telephone: string | null;
  photo: string | null;
  type_utilisateur: string;
  nom_entreprise: string;
  adresse_entreprise: string | null;
  contact_pro: string | null;
  nom_gerant: string | null;
  telephone_gerant: string | null;
  horaires_ouverture: string | null;
  lien_maps: string | null;
  zone_couverte: string | null;
  taux_commission: number;
  solde_portefeuille: number;
  /** Ligne "Membre depuis" de l'écran "Profil". */
  created_at: string;
};

export type ProduitPlusVendu = {
  produit_id: number;
  nom_produit: string | null;
  photo: string | null;
  quantite_vendue: number;
  montant: number;
};

/** GET /fournisseur/moi/statistiques — tableau de bord de ventes, écran "Statistiques" (avatar de "Space" → Profil → Statistique). */
export type StatistiquesFournisseur = {
  chiffre_affaires: number;
  croissance_pourcentage: number | null;
  produits_vendus: number;
  produits_distincts_vendus: number;
  commandes_recues: number;
  commandes_livrees: number;
  commandes_annulees: number;
  commission_ordispace: number;
  produits_plus_vendus: ProduitPlusVendu[];
};

export type Pagination<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

/**
 * Compteurs par bucket — même 5 buckets que partout ailleurs dans le projet
 * (Cordinateur_App_Web/src/lib/statuts.ts, FournisseurController::commandes()) :
 * nouvelle(en_attente), en_cours(validee/en_preparation/en_livraison),
 * attention(reportee/client_injoignable/numero_incorrect), livree, annulee.
 */
export type CompteursCommandesFournisseur = {
  nouvelle: number;
  en_cours: number;
  attention: number;
  livree: number;
  annulee: number;
};

/**
 * "Produit à activité récente" (GET /produits/activite-recente, déjà scopé
 * fournisseur côté backend) — même forme que Cordinateur_App_Web/src/lib/types.ts
 * (ProduitActif/StatistiquesProduit), écran d'origine de ce composant.
 */
export type StatistiquesProduit = {
  recues: number;
  livrees: number;
  annulees: number;
  en_cours: number;
};

export type ProduitActif = {
  produit_id: number;
  nom_produit: string;
  photo: string | null;
  statistiques: StatistiquesProduit;
  derniere_activite: string | null;
  nouvelles_activites: number;
};

export type PeriodeEspace = "aujourd_hui" | "semaine" | "semaine_derniere" | "mois" | "tout";

/** Résumé de suivi le plus récent (journal d'audit) — jamais renvoyé par les endpoints self-service fournisseur (toujours null, voir FournisseurController::formaterCarteCommandeFournisseur()), gardé pour matcher la forme partagée `CommandeCarte`. */
export type DernierSuivi = {
  texte: string;
  acteur: string;
  date: string;
};

/**
 * Carte commande — onglet "Commandes uniquement" du Centre des commandes.
 * Même forme que Cordinateur_App_Web/src/lib/types.ts (CommandeCarte),
 * produite par FournisseurController::formaterCarteCommandeFournisseur()
 * (GET /fournisseur/moi/commandes).
 */
export type CommandeCarte = {
  commande_id: number;
  photo: string | null;
  nom_produit: string;
  description: string | null;
  nom_client: string;
  zone_localite: string | null;
  telephone: string | null;
  derniere_action: string;
  statut: string;
  nouvelles_activites: number;
  dernier_suivi: DernierSuivi | null;
};

/** GET /fournisseur/moi (FournisseurController::show(), rejoué sur soi-même) — on ne consomme que `statistiques` ici, `fournisseur` déjà connu via ProfilFournisseur. */
export type StatistiquesFournisseurMoi = {
  produits_total: number;
  commandes_recues: number;
  commandes_livrees: number;
  commandes_annulees: number;
};

/**
 * Discussion produit (GET /produits/{id}/conversation, déjà accessible au
 * fournisseur propriétaire — Produit::estAccessibleConversationPar()) —
 * mêmes types que Cordinateur_App_Web/src/lib/types.ts (même écran d'origine,
 * voir EcranDiscussionProduit.tsx).
 */
export type MessageAuteur = {
  id: number;
  nom: string;
  prenom: string | null;
  type_utilisateur: string;
  telephone?: string | null;
};

export type TypeMessage =
  | "texte"
  | "image"
  | "video"
  | "audio"
  | "note_vocale"
  | "document"
  | "rapport"
  | "commande_creee"
  | "proposition_prix";

export type DonneesCommandeCreee = {
  nom_produit: string;
  photo: string | null;
  prix_produit: number;
  nom_client: string;
  telephone: string | null;
  zone_livraison: string | null;
  date_livraison_prevue: string | null;
  frais_livraison: number;
  remise: number;
  total: number;
  bonus_offerts: string | null;
  notes?: string | null;
};

export type DonneesRapport = {
  date: string;
  envoyees: number;
  validees: number;
  reportees: number;
  non_livre: number;
  annulees: number;
};

export type DonneesPropositionPrix = {
  prix_liste: number;
  prix_propose: number;
};

export type MessageConversation = {
  id: number;
  produit_id: number | null;
  commande_id: number | null;
  auteur_id: number;
  auteur: MessageAuteur;
  type: TypeMessage;
  contenu: string | null;
  fichier: string | null;
  donnees: DonneesCommandeCreee | DonneesRapport | DonneesPropositionPrix | null;
  date_envoi: string;
};

export type ItemFil =
  | { type: "message"; date: string; donnee: MessageConversation }
  | { type: "commande"; date: string; donnee: CommandeCarte };

/** = Produit::statistiquesCommandes() — mêmes 4 champs que StatistiquesProduit. */
export type EnTeteConversation = {
  recues: number;
  livrees: number;
  annulees: number;
  en_cours: number;
};

export type ConversationProduit = {
  items: ItemFil[];
  en_tete: EnTeteConversation;
};

/**
 * Forme minimale de GET /produits/{id} consommée par l'en-tête de la
 * discussion, du centre de paiement et du détail produit (+ menu ☰, qui a
 * juste besoin de `quantite_stock`/`statut_produit` sans re-fetcher toute la
 * fiche déjà chargée par InfosProduit.tsx).
 */
export type ProduitConversationHeader = {
  id: number;
  nom_produit: string;
  date_ajout: string;
  quantite_stock: number;
  statut_produit: string;
  images: { url_image: string }[];
};

/**
 * Écran détail commande (Suivi/Information) — GET /commandes/{id}, déjà
 * accessible au fournisseur propriétaire depuis cette passe
 * (Commande::estAccessiblePar(), voir routes/api.php). On ne consomme que le
 * statut/la date/le frais ici, le reste vient de `meta.apercu` (DonneesCommandeCreee).
 * `livraison` est optionnel dans le type car absent des commandes 100%
 * numériques (jamais le cas ici — un fournisseur ne vend que du physique —
 * mais on reste honnête sur la forme réelle des données).
 */
export type CommandeDetail = {
  id: number;
  statut_commande: string;
  date_commande: string;
  frais_livraison: number;
  livraison?: { statut_livraison: string } | null;
};

/**
 * "Centre de paiement des commissions" d'un produit (app Fournisseur) —
 * GET /produits/{id}/centre-paiement. `total_a_payer` ne vient QUE des
 * achats externes déclarés (voir `achats_externes`) : une vente in-app ne
 * crée jamais de reste à payer, la marge Ordi'Space est déjà retenue en
 * amont — voir ProduitController::centrePaiement() côté backend. Ce total
 * n'est pas scopé par période (comme "Commission totale à payer" sur
 * Space) ; `chiffre_affaires`/`compteurs`/`transactions`/`achats_externes`
 * respectent la période choisie.
 */
export type CompteursCentrePaiement = {
  nouvelle: number;
  terminees: number;
  annulees: number;
};

/** `statut` décrit le versement Ordi'Space → fournisseur (pas encore/déjà versé), jamais une commission due par lui. */
export type TransactionJourCentrePaiement = {
  date: string;
  statut: "en_attente" | "paye";
  nombre_commandes: number;
  montant: number;
};

/** Une commande individuelle derrière une carte `TransactionJourCentrePaiement` — GET /produits/{id}/centre-paiement/jour. */
export type LigneDetailTransactionJour = {
  commande_id: number;
  statut_commande: string;
  heure: string;
  zone_livraison: string | null;
  telephone: string | null;
  photo: string | null;
  montant: number;
  statut: "en_attente" | "paye";
};

/**
 * Vente du produit encaissée par le fournisseur lui-même, hors flux commande
 * in-app — voir "Ajouter un achat Externe". `commission_due` reste TOUJOURS
 * le montant dû tant que `statut_modification` n'est pas "approuvee" (pas
 * encore possible, aucun écran Coordinateur construit) — voir "Modifier le
 * montant".
 */
export type AchatExterneCentrePaiement = {
  id: number;
  date_vente: string;
  montant_vente: number;
  commission_due: number;
  statut: "en_attente" | "paye";
  note: string | null;
  montant_modifie_propose: number | null;
  motif_modification: string | null;
  statut_modification: "en_attente" | "approuvee" | "rejetee" | null;
};

export type CentrePaiementProduit = {
  chiffre_affaires: number;
  total_a_payer: number;
  compteurs: CompteursCentrePaiement;
  transactions: TransactionJourCentrePaiement[];
  achats_externes: AchatExterneCentrePaiement[];
};

/**
 * Onglet "Paiement" (nav du bas) — GET /fournisseur/moi/paiements. Fusion,
 * tous produits confondus, des deux flux déjà gérés séparément par le Centre
 * de paiement d'un produit : un achat externe (commission due PAR le
 * fournisseur) ou un crédit de portefeuille (versement Ordi'Space → lui, pour
 * une commande in-app) — voir FournisseurController::moiPaiements(). Les
 * champs `date_vente`/`montant_vente`/`commission_due`/`note`/
 * `montant_modifie_propose`/`motif_modification`/`statut_modification` ne
 * sont présents que pour `type === "achat_externe"` (superset de
 * `AchatExterneCentrePaiement`, pour rouvrir directement `FeuilleModifierMontant`).
 */
export type PaiementItem = {
  type: "achat_externe" | "transaction";
  id: number;
  produit_id: number | null;
  commande_id: number | null;
  nom_produit: string | null;
  photo: string | null;
  montant: number;
  statut: "en_attente" | "paye";
  date_heure: string;
  date_vente?: string;
  montant_vente?: number;
  commission_due?: number;
  note?: string | null;
  montant_modifie_propose?: number | null;
  motif_modification?: string | null;
  statut_modification?: "en_attente" | "approuvee" | "rejetee" | null;
};

export type PaiementsFournisseur = {
  solde: number;
  total_a_payer: number;
  total_paye: number;
  total_a_recevoir: number;
  items: PaiementItem[];
};

export type SuiviDonnees = {
  statut_apres?: string;
  livreur_id?: number;
};

/** GET /commandes/{id}/suivi — journal d'audit, timeline verticale. */
export type SuiviEntree = {
  id: number;
  action: string;
  details: string | null;
  date_heure: string;
  acteur: MessageAuteur | null;
  donnees: SuiviDonnees | null;
};

/** "12.357 F" — même formatage que Cordinateur_App_Web/EcranSpace.tsx (regroupement en-US, séparateur remplacé par un point). */
export function formaterMontant(valeur: number): string {
  return `${Math.round(valeur).toLocaleString("en-US").replace(/,/g, ".")} F`;
}

/**
 * Onglet "Livreurs" (bottombar) — GET /fournisseur/moi/livreurs. Pas de
 * `type_vehicule` (absent du mockup fournisseur) ; pas de distance/position
 * réelle (aucune géolocalisation dans le projet) — `zone_couverture` (texte
 * libre) sert d'indication approximative à la place.
 */
export type LivreurListeFournisseur = {
  user_id: number;
  nom: string;
  prenom: string | null;
  photo: string | null;
  telephone: string | null;
  zone_couverture: string | null;
  disponible: boolean;
};

export type StatistiquesLivreur = {
  commandes_total: number;
  commandes_livrees: number;
  commandes_retournees: number;
  gains_total_recu: number;
};

/**
 * Feuille détail livreur (onglet "Livreurs") — GET /fournisseur/moi/livreurs/
 * {id}. Pas de `documents` d'identité (réservés au Coordinateur/Admin).
 */
export type LivreurDetailFournisseur = {
  user_id: number;
  nom: string;
  prenom: string | null;
  photo: string | null;
  telephone: string | null;
  disponible: boolean;
  statistiques: StatistiquesLivreur;
};

/**
 * "Assigner une nouvelle mission" (feuille détail livreur) — GET
 * /fournisseur/moi/livraisons-disponibles, vivier déjà scopé au fournisseur
 * connecté (pas de filtre à choisir, contrairement à l'écran Coordinateur).
 * "Temps Estimé" du mockup est décoratif (aucune géolocalisation réelle).
 */
export type LivraisonDisponibleFournisseur = {
  commande_id: number;
  nom_produit: string | null;
  photo: string | null;
  zone_depart: string | null;
  zone_destination: string | null;
  frais_livraison: number;
};

export type Categorie = {
  id: number;
  nom_categorie: string;
};

export type Localite = {
  id: number;
  nom: string;
  type: "commune_abidjan" | "ville";
};

/** Onglet "Mes produits" (bottombar) — GET /produits/statistiques, déjà scopé au fournisseur connecté côté backend. */
export type StatistiquesCatalogue = {
  total: number;
  boostes: number;
  indisponibles: number;
};

/** Carte de la grille "Mes produits" — GET /produits (déjà scopé au fournisseur connecté). */
export type ProduitCatalogue = {
  id: number;
  nom_produit: string;
  prix: number;
  prix_vente: number | null;
  quantite_stock: number;
  statut_produit: string;
  est_booste: boolean;
  images: { url_image: string }[];
};

