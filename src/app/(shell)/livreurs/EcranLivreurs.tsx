"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ChevronLeftIcon, PhoneFilledIcon, UserIcon, WhatsappIcon } from "@/components/icons";
import { SheetDetailLivreur } from "@/components/livreur/SheetDetailLivreur";
import type { LivreurListeFournisseur } from "@/lib/types";

const PALETTE_AVATAR = ["bg-blue-500", "bg-violet-500", "bg-fuchsia-500", "bg-amber-500", "bg-emerald-500"];

const ONGLETS = [
  { valeur: "tous", label: "Tout" },
  { valeur: "disponible", label: "Disponible" },
  { valeur: "occupe", label: "Occupé" },
] as const;

type Onglet = (typeof ONGLETS)[number]["valeur"];

function nomComplet(livreur: LivreurListeFournisseur): string {
  return `${livreur.prenom ?? ""} ${livreur.nom}`.trim();
}

function CarteLivreur({ livreur, onSelectionner }: { livreur: LivreurListeFournisseur; onSelectionner: () => void }) {
  const couleur = PALETTE_AVATAR[livreur.user_id % PALETTE_AVATAR.length];

  return (
    <button
      type="button"
      onClick={onSelectionner}
      className="flex items-center gap-3 rounded-2xl bg-white p-3 text-left"
      style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}
    >
      <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-white ${couleur}`}>
        {livreur.photo ? (
          <Image src={livreur.photo} alt="" fill className="object-cover" sizes="48px" />
        ) : (
          <UserIcon className="h-6 w-6" />
        )}
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
            livreur.disponible ? "bg-green-500" : "bg-orange-500"
          }`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-brand-ink">{nomComplet(livreur)}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <Image src="/images/moto.png" alt="" width={16} height={16} className="h-4 w-4 shrink-0 object-contain" />
          <span className={`shrink-0 text-xs font-semibold ${livreur.disponible ? "text-green-600" : "text-orange-600"}`}>
            {livreur.disponible ? "Disponible" : "Occupé"}
          </span>
          {livreur.zone_couverture ? <span className="truncate text-xs text-brand-muted">· {livreur.zone_couverture}</span> : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {livreur.disponible && livreur.telephone ? (
          <>
            <a
              href={`https://wa.me/${livreur.telephone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              onClick={(e) => e.stopPropagation()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white"
            >
              <WhatsappIcon className="h-4 w-4" />
            </a>
            <a
              href={`tel:${livreur.telephone}`}
              aria-label="Appeler"
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-espace flex h-9 w-9 items-center justify-center rounded-full text-white"
            >
              <PhoneFilledIcon className="h-3.5 w-3.5" />
            </a>
          </>
        ) : (
          <>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-400">
              <WhatsappIcon className="h-4 w-4" />
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-400">
              <PhoneFilledIcon className="h-3.5 w-3.5" />
            </span>
          </>
        )}
      </div>
    </button>
  );
}

/**
 * Onglet "Livreurs" (bottombar) — GET /fournisseur/moi/livreurs. Le statut
 * Disponible/Occupé est en lecture seule ici (pas de bouton pour le
 * changer) ; "Distance 5 minutes" du mockup est remplacé par
 * `zone_couverture` (texte libre) — aucune géolocalisation réelle n'existe
 * dans le projet pour calculer une vraie distance (décision explicite,
 * voir la conversation). Pas encore de clic → détail (aucun mockup fourni
 * pour cet écran-là).
 */
export function EcranLivreurs() {
  const { token } = useAuth();
  const router = useRouter();
  const [livreurs, setLivreurs] = useState<LivreurListeFournisseur[]>([]);
  const [onglet, setOnglet] = useState<Onglet>("tous");
  const [chargement, setChargement] = useState(true);
  const [livreurSelectionneId, setLivreurSelectionneId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<LivreurListeFournisseur[]>("/fournisseur/moi/livreurs", { token })
      .then((data) => {
        if (!annule) setLivreurs(data);
      })
      .catch(() => {
        if (!annule) setLivreurs([]);
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [token]);

  const total = livreurs.length;
  const disponibles = livreurs.filter((l) => l.disponible).length;

  const livreursFiltres = livreurs.filter((l) => {
    if (onglet === "disponible") return l.disponible;
    if (onglet === "occupe") return !l.disponible;
    return true;
  });

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="bg-gradient-espace shrink-0 rounded-b-[22px] px-4 pb-5 pt-4 text-white">
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

          <div className="min-w-0 flex-1">
            <p className="text-base font-extrabold leading-none">Livreur</p>
            <p className="mt-1 truncate text-xs text-white/80">
              {total} au Total · {disponibles} Disponibles
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 px-4 pt-4">
        {ONGLETS.map((option) => {
          const actif = onglet === option.valeur;
          const classe =
            option.valeur === "tous"
              ? actif
                ? "bg-gradient-espace text-white"
                : "bg-[#F5F7FA] text-brand-ink"
              : option.valeur === "disponible"
                ? actif
                  ? "bg-green-500 text-white"
                  : "border border-green-400 bg-white text-green-600"
                : actif
                  ? "bg-gray-600 text-white"
                  : "bg-[#F5F7FA] text-brand-muted";

          return (
            <button
              key={option.valeur}
              type="button"
              onClick={() => setOnglet(option.valeur)}
              className={`h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${classe}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2.5 px-4 pb-6 pt-4">
        {chargement ? (
          <p className="py-6 text-center text-sm text-brand-muted">Chargement…</p>
        ) : livreursFiltres.length === 0 ? (
          <p className="py-6 text-center text-sm text-brand-muted">Aucun livreur dans cette catégorie.</p>
        ) : (
          livreursFiltres.map((livreur) => (
            <CarteLivreur key={livreur.user_id} livreur={livreur} onSelectionner={() => setLivreurSelectionneId(livreur.user_id)} />
          ))
        )}
      </div>

      {livreurSelectionneId && token ? (
        <SheetDetailLivreur livreurId={livreurSelectionneId} token={token} onFermer={() => setLivreurSelectionneId(null)} />
      ) : null}
    </div>
  );
}
