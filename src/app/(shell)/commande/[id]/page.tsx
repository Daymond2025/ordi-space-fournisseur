import { EcranCommande } from "./EcranCommande";

export default async function CommandeDetailPage({ params }: PageProps<"/commande/[id]">) {
  const { id } = await params;

  return <EcranCommande commandeId={Number(id)} />;
}
