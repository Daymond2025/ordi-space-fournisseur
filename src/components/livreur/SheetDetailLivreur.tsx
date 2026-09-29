"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { apiFetch } from "@/lib/api";
import { MapIcon, MonitorIcon, PhoneFilledIcon, TruckIcon, UserIcon, WhatsappIcon } from "@/components/icons";
import type { LivraisonDisponibleFournisseur, LivreurDetailFournisseur } from "@/lib/types";

function formaterFcfa(valeur: number): string {
  return `${Math.round(valeur).toLocaleString("en-US").replace(/,/g, ".")} FCFA`;
}

function nomComplet(livreur: LivreurDetailFournisseur): string {
  return `${livreur.prenom ?? ""} ${livreur.nom}`.trim();
}

function CarteStat({
  valeur,
  label,
  texte,
  fond,
  border,
  tailleValeur = "text-2xl",
}: {
  valeur: string;
  label: string;
  texte: string;
  fond: string;
  border?: string;
  tailleValeur?: string;
}) {
  return (
    <div className={`flex h-[79px] flex-col justify-center rounded-[14px] px-4 ${texte}`} style={{ background: fond, border }}>
      <p className={`whitespace-nowrap font-extrabold ${tailleValeur}`}>{valeur}</p>
      <p className="mt-1 text-xs font-semibold">{label}</p>
    </div>
  );
}

function BoutonAction({ icone, label, style, ...props }: { icone: ReactNode; label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="flex h-[44px] items-center justify-center gap-2 rounded-[9px] text-sm font-bold text-white disabled:opacity-50" style={style} {...props}>
      {icone}
      {label}
    </button>
  );
}

function PilleZone({ label, couleur }: { label: string; couleur: "bleu" | "orange" }) {
  const classes = couleur === "bleu" ? "bg-blue-50 text-[color:var(--brand-blue-end)]" : "bg-orange-50 text-orange-600";
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${classes}`}>{label}</span>;
}

/** "Temps Estimé" est décoratif (aucune donnée de durée/distance dans le schéma) ; frais_livraison est une vraie colonne. */
function CarteLivraisonAssignable({
  livraison,
  selectionnee,
  onToggle,
}: {
  livraison: LivraisonDisponibleFournisseur;
  selectionnee: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-3" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F6F8FE]">
        {livraison.photo ? (
          <Image src={livraison.photo} alt="" fill className="object-cover" sizes="64px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-muted">
            <MonitorIcon className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 text-sm font-bold leading-snug text-brand-ink">{livraison.nom_produit ?? "Produit"}</p>
          <button
            type="button"
            onClick={onToggle}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold text-white ${selectionnee ? "bg-green-500" : "bg-[color:var(--brand-blue-end)]"}`}
          >
            {selectionnee ? "Assigné" : "Assigner"}
          </button>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {livraison.zone_depart ? <PilleZone label={livraison.zone_depart} couleur="bleu" /> : null}
          {livraison.zone_depart && livraison.zone_destination ? <span className="text-xs text-brand-muted">→</span> : null}
          {livraison.zone_destination ? <PilleZone label={livraison.zone_destination} couleur="orange" /> : null}
        </div>

        <div className="mt-1.5 flex items-center justify-between">
          <span className="whitespace-nowrap text-xs text-brand-muted">
            Temps Estimé <span className="font-bold text-brand-ink">33 Min</span>
          </span>
          <span className="whitespace-nowrap text-xs font-bold text-[color:var(--brand-blue-end)]">{formaterFcfa(livraison.frais_livraison)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Feuille détail livreur — ouverte au tap sur une carte de l'écran liste
 * (EcranLivreurs.tsx). Reprend Cordinateur_App_Web/src/components/livreur/
 * SheetDetailLivreur.tsx (même mockup, vue "assigner" imbriquée incluse) —
 * MAIS le vivier consommé (GET /fournisseur/moi/livraisons-disponibles) et
 * l'assignation (POST /commandes/{id}/assigner-livreur-fournisseur) sont
 * TOUJOURS bornés aux propres commandes du fournisseur connecté (pas de
 * sélecteur de fournisseur comme côté Coordinateur — implicite). Reste
 * cohérent avec "Envoyer à un livreur" (EcranRechercheLivreur.tsx, qui
 * n'autorise pas de choix manuel côté fournisseur) : ici c'est un choix
 * manuel, mais réservé au vivier de SES propres commandes, jamais un pouvoir
 * de réaffectation générale (voir CommandeController::
 * assignerLivreurParFournisseur()). "Les Missions" et "Suivre" restent sans
 * logique (aucun écran mission côté fournisseur, aucune géolocalisation réelle).
 */
export function SheetDetailLivreur({ livreurId, token, onFermer }: { livreurId: number; token: string; onFermer: () => void }) {
  const [vue, setVue] = useState<"detail" | "assigner">("detail");
  const [livreur, setLivreur] = useState<LivreurDetailFournisseur | null>(null);
  const [livraisons, setLivraisons] = useState<LivraisonDisponibleFournisseur[] | null>(null);
  const [selectionnees, setSelectionnees] = useState<Set<number>>(new Set());
  const [chargementAssignation, setChargementAssignation] = useState(true);
  const [enCours, setEnCours] = useState(false);

  const chargerDetail = useCallback(async () => {
    const data = await apiFetch<LivreurDetailFournisseur>(`/fournisseur/moi/livreurs/${livreurId}`, { token });
    setLivreur(data);
  }, [token, livreurId]);

  useEffect(() => {
    let annule = false;
    apiFetch<LivreurDetailFournisseur>(`/fournisseur/moi/livreurs/${livreurId}`, { token })
      .then((data) => {
        if (!annule) setLivreur(data);
      })
      .catch(() => {
        if (!annule) setLivreur(null);
      });
    return () => {
      annule = true;
    };
  }, [token, livreurId]);

  useEffect(() => {
    if (vue !== "assigner") return;
    let annule = false;

    apiFetch<LivraisonDisponibleFournisseur[]>("/fournisseur/moi/livraisons-disponibles", { token })
      .then((data) => {
        if (!annule) setLivraisons(data);
      })
      .catch(() => {
        if (!annule) setLivraisons([]);
      })
      .finally(() => {
        if (!annule) setChargementAssignation(false);
      });

    return () => {
      annule = true;
    };
  }, [vue, token]);

  function toggleSelection(commandeId: number) {
    setSelectionnees((precedent) => {
      const suivant = new Set(precedent);
      if (suivant.has(commandeId)) suivant.delete(commandeId);
      else suivant.add(commandeId);
      return suivant;
    });
  }

  async function envoyerSelection() {
    if (enCours || selectionnees.size === 0) return;
    setEnCours(true);
    try {
      for (const commandeId of selectionnees) {
        await apiFetch(`/commandes/${commandeId}/assigner-livreur-fournisseur`, { method: "POST", token, body: { livreur_id: livreurId } });
      }
      await chargerDetail();
      setVue("detail");
      setLivraisons(null);
      setSelectionnees(new Set());
      setChargementAssignation(true);
    } finally {
      setEnCours(false);
    }
  }

  const stats = livreur?.statistiques;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onFermer}>
      <div className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white pb-6 pt-3" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-brand-line" />

        {vue === "assigner" ? (
          <div className="flex max-h-[85dvh] flex-col px-4">
            <p className="mb-1 text-center text-base font-extrabold uppercase tracking-wide text-brand-ink">Assigner une nouvelle mission</p>
            <p className="mb-4 text-center text-sm font-bold text-brand-ink">Les commandes à livrer</p>

            <div className="flex-1 space-y-2.5 overflow-y-auto pb-2">
              {chargementAssignation ? (
                <p className="py-6 text-center text-sm text-brand-muted">Chargement…</p>
              ) : !livraisons || livraisons.length === 0 ? (
                <p className="py-6 text-center text-sm text-brand-muted">Aucune livraison en attente d&apos;affectation.</p>
              ) : (
                livraisons.map((livraison) => (
                  <CarteLivraisonAssignable
                    key={livraison.commande_id}
                    livraison={livraison}
                    selectionnee={selectionnees.has(livraison.commande_id)}
                    onToggle={() => toggleSelection(livraison.commande_id)}
                  />
                ))
              )}
            </div>

            <div className="flex justify-center pb-2 pt-4">
              <button
                type="button"
                disabled={selectionnees.size === 0 || enCours}
                onClick={envoyerSelection}
                className="h-[50px] w-[336px] max-w-full rounded-[25px] border-[3px] text-sm font-extrabold uppercase tracking-wide text-white disabled:opacity-50"
                style={{
                  background: "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)",
                  borderColor: "rgba(255, 255, 255, 0.59)",
                  boxShadow: "0px 12px 12px 5px rgba(0, 0, 0, 0.15)",
                }}
              >
                {enCours ? "Envoi…" : "Envoyer"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center px-6 pb-4 text-center">
              <div className="bg-gradient-espace relative flex h-24 w-24 items-center justify-center rounded-full text-white">
                <UserIcon className="h-12 w-12" />
                {livreur ? (
                  <span
                    className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white ${
                      livreur.disponible ? "bg-green-500" : "bg-orange-500"
                    }`}
                  />
                ) : null}
              </div>

              <p className="mt-3 text-lg font-extrabold text-brand-ink">{livreur ? nomComplet(livreur) : "…"}</p>

              {livreur ? (
                <span className={`mt-1 rounded-full px-4 py-1 text-xs font-bold text-white ${livreur.disponible ? "bg-green-500" : "bg-orange-500"}`}>
                  {livreur.disponible ? "Disponible" : "Occupé"}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-x-[9px] gap-y-[11px] px-[19px]">
              <CarteStat valeur={String(stats?.commandes_total ?? "—")} label="Commandes total" texte="text-[color:var(--brand-blue-end)]" fond="rgba(219, 239, 255, 1)" />
              <CarteStat
                valeur={String(stats?.commandes_livrees ?? "—")}
                label="Commande livrée"
                texte="text-green-600"
                fond="rgba(232, 255, 246, 1)"
                border="1px solid rgba(137, 247, 206, 1)"
              />
              <CarteStat valeur={String(stats?.commandes_retournees ?? "—")} label="commandes retourné" texte="text-rose-500" fond="rgba(255, 242, 240, 1)" />
              <CarteStat
                valeur={stats ? formaterFcfa(stats.gains_total_recu) : "—"}
                label="Gains total reçu"
                texte="text-[color:var(--brand-blue-end)]"
                fond="rgba(0, 119, 255, 0.08)"
                tailleValeur="text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-x-[15px] gap-y-[11px] px-[19px] pt-3">
              <BoutonAction
                icone={<TruckIcon className="h-4 w-4" />}
                label="Les Missions"
                style={{ background: "linear-gradient(273.52deg, #FFCC00 -3.09%, #FF7800 98.47%)" }}
                aria-label="Les Missions (à venir)"
              />
              <BoutonAction icone={<MapIcon className="h-4 w-4" />} label="Suivre" style={{ background: "rgba(0, 119, 255, 1)" }} aria-label="Suivre (à venir)" />
              <BoutonAction
                icone={<WhatsappIcon className="h-4 w-4" />}
                label="WhatsApp"
                style={{ background: "rgba(34, 197, 94, 1)", border: "1px solid rgba(137, 247, 206, 1)" }}
                disabled={!livreur?.telephone}
                onClick={() => {
                  if (livreur?.telephone) window.open(`https://wa.me/${livreur.telephone.replace(/\D/g, "")}`, "_blank");
                }}
              />
              <BoutonAction
                icone={<PhoneFilledIcon className="h-3.5 w-3.5" />}
                label="Appelle"
                style={{ background: "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)" }}
                disabled={!livreur?.telephone}
                onClick={() => {
                  if (livreur?.telephone) window.location.href = `tel:${livreur.telephone}`;
                }}
              />
            </div>

            <div className="flex justify-center px-6 pb-2 pt-8">
              <button
                type="button"
                onClick={() => setVue("assigner")}
                className="h-[50px] w-[336px] max-w-full rounded-[25px] border-[3px] text-sm font-extrabold uppercase tracking-wide text-white"
                style={{
                  background: "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)",
                  borderColor: "rgba(255, 255, 255, 0.59)",
                  boxShadow: "0px 12px 12px 5px rgba(0, 0, 0, 0.15)",
                }}
              >
                Assigner une nouvelle mission
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
