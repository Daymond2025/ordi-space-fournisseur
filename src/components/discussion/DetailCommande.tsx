import Image from "next/image";
import { MonitorIcon, UserIcon } from "@/components/icons";
import { formaterMontant } from "@/lib/types";
import type { DonneesCommandeCreee } from "@/lib/types";

function formaterDateLivraison(iso: string | null): string {
  if (!iso) return "Aujourd'hui, dans l'immédiat";

  const date = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "Aujourd'hui, dans l'immédiat";

  return date.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function LigneDetail({ label, value, isTel }: { label: string; value: string; isTel?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-1.5 text-xs text-brand-muted">
        <UserIcon className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(112, 112, 112, 1)" }} />
        {label}
      </span>
      {isTel ? (
        <a href={`tel:${value}`} className="shrink-0 text-sm font-bold text-[color:var(--brand-blue-end)]">
          {value}
        </a>
      ) : (
        <span className="shrink-0 text-sm font-bold text-brand-ink">{value}</span>
      )}
    </div>
  );
}

function LignePrix({ label, value, negatif }: { label: string; value: number; negatif?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-brand-muted">{label}</span>
      <span className={`text-sm font-bold ${negatif ? "text-rose-500" : "text-brand-ink"}`}>
        {negatif ? "-" : ""}
        {formaterMontant(value)}
      </span>
    </div>
  );
}

/**
 * Contenu détaillé d'une commande (photo/prix, infos client/livraison, détail
 * prix, bonus) — copié de Cordinateur_App_Web/src/components/discussion/DetailCommande.tsx
 * (même écran d'origine), utilisé par CarteNouvelleCommande dans le fil.
 */
export function DetailCommande({ donnees }: { donnees: DonneesCommandeCreee }) {
  const bonusListe = donnees.bonus_offerts
    ? donnees.bonus_offerts.split(",").map((item) => item.trim()).filter(Boolean)
    : [];

  return (
    <div>
      <div className="flex gap-3 rounded-[9px] bg-white p-2.5" style={{ boxShadow: "1px 1px 2px 0px rgba(0, 0, 0, 0.25)" }}>
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[9px] bg-[#F6F8FE]">
          {donnees.photo ? (
            <Image src={donnees.photo} alt={donnees.nom_produit} fill className="object-cover" sizes="64px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-brand-muted">
              <MonitorIcon className="h-6 w-6" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <p className="text-sm font-bold leading-snug text-brand-ink">{donnees.nom_produit}</p>
          <p className="mt-1 text-sm font-extrabold text-brand-ink">{formaterMontant(donnees.prix_produit)}</p>
        </div>
      </div>

      <div
        className="mx-auto my-3 h-px w-[77%]"
        style={{ backgroundImage: "linear-gradient(90deg, rgba(224,225,226,0) 0%, #E0E1E2 49.52%, rgba(224,225,226,0.15625) 99.04%)" }}
      />

      <div className="space-y-2.5">
        <LigneDetail label="Nom pour la facture" value={donnees.nom_client} />
        <LigneDetail label="Lieu de livraison" value={donnees.zone_livraison ?? "—"} />
        {donnees.telephone ? <LigneDetail label="Numéro de téléphone" value={donnees.telephone} isTel /> : null}
        <LigneDetail label="Date et heure de livraison" value={formaterDateLivraison(donnees.date_livraison_prevue)} />
      </div>

      <div className="mx-auto my-3 h-px w-[91%]" style={{ backgroundColor: "rgba(226, 232, 240, 1)" }} />

      <div className="rounded-[9px] bg-[#F7F7F7] p-3">
        <div className="space-y-2">
          <LignePrix label="Prix du produit" value={donnees.prix_produit} />
          <LignePrix label="Frais de livraison" value={donnees.frais_livraison} />
          <LignePrix label="TVA" value={0} />
          <LignePrix label="Remise" value={donnees.remise} negatif={donnees.remise > 0} />
        </div>
        <div className="mx-auto my-2" style={{ height: "1px", width: "91%", backgroundColor: "rgba(226, 232, 240, 1)" }} />
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-brand-ink">Total à payer</span>
          <span className="text-sm font-extrabold text-brand-ink">{formaterMontant(donnees.total)}</span>
        </div>
      </div>

      {bonusListe.length > 0 ? (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-brand-ink">Les bonus Offert</span>
            <Image src="/images/image-bonus-offert.png" alt="" width={22} height={22} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {bonusListe.map((item, index) => (
              <span
                key={index}
                className="rounded-full px-3 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: "rgba(33, 192, 4, 1)" }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
