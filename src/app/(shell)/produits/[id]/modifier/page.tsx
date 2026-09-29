import { EcranModifierProduit } from "./EcranModifierProduit";

export default async function ModifierProduitPage({ params }: PageProps<"/produits/[id]/modifier">) {
  const { id } = await params;

  return <EcranModifierProduit produitId={Number(id)} />;
}
