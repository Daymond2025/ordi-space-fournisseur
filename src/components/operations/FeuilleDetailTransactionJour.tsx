"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { ChevronDownIcon, DossierTelechargementIcon, MonitorIcon } from "@/components/icons";
import { formaterMontant, type LigneDetailTransactionJour } from "@/lib/types";

function formaterEnTeteJour(dateStr: string): { label: string; date: string } {
  const jour = new Date(`${dateStr}T00:00:00`);
  const dateFormatee = jour.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase().replace(/ /g, " - ");

  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const diffJours = Math.round((aujourdhui.getTime() - jour.getTime()) / 86_400_000);

  if (diffJours === 0) return { label: "Aujourd'hui", date: dateFormatee };
  if (diffJours === 1) return { label: "Hier", date: dateFormatee };
  return { label: dateFormatee, date: dateFormatee };
}

function formaterStatutCommande(statut: string): string {
  const libelles: Record<string, string> = {
    livree: "Commande livrée",
    en_cours: "Commande en cours",
    validee: "Commande validée",
    en_preparation: "Commande en préparation",
  };
  return libelles[statut] ?? "Commande";
}

/**
 * Détail d'une carte "Aujourd'hui — XX COMMANDES" du Centre de paiement —
 * liste les commandes individuelles derrière l'agrégat du jour, puis (étape
 * "paiement", après clic sur "Payer") le formulaire de déclaration du
 * règlement. `statut` décrit toujours le versement Ordi'Space → fournisseur,
 * jamais une commission due par lui. Le "Payer" final n'a volontairement
 * aucune logique de soumission — aucun endpoint de confirmation de paiement
 * n'existe encore côté back-office (à préciser par un futur mockup, comme
 * convenu : "nous y viendrons").
 */
export function FeuilleDetailTransactionJour({
  produitId,
  token,
  date,
  statut,
  montantTotal,
  nombreCommandes,
  photoProduit,
  onFermer,
}: {
  produitId: number;
  token: string;
  date: string;
  statut: "en_attente" | "paye";
  montantTotal: number;
  nombreCommandes: number;
  photoProduit: string | null;
  onFermer: () => void;
}) {
  const [lignes, setLignes] = useState<LigneDetailTransactionJour[] | null>(null);
  const [etape, setEtape] = useState<"liste" | "paiement">("liste");

  // Formulaire de déclaration du règlement (étape "paiement").
  const [commandesSelectionnees, setCommandesSelectionnees] = useState<number[]>([]);
  const [selecteurCommandesOuvert, setSelecteurCommandesOuvert] = useState(false);
  const [toutPayer, setToutPayer] = useState(false);
  const [modePaiement, setModePaiement] = useState("");
  const [fichierPreuve, setFichierPreuve] = useState<File | null>(null);
  const inputFichierRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let annule = false;
    apiFetch<LigneDetailTransactionJour[]>(`/produits/${produitId}/centre-paiement/jour?date=${date}&statut=${statut}`, { token })
      .then((data) => {
        if (!annule) setLignes(data);
      })
      .catch(() => {
        if (!annule) setLignes([]);
      });
    return () => {
      annule = true;
    };
  }, [produitId, token, date, statut]);

  const { label, date: dateFormatee } = formaterEnTeteJour(date);

  function basculerCommande(id: number) {
    setCommandesSelectionnees((prec) => (prec.includes(id) ? prec.filter((c) => c !== id) : [...prec, id]));
  }

  function basculerToutPayer(coche: boolean) {
    setToutPayer(coche);
    setCommandesSelectionnees(coche ? (lignes ?? []).map((l) => l.commande_id) : []);
  }

  const libelleSelecteur = useMemo(() => {
    if (toutPayer) return "Toutes les commandes";
    if (commandesSelectionnees.length === 0) return "Sélectionner les commandes À payées";
    return `${commandesSelectionnees.length} commande${commandesSelectionnees.length > 1 ? "s" : ""} sélectionnée${commandesSelectionnees.length > 1 ? "s" : ""}`;
  }, [toutPayer, commandesSelectionnees]);

  const peutPayer = Boolean(modePaiement) && (toutPayer || commandesSelectionnees.length > 0);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onFermer}>
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-white pb-4 pt-3" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-brand-line" />

        <div className="flex shrink-0 items-start justify-between px-4 pb-3">
          <div>
            <p className="text-xs text-brand-muted">{label}</p>
            <p className="text-sm font-extrabold text-brand-ink">{dateFormatee}</p>
            <p className="mt-1.5 inline-block rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-brand-ink">
              {String(nombreCommandes).padStart(2, "0")} COMMANDES
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-brand-muted">{statut === "paye" ? "Versé" : "À Payer"}</p>
            <p className="mt-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-3 py-1.5 text-sm font-extrabold text-white">
              {formaterMontant(montantTotal)}
            </p>
          </div>
        </div>

        {etape === "liste" ? (
          <>
            <div className="flex flex-col gap-2.5 overflow-y-auto px-4 pb-2">
              {lignes === null ? (
                <p className="py-6 text-center text-sm text-brand-muted">Chargement…</p>
              ) : lignes.length === 0 ? (
                <p className="py-6 text-center text-sm text-brand-muted">Aucune commande.</p>
              ) : (
                lignes.map((ligne) => (
                  <div
                    key={ligne.commande_id}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3"
                    style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[#F6F8FE]">
                      {ligne.photo ?? photoProduit ? (
                        <Image src={(ligne.photo ?? photoProduit) as string} alt="" fill className="object-cover" sizes="44px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-brand-muted">
                          <MonitorIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-brand-ink">{formaterStatutCommande(ligne.statut_commande).toUpperCase()}</p>
                      <p className="truncate text-[11px] text-brand-muted">{label} à {ligne.heure}</p>
                      <p className="truncate text-[11px] text-brand-muted">
                        {ligne.zone_livraison ?? "—"}
                        {ligne.telephone ? (
                          <>
                            {" "}
                            <a href={`tel:${ligne.telephone}`} className="font-semibold text-blue-600">
                              {ligne.telephone}
                            </a>
                          </>
                        ) : null}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-brand-muted">{ligne.statut === "paye" ? "Versé" : "À Payer"}</p>
                      <p
                        className={`rounded-md px-2 py-0.5 text-xs font-extrabold ${
                          ligne.statut === "paye" ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-500"
                        }`}
                      >
                        {formaterMontant(ligne.montant)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="shrink-0 px-4 pt-3">
              <button
                type="button"
                onClick={() => setEtape("paiement")}
                className="h-[52px] w-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400 text-sm font-bold text-white"
              >
                Payer
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="shrink-0 border-t border-brand-line" />

            <div className="flex flex-col gap-3 overflow-y-auto px-4 py-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSelecteurCommandesOuvert((v) => !v)}
                  className="flex w-full items-center justify-between rounded-2xl border border-sky-300 px-4 py-3 text-left text-sm text-brand-ink"
                >
                  <span className={commandesSelectionnees.length === 0 && !toutPayer ? "text-brand-muted" : ""}>{libelleSelecteur}</span>
                  <ChevronDownIcon className="h-4 w-4 shrink-0 text-brand-muted" />
                </button>

                {selecteurCommandesOuvert ? (
                  <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-2xl border border-sky-200 bg-white p-2 shadow-lg">
                    {(lignes ?? []).map((ligne) => (
                      <label key={ligne.commande_id} className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-brand-ink">
                        <input
                          type="checkbox"
                          checked={toutPayer || commandesSelectionnees.includes(ligne.commande_id)}
                          disabled={toutPayer}
                          onChange={() => basculerCommande(ligne.commande_id)}
                          className="h-4 w-4 shrink-0 rounded border-sky-400 text-blue-600"
                        />
                        <span className="min-w-0 flex-1 truncate">Commande #{ligne.commande_id}</span>
                        <span className="shrink-0 text-xs font-semibold text-brand-muted">{formaterMontant(ligne.montant)}</span>
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <select
                  value={modePaiement}
                  onChange={(e) => setModePaiement(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-sky-300 px-4 py-3 text-sm text-brand-ink"
                >
                  <option value="" disabled>
                    Mode de paiement
                  </option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="especes">Espèces</option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              </div>

              <label className="flex items-center justify-between py-1">
                <span className="text-sm font-bold text-brand-ink">TOUT PAYER</span>
                <input
                  type="checkbox"
                  checked={toutPayer}
                  onChange={(e) => basculerToutPayer(e.target.checked)}
                  className="h-5 w-5 rounded-md border-2 border-sky-400 text-blue-600"
                />
              </label>

              <button
                type="button"
                onClick={() => inputFichierRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-sky-300 px-4 py-10 text-center"
              >
                <DossierTelechargementIcon className="h-10 w-10" />
                <span className="text-sm text-brand-ink">
                  {fichierPreuve ? fichierPreuve.name : (
                    <>
                      Télécharger la facture ou
                      <br />
                      la preuve de paiement
                    </>
                  )}
                </span>
              </button>
              <input
                ref={inputFichierRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setFichierPreuve(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="shrink-0 px-4 pt-1">
              <button
                type="button"
                disabled={!peutPayer}
                className="h-[52px] w-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400 text-sm font-bold text-white disabled:opacity-50"
              >
                Payer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
