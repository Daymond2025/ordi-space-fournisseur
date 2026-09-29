import Link from "next/link";

type Couleur = "pink" | "blue" | "orange" | "green" | "rose";

const TEINTES: Record<Couleur, { cercle: string; texte: string }> = {
  pink: { cercle: "bg-pink-100 text-pink-600", texte: "text-pink-600" },
  blue: { cercle: "bg-blue-100 text-[color:var(--brand-blue-end)]", texte: "text-[color:var(--brand-blue-end)]" },
  orange: { cercle: "bg-orange-100 text-orange-500", texte: "text-orange-500" },
  green: { cercle: "bg-green-100 text-green-600", texte: "text-green-600" },
  rose: { cercle: "bg-rose-100 text-rose-500", texte: "text-rose-500" },
};

type Props = {
  valeur: string | number;
  label: string;
  couleur: Couleur;
  /** "compte" = valeur dans un cercle pastel ; "montant" = texte coloré seul. */
  type: "compte" | "montant";
  /** Pastille verte au coin du cercle — mockup "Nouvelle commande" quand le compte est > 0. */
  indicateurNouveau?: boolean;
  /** Rend la carte cliquable (ex. "Nouvelle commande"/"Commandes en cours" → Centre des commandes). */
  href?: string;
  /** Libellé dans la couleur de `couleur` au lieu du gris habituel — mockup "Paiement" (onglet bottombar), pas les autres écrans. */
  labelColore?: boolean;
  /** Dimensions/arrondi exacts du mockup (ex. "Paiement" : 115×101, radius 22px) — en style inline pour surcharger sans toucher aux autres écrans qui réutilisent ce composant sans ces props. */
  largeurPx?: number;
  hauteurPx?: number;
  arrondiPx?: number;
};

/**
 * Une des 3 cartes flottantes de l'écran "Space" (accueil Fournisseur) —
 * carte individuelle avec sa propre ombre (mockup), contenu interne repris de
 * Cordinateur_App_Web/src/components/space/CarteStatistique.tsx (cercle
 * "compte" vs texte "montant" seul).
 */
export function CarteStatistique({ valeur, label, couleur, type, indicateurNouveau, href, labelColore, largeurPx, hauteurPx, arrondiPx }: Props) {
  const teinte = TEINTES[couleur];

  const contenu = (
    <>
      {type === "compte" ? (
        <span className="relative mx-auto flex h-10 w-10 items-center justify-center">
          <span className={`flex h-10 w-10 items-center justify-center rounded-full text-base font-extrabold ${teinte.cercle}`}>
            {valeur}
          </span>
          {indicateurNouveau ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" /> : null}
        </span>
      ) : (
        <p className={`text-base font-extrabold ${teinte.texte}`}>{valeur}</p>
      )}
      <p className={`mt-1.5 text-[11px] font-semibold leading-tight ${labelColore ? teinte.texte : "text-brand-muted"}`}>{label}</p>
    </>
  );

  const style = {
    boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)",
    ...(largeurPx ? { width: `${largeurPx}px`, flex: "none" } : {}),
    ...(hauteurPx ? { height: `${hauteurPx}px` } : {}),
    ...(arrondiPx ? { borderRadius: `${arrondiPx}px` } : {}),
  } as const;

  const classe = `${largeurPx ? "shrink-0" : "flex-1"} rounded-2xl bg-white p-3 text-center ${
    hauteurPx ? "flex flex-col items-center justify-center" : ""
  }`;

  if (href) {
    return (
      <Link href={href} className={classe} style={style}>
        {contenu}
      </Link>
    );
  }

  return (
    <div className={classe} style={style}>
      {contenu}
    </div>
  );
}
