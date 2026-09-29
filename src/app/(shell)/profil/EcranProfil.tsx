"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  ChartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  HeadsetIcon,
  MailIcon,
  MapIcon,
  PencilIcon,
  PhoneFilledIcon,
  PinIcon,
  ShieldIcon,
  UserIcon,
  WhatsappIcon,
} from "@/components/icons";
import { couleurAvatarFournisseur, initialesFournisseur } from "@/lib/avatarFournisseur";
import type { ProfilFournisseur } from "@/lib/types";

const CARTE_CLASSE = "rounded-2xl bg-white";
const CARTE_OMBRE = { boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" };

function formaterDateAdhesion(iso: string): string {
  const date = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Contrairement à Cordinateur_App_Web (le coordinateur consulte un AUTRE
 * fournisseur, une ligne vide n'a pas de sens dans ce résumé de lecture
 * seule), ici le fournisseur consulte SA PROPRE fiche : une ligne cachée
 * quand elle est vide donne l'impression que la carte entière a disparu
 * (signalé par l'utilisateur) — toujours affichée, avec "Non renseigné" en
 * repli, pour que la structure de la carte reste visible et invite à
 * compléter via "Modifier".
 */
function LigneInfo({ icone, label, valeur, accessoire }: { icone: ReactNode; label: string; valeur: string | null; accessoire?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-brand-line px-4 py-3 last:border-b-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[color:var(--brand-blue-end)]">{icone}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">{label}</p>
        <p className={`mt-0.5 truncate text-sm font-bold ${valeur ? "text-brand-ink" : "text-brand-muted"}`}>{valeur ?? "Non renseigné"}</p>
      </div>
      {accessoire}
    </div>
  );
}

/** "Confidentialité et UGC"/"Contactez le service" — pas encore branchées (aucune page cible construite), même convention que Ordi'Space_Livreur_App_mobile/.../EcranCompte.tsx. */
function LigneMenu({ icone, iconeClasse, label }: { icone: ReactNode; iconeClasse: string; label: string }) {
  return (
    <button
      type="button"
      aria-label={`${label} (à venir)`}
      className="flex w-full items-center gap-3 border-b border-brand-line px-4 py-3.5 text-left last:border-b-0"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconeClasse}`}>{icone}</span>
      <span className="flex-1 text-sm font-bold text-brand-ink">{label}</span>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-brand-muted" />
    </button>
  );
}

/**
 * "Profil" — ouvert au tap sur l'avatar de l'écran Space. Même écran que
 * Cordinateur_App_Web/src/app/fournisseur/[id]/profil/EcranProfilFournisseur.tsx
 * (utilisé là-bas par le Coordinateur pour consulter un fournisseur), avec
 * deux différences : c'est ici le fournisseur qui consulte SA PROPRE fiche
 * (GET /moi/profil, pas /fournisseurs/{id}) et un bouton "Modifier" est donc
 * pertinent (contrairement au Coordinateur qui ne peut pas éditer la fiche
 * d'un autre — voir MoiController::profil() : "fiche entreprise éditable
 * via FournisseurController::modifierMonProfil()"). La ligne "Statistique"
 * mène à un vrai écran (voir /statistiques), pas "bientôt disponible".
 */
export function EcranProfil() {
  const { token } = useAuth();
  const router = useRouter();
  const [profil, setProfil] = useState<ProfilFournisseur | null>(null);

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<ProfilFournisseur>("/moi/profil", { token })
      .then((data) => {
        if (!annule) setProfil(data);
      })
      .catch(() => {
        if (!annule) setProfil(null);
      });

    return () => {
      annule = true;
    };
  }, [token]);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="bg-gradient-espace shrink-0 rounded-b-[30px] px-4 pb-8 pt-4 text-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Retour"
            className="flex h-[31px] w-8 shrink-0 items-center justify-center rounded-[7px]"
            style={{ background: "rgba(255, 255, 255, 0.23)" }}
          >
            <ChevronLeftIcon className="h-[19px] w-[19px]" />
          </button>

          {profil ? (
            <div
              className="flex flex-1 items-center gap-3 p-2.5"
              style={{ borderRadius: "13px", background: "rgba(255, 255, 255, 0.29)", border: "1px solid rgba(255, 255, 255, 0.25)" }}
            >
              {profil.photo ? (
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
                  <Image src={profil.photo} alt="" fill className="object-cover" />
                </div>
              ) : (
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${couleurAvatarFournisseur(profil.id)}`}
                >
                  {initialesFournisseur(profil.nom_entreprise)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold uppercase tracking-wide">{profil.nom_entreprise}</p>
                <p className="mt-0.5 text-xs text-white/80">Membre depuis : {formaterDateAdhesion(profil.created_at)}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <button
            type="button"
            onClick={() => router.push("/profil/modifier")}
            aria-label="Modifier mon profil"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ background: "rgba(255, 255, 255, 0.23)" }}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="-mt-4 px-4">
        <div className={CARTE_CLASSE} style={{ borderRadius: "26px", boxShadow: "0px 12px 12px 12px rgba(29, 99, 224, 0.08)" }}>
          <LigneInfo
            icone={<PhoneFilledIcon className="h-4 w-4" />}
            label="Téléphone"
            valeur={profil?.contact_pro ?? null}
            accessoire={
              profil?.contact_pro ? (
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={`https://wa.me/${profil.contact_pro.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white"
                  >
                    <WhatsappIcon className="h-4 w-4" />
                  </a>
                  <a
                    href={`tel:${profil.contact_pro}`}
                    aria-label="Appeler"
                    className="bg-gradient-espace flex h-9 w-9 items-center justify-center rounded-full text-white"
                  >
                    <PhoneFilledIcon className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : null
            }
          />
          <LigneInfo icone={<PinIcon className="h-4 w-4" />} label="Adresse" valeur={profil?.adresse_entreprise ?? null} />
          <LigneInfo icone={<ClockIcon className="h-4 w-4" />} label="Horaires" valeur={profil?.horaires_ouverture ?? null} />
          <LigneInfo icone={<MapIcon className="h-4 w-4" />} label="Zone couverte" valeur={profil?.zone_couverte ?? null} />
          <LigneInfo icone={<MailIcon className="h-4 w-4" />} label="Email" valeur={profil?.email ?? null} />
        </div>

        <button
          type="button"
          aria-label="Détail du gérant (à venir)"
          className={`mt-4 flex w-full items-center gap-3 p-3 ${CARTE_CLASSE}`}
          style={CARTE_OMBRE}
        >
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EEF1F6] text-brand-muted">
            <UserIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">Gérant</p>
            <p className={`truncate text-sm font-bold ${profil?.nom_gerant ? "text-brand-ink" : "text-brand-muted"}`}>
              {profil?.nom_gerant ?? "Non renseigné"}
            </p>
            {profil?.telephone_gerant ? <p className="text-xs text-brand-muted">{profil.telephone_gerant}</p> : null}
          </div>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-brand-muted" />
        </button>

        <button
          type="button"
          onClick={() => router.push("/statistiques")}
          aria-label="Statistiques"
          className={`mt-4 flex w-full items-center gap-3 p-4 ${CARTE_CLASSE}`}
          style={CARTE_OMBRE}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[color:var(--brand-blue-end)]">
            <ChartIcon className="h-4 w-4" />
          </span>
          <span className="flex-1 text-left text-sm font-bold text-[color:var(--brand-blue-end)]">Statistique</span>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-brand-muted" />
        </button>

        <div className={`mt-4 mb-6 ${CARTE_CLASSE}`} style={CARTE_OMBRE}>
          <LigneMenu icone={<ShieldIcon className="h-4.5 w-4.5" />} iconeClasse="bg-indigo-50 text-indigo-500" label="Confidentialité et UGC" />
          <LigneMenu icone={<HeadsetIcon className="h-4.5 w-4.5" />} iconeClasse="bg-amber-50 text-amber-500" label="Contactez le service" />
        </div>
      </div>
    </div>
  );
}
