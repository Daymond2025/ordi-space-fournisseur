import { StoreIcon } from "@/components/icons";

/**
 * Écran provisoire pour les destinations de la nav du bas ("Livreurs",
 * "Paiement", "Mes produits") et le détail produit, dont le mockup n'a pas
 * encore été fourni — sert juste à éviter un 404 tant que l'écran réel n'est
 * pas construit. À remplacer dès que le mockup correspondant arrive.
 */
export function EcranBientotDisponible({ titre }: { titre: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[color:var(--brand-blue-end)]">
        <StoreIcon className="h-8 w-8" />
      </div>
      <p className="text-base font-bold text-brand-ink">{titre}</p>
      <p className="text-sm text-brand-muted">Cet écran arrive bientôt.</p>
    </div>
  );
}
