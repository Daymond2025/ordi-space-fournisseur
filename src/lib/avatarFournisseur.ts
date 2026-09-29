const PALETTE_AVATAR = ["bg-fuchsia-500", "bg-blue-500", "bg-amber-500", "bg-emerald-500", "bg-violet-500"];

/**
 * Couleur déterministe (pas de photo d'entreprise dans le modèle Fournisseur
 * — seul le User/gérant en a une) — même palette que Cordinateur_App_Web/
 * src/lib/avatarFournisseur.ts.
 */
export function couleurAvatarFournisseur(id: number): string {
  return PALETTE_AVATAR[id % PALETTE_AVATAR.length];
}

export function initialesFournisseur(nomEntreprise: string): string {
  return nomEntreprise.trim().slice(0, 2).toUpperCase();
}
