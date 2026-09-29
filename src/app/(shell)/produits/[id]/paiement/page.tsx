import { EcranCentrePaiement } from "./EcranCentrePaiement";

export default async function CentrePaiementPage({ params }: PageProps<"/produits/[id]/paiement">) {
  const { id } = await params;

  return <EcranCentrePaiement produitId={Number(id)} />;
}
