/**
 * Horodatage relatif ("il y a 2h") — copié de Cordinateur_App_Web/src/lib/temps.ts
 * (même écran d'origine : liste "produits à activité récente"). Pas de
 * dépendance externe (date-fns/dayjs absents du projet).
 */
export function formaterTempsRelatif(iso: string | null): string {
  if (!iso) return "";

  const date = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";

  const secondes = Math.max(0, (Date.now() - date.getTime()) / 1000);

  if (secondes < 60) return "à l'instant";
  if (secondes < 3600) return `il y a ${Math.floor(secondes / 60)}min`;
  if (secondes < 86400) return `il y a ${Math.floor(secondes / 3600)}h`;
  if (secondes < 604800) return `il y a ${Math.floor(secondes / 86400)}j`;

  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
