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
    <Link href={href} className="flex flex-1 flex-col items-center gap-1 py-2">
      <Image
        src={icone}
        alt=""
        width={22}
        height={22}
        className={`h-[22px] w-[22px] object-contain ${actif ? "opacity-100" : "opacity-70"}`}
        style={{ filter: "brightness(0)" }}
      />
      <span className={`text-center text-[10px] font-medium leading-tight ${actif ? "text-[color:var(--brand-blue-end)]" : "text-brand-muted"}`}>
        {label}
      </span>
    </Link>
  );
}

/**
 * Nav du bas de l'app Fournisseur — 5 emplacements d'après le mockup de
 * l'accueil : Space / Livreurs / [bouton central surélevé] / Paiement / Mes
 * produits. Icônes fournies par l'utilisateur (public/images/{space,livreur,
 * paiement,boutique}.png) — `filter: brightness(0)` les force en noir pur
 * (certaines sources ne l'étaient pas exactement), l'état actif se marque par
 * l'opacité + la couleur du libellé, pas par une recoloration de l'image.
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
          <Image src="/images/mascotte.png" alt="" width={64} height={64} className="h-9 w-9 object-contain" />
        </Link>
      </div>

      {ONGLETS_DROITE.map((onglet) => (
        <Onglet key={onglet.href} {...onglet} actif={pathname === onglet.href} />
      ))}
    </nav>
  );
}
