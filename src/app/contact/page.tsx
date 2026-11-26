import { RouteGuard } from "@/components/RouteGuard";
import { EcranContact } from "./EcranContact";

export default function ContactPage() {
  return (
    <RouteGuard>
      <EcranContact />
    </RouteGuard>
  );
}
