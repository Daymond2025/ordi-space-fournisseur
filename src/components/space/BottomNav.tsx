"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ONGLETS_GAUCHE = [
  { href: "/", label: "Space", icone: "/images/space.png" },
  { href: "/livreurs", label: "Livreurs", icone: "/images/livreur.png" },
] as const;

const ONGLETS_DROITE = [
  { href: "/paiement", label: "Paiement", icone: "/images/paiement.png" },
  { href: "/produits", label: "Mes produits", icone: "/images/boutique.png" },
] as const;

function Onglet({ href, label, icone, actif }: { href: string; label: string; icone: string; actif: boolean }) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className="group relative flex flex-1 items-center justify-center py-1.5 [-webkit-tap-highlight-color:transparent]"
    >
      {/* Onglet actif : pastille arrondie bleu très clair avec une ombre bleue
          douce, qui apparaît en fondu. Réactif : la pastille se resserre
          légèrement à l'appui (active:scale) et l'icône grossit en douceur. */}
      <span
        className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-1.5 transition-all duration-300 ease-out group-active:scale-90 ${
          actif ? "bg-[#C2DCFF]" : "bg-transparent"
        }`}
        style={{ boxShadow: actif ? "0px 6px 18px 0px rgba(0, 119, 255, 0.6), 0px 2px 6px 0px rgba(0, 119, 255, 0.4), 0px 0px 0px 1.5px rgba(0, 119, 255, 0.25)" : "0px 0px 0px 0px rgba(0, 119, 255, 0)" }}
      >
        {/* Halo bleu de l'icône : filtre posé sur ce conteneur (sur l'icône
            elle-même, le masque ci-dessous effacerait l'ombre). */}
        <span
          className={`flex shrink-0 transition-all duration-300 ease-out ${actif ? "-translate-y-0.5 scale-110" : ""}`}
          style={{
            filter: actif ? "drop-shadow(0px 4px 6px rgba(0, 119, 255, 0.85)) drop-shadow(0px 0px 9px rgba(0, 119, 255, 0.5))" : "none",
          }}
        >
          {/* `mask-image` (pas `filter: brightness(0)`) : recolore l'icône via
              `background-color` quelle que soit sa couleur source — même
              technique que l'app Commercial (BottomNav.tsx), dont cet onglet reprend le style. */}
          <span
            aria-hidden="true"
            className="h-[22px] w-[22px] shrink-0 transition-colors duration-300"
            style={{
              backgroundColor: actif ? "var(--brand-blue-end)" : "#9CA3AF",
              WebkitMaskImage: `url(${icone})`,
              maskImage: `url(${icone})`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />
        </span>
        <span
          className={`text-center text-[10px] leading-tight transition-colors duration-300 ${
            actif ? "font-bold text-[color:var(--brand-blue-end)]" : "font-medium text-brand-muted"
          }`}
        >
          {label}
        </span>
      </span>
    </Link>
  );
}

/**
 * Nav du bas de l'app Fournisseur — 5 emplacements d'après le mockup de
 * l'accueil : Space / Livreurs / [bouton central surélevé] / Paiement / Mes
 * produits. Icônes fournies par l'utilisateur (public/images/{space,livreur,
 * paiement,boutique}.png). Onglet actif : même style que l'app Commercial —
 * pastille bleu clair avec ombre bleue, icône agrandie avec halo (voir Onglet()).
 * Affichée sur tous les écrans sauf "Détail produit" (voir (shell)/layout.tsx).
 * Dimensions/ombre exactes du mockup : 402×63, `box-shadow`
 * `0px -2px 4px 0px rgba(0,0,0,0.25)` (portée vers le haut) au lieu d'une
 * simple bordure.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-20 flex items-end bg-white px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1"
      style={{ height: "63px", boxShadow: "0px -2px 4px 0px rgba(0, 0, 0, 0.25)" }}
    >
      {ONGLETS_GAUCHE.map((onglet) => (
        <Onglet key={onglet.href} {...onglet} actif={pathname === onglet.href} />
      ))}

      <div className="flex flex-1 flex-col items-center">
        {/* Centre de discussion des commandes — chaque commande de /commandes
            s'ouvre sur un vrai fil de conversation (voir EcranCommande.tsx). */}
        <Link
          href="/commandes"
          aria-label="Discussion des commandes"
          className="bg-gradient-espace -mt-6 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white shadow-lg shadow-blue-900/20"
        >
          <Image src="/images/mascotte.png" alt="" width={96} height={96} className="h-11 w-11 object-contain" />
        </Link>
      </div>

      {ONGLETS_DROITE.map((onglet) => (
        <Onglet key={onglet.href} {...onglet} actif={pathname === onglet.href} />
      ))}
    </nav>
  );
}
