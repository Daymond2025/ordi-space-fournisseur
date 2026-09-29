"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ChevronLeftIcon } from "@/components/icons";
import type { ProfilFournisseur } from "@/lib/types";

const CHAMP_CLASSE = "w-full rounded-2xl border border-brand-line px-4 py-3 text-sm text-brand-ink outline-none placeholder:text-brand-muted";

/**
 * "Modifier mon profil" — PATCH /fournisseur/moi/profil
 * (FournisseurController::modifierMonProfil()), les 7 seuls champs que le
 * fournisseur peut éditer lui-même ; `nom_entreprise`/`taux_commission`/
 * `solde_portefeuille` restent fixés par le staff (voir la doc de cette
 * méthode côté backend), donc absents de ce formulaire.
 */
export function EcranModifierProfil() {
  const { token } = useAuth();
  const router = useRouter();

  const [chargement, setChargement] = useState(true);
  const [adresseEntreprise, setAdresseEntreprise] = useState("");
  const [contactPro, setContactPro] = useState("");
  const [nomGerant, setNomGerant] = useState("");
  const [telephoneGerant, setTelephoneGerant] = useState("");
  const [horairesOuverture, setHorairesOuverture] = useState("");
  const [lienMaps, setLienMaps] = useState("");
  const [zoneCouverte, setZoneCouverte] = useState("");

  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<ProfilFournisseur>("/moi/profil", { token })
      .then((data) => {
        if (annule) return;
        setAdresseEntreprise(data.adresse_entreprise ?? "");
        setContactPro(data.contact_pro ?? "");
        setNomGerant(data.nom_gerant ?? "");
        setTelephoneGerant(data.telephone_gerant ?? "");
        setHorairesOuverture(data.horaires_ouverture ?? "");
        setLienMaps(data.lien_maps ?? "");
        setZoneCouverte(data.zone_couverte ?? "");
      })
      .catch(() => {})
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [token]);

  async function enregistrer() {
    if (!token || enregistrement) return;
    setErreur(null);
    setEnregistrement(true);
    try {
      await apiFetch("/fournisseur/moi/profil", {
        method: "PATCH",
        token,
        body: {
          adresse_entreprise: adresseEntreprise.trim() || null,
          contact_pro: contactPro.trim() || null,
          nom_gerant: nomGerant.trim() || null,
          telephone_gerant: telephoneGerant.trim() || null,
          horaires_ouverture: horairesOuverture.trim() || null,
          lien_maps: lienMaps.trim() || null,
          zone_couverte: zoneCouverte.trim() || null,
        },
      });
      router.back();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="bg-gradient-espace flex h-[80px] shrink-0 items-center gap-3 px-4 text-white">
        <button type="button" onClick={() => router.back()} aria-label="Retour" className="flex h-8 w-8 shrink-0 items-center justify-center">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <p className="text-base font-extrabold leading-none">Modifier mon profil</p>
      </div>

      {chargement ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : (
        <div className="space-y-3 px-4 py-4">
          <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-muted">Contact</p>
            <div className="space-y-3">
              <input
                value={contactPro}
                onChange={(e) => setContactPro(e.target.value)}
                placeholder="Téléphone professionnel"
                className={CHAMP_CLASSE}
              />
              <input value={adresseEntreprise} onChange={(e) => setAdresseEntreprise(e.target.value)} placeholder="Adresse" className={CHAMP_CLASSE} />
              <input
                value={horairesOuverture}
                onChange={(e) => setHorairesOuverture(e.target.value)}
                placeholder="Horaires d'ouverture"
                className={CHAMP_CLASSE}
              />
              <input value={zoneCouverte} onChange={(e) => setZoneCouverte(e.target.value)} placeholder="Zone couverte" className={CHAMP_CLASSE} />
              <input value={lienMaps} onChange={(e) => setLienMaps(e.target.value)} placeholder="Lien Google Maps" className={CHAMP_CLASSE} />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-muted">Gérant</p>
            <div className="space-y-3">
              <input value={nomGerant} onChange={(e) => setNomGerant(e.target.value)} placeholder="Nom du gérant" className={CHAMP_CLASSE} />
              <input
                value={telephoneGerant}
                onChange={(e) => setTelephoneGerant(e.target.value)}
                placeholder="Téléphone du gérant"
                className={CHAMP_CLASSE}
              />
            </div>
          </div>

          {erreur ? <p className="text-center text-xs text-red-500">{erreur}</p> : null}

          <button
            type="button"
            disabled={enregistrement}
            onClick={enregistrer}
            className="bg-gradient-espace h-12 w-full rounded-[11px] text-sm font-bold text-white disabled:opacity-50"
          >
            {enregistrement ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      )}
    </div>
  );
}
