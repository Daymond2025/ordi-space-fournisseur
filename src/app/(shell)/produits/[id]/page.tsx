import { EcranDiscussionProduit } from "./EcranDiscussionProduit";

export default async function ProduitDiscussionPage({ params }: PageProps<"/produits/[id]">) {
  const { id } = await params;

  return <EcranDiscussionProduit produitId={Number(id)} />;
}
