import { EcranRechercheLivreur } from "./EcranRechercheLivreur";

export default async function RechercheLivreurPage({ params }: PageProps<"/commande/[id]/recherche">) {
  const { id } = await params;

  return <EcranRechercheLivreur commandeId={Number(id)} />;
}
