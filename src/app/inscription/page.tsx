import { Suspense } from "react";
import { EcranInscription } from "./EcranInscription";

export default function InscriptionPage() {
  return (
    <Suspense>
      <EcranInscription />
    </Suspense>
  );
}
