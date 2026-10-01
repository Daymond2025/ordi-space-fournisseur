"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { RouteGuard } from "@/components/RouteGuard";
import { BottomNav } from "@/components/space/BottomNav";

// Hauteur bornée (h-dvh, pas min-h-dvh) + overflow-hidden sur la coquille :
// sans ça, la page entière grandissait avec le contenu et défilait elle-même
// au lieu de la seule zone `flex-1` ci-dessous, ce qui empêchait la barre de
// saisie de la discussion produit de rester ancrée juste au-dessus de la nav
// (elle se retrouvait poussée sous un grand vide). Purement correctif, ne
// change rien visuellement sur les écrans dont le contenu tient déjà dans
// l'écran (Space, Centre des commandes...), les rend juste correctement
// défilants indépendamment de la nav quand leur contenu dépasse.
// Seul l'écran "Détail produit" masque la nav du bas (retour de test réel) —
// partout ailleurs elle reste affichée, en plus du bouton retour propre à
// chaque écran (les deux coexistent, ce n'est plus l'un ou l'autre).
const MASQUE_NAV = /^\/produits\/\d+\/detail(\/|$)/;

export default function ShellLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const masquerNav = MASQUE_NAV.test(pathname ?? "");

  return (
    <RouteGuard>
      <div className="mx-auto flex h-dvh w-full max-w-xl flex-col overflow-hidden bg-[#f2f5fa] md:my-6 md:h-[calc(100dvh-3rem)] md:rounded-[2rem] md:shadow-2xl md:shadow-slate-900/15 md:ring-1 md:ring-black/5">
        <div className="flex-1 overflow-y-auto">{children}</div>
        {masquerNav ? null : <BottomNav />}
      </div>
    </RouteGuard>
  );
}
