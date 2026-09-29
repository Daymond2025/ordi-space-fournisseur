/**
 * Partage natif (Web Share API) — pas de lien vers l'app (auth par token
 * localStorage, aucune route publique), uniquement un texte descriptif.
 * Repli silencieux sur le presse-papiers si `navigator.share` est absent.
 * Copié de Cordinateur_App_Web/src/lib/partage.ts.
 */
export async function partager(texte: string, titre?: string): Promise<void> {
  if (typeof navigator === "undefined") return;

  if (navigator.share) {
    try {
      await navigator.share({ title: titre, text: texte });
    } catch {
      // Annulation par l'utilisateur ou API refusée — pas d'erreur à afficher.
    }
    return;
  }

  await navigator.clipboard?.writeText(texte).catch(() => {});
}
