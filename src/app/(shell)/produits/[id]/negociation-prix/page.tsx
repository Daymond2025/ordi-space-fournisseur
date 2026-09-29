import { EcranNegociationPrix } from "./EcranNegociationPrix";

export default async function NegociationPrixPage({ params }: PageProps<"/produits/[id]/negociation-prix">) {
  const { id } = await params;

  return <EcranNegociationPrix produitId={Number(id)} />;
}
