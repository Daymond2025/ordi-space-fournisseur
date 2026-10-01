"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { CameraIcon, ChevronLeftIcon, ImageIcon } from "@/components/icons";
import type { Categorie } from "@/lib/types";
import {
  CADEAUX_DISPONIBLES,
  CARTES_GRAPHIQUES,
  CATEGORIES_AJOUT as CATEGORIES,
  COULEURS,
  ETATS_PRODUIT,
  MARQUES,
  NOMS_CATEGORIE_REELS,
  PROCESSEURS,
  QUANTITES,
  RAMS,
  SYSTEMES_EXPLOITATION,
  TAILLES_ECRAN,
  TYPES_DISQUE,
  TYPES_LIVRAISON,
} from "@/lib/produitBoutique";
import { BaremeLivraison, ajouterBaremeAuFormData } from "@/components/produit/BaremeLivraison";

const CARTE_CLASSE = "rounded-2xl bg-white p-4";
const CARTE_OMBRE = { boxShadow: "0px 1px 100px 0px rgba(29, 99, 224, 0.08)" };
const CHAMP_CLASSE = "w-full rounded-2xl border border-brand-line px-4 py-3 text-sm text-brand-ink outline-none placeholder:text-brand-muted";

/**
 * "Ajouter un produit" (bouton + de "Mes produits") — même écran que
 * Cordinateur_App_Web/src/app/produit/nouveau/EcranChoixCategorieProduit.tsx,
 * SAUF : pas de champ "Prix de vente" (StoreProduitRequest::rules() —
 * `Rule::prohibitedIf` pour un fournisseur, la requête serait rejetée s'il en
 * envoyait un ; le prix public reste fixé par le Coordinateur à la
 * publication) et le bouton final envoie POST /produits qui, pour un
 * fournisseur, crée le produit "en_attente" — jamais "valide" directement
 * (voir ProduitController::store()). "Vente par les livreurs" (commission de
 * revente, prix barré, réduction, état) reste modifiable ici : ces champs
 * sont explicitement autorisés "par qui crée le produit" côté validation.
 *
 * Étape "infos" : sélecteur "Type de livraison" (physique/numérique) — sans
 * lui le fournisseur ne pouvait jamais ajouter un logiciel/licence, le champ
 * était toujours forcé à "physique" côté requête. "Numérique" masque aussi
 * la carte "Frais de livraison" à l'étape finale (aucun livreur impliqué,
 * voir Produit::estNumerique()). Étape "caractéristiques" : "Garantie"
 * (duree_garantie_mois, déjà affichée sur la fiche produit mais jusqu'ici
 * jamais saisissable à la création). Étape finale : "Pack complet"
 * (contenu_pack) — alimente l'onglet du même nom dans InfosProduit.tsx,
 * vide jusqu'ici faute de champ pour le remplir.
 */
export function EcranAjouterProduit() {
  const router = useRouter();
  const { token } = useAuth();
  const fichierRef = useRef<HTMLInputElement>(null);

  const [etape, setEtape] = useState<"categorie" | "infos" | "caracteristiques" | "final">("categorie");
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [categorieChoisie, setCategorieChoisie] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photosFichiers, setPhotosFichiers] = useState<File[]>([]);
  const [nomProduit, setNomProduit] = useState("");
  const [marque, setMarque] = useState("");
  // "physique" par défaut (comportement historique inchangé) — "numerique"
  // pour un logiciel/licence, jamais remis à une livraison (voir
  // Produit::estNumerique()).
  const [typeLivraison, setTypeLivraison] = useState<"physique" | "numerique">("physique");
  const [dureeGarantie, setDureeGarantie] = useState("");

  const [processeur, setProcesseur] = useState("");
  const [carteGraphique, setCarteGraphique] = useState("");
  const [ram, setRam] = useState("");
  const [disqueDurCapacite, setDisqueDurCapacite] = useState("");
  const [disqueDurType, setDisqueDurType] = useState("SSD");
  const [tailleEcran, setTailleEcran] = useState("");
  const [systemeExploitation, setSystemeExploitation] = useState("");
  const [description, setDescription] = useState("");

  const [couleur, setCouleur] = useState("");
  const [quantite, setQuantite] = useState("");
  const [cadeauChoisi, setCadeauChoisi] = useState("");
  // "Pack complet" (onglet déjà présent dans InfosProduit.tsx) = les cadeaux
  // sélectionnés (`cadeaux`, liste prédéfinie CADEAUX_DISPONIBLES) + des
  // articles saisis librement (`contenuPackManuel`) — les deux sont fusionnés
  // au moment de l'envoi (voir envoyer()), `cadeaux` restant par ailleurs
  // envoyé séparément tel quel (colonne dédiée côté backend).
  const [cadeaux, setCadeaux] = useState<string[]>([]);
  // Photo facultative par cadeau sélectionné (clé = nom du cadeau) —
  // fichiers réels envoyés en `images_cadeaux[nom]`, aperçus en data: (pas
  // blob:, bloqué par la CSP de cette app, voir ChampPhotoProfil.tsx).
  const [cadeauxFichiers, setCadeauxFichiers] = useState<Record<string, File>>({});
  const [cadeauxApercus, setCadeauxApercus] = useState<Record<string, string>>({});
  const cadeauFichierRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [contenuPackSaisie, setContenuPackSaisie] = useState("");
  const [contenuPackManuel, setContenuPackManuel] = useState<string[]>([]);
  const [prixPartenaire, setPrixPartenaire] = useState("");

  // État déclaratif du produit (Neuf/Occasion/…) — simple information de
  // fiche, indépendant de la "Boutique des livreurs" (commission/prix
  // barré/réduction, retirés d'ici : c'est le Coordinateur qui les fixe
  // avant publication, pas le fournisseur).
  const [etat, setEtat] = useState("");
  const [frais, setFrais] = useState<Record<number, string>>({});

  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    // Pas de garde "annule" ici : contrairement aux autres écrans, cet effet
    // ne dépend que de `token` (qui ne change jamais pendant la vie de cet
    // écran) et le référentiel des catégories est le même quel que soit
    // l'appel — appliquer une résolution "en retard" (double-appel React 19
    // Strict Mode) est donc totalement sans risque, contrairement à ignorer
    // une résolution réelle (observé : la 2ᵉ requête du double-appel ne
    // résolvait jamais côté client, laissant `categories` vide indéfiniment
    // si on ignorait la 1ʳᵉ via `annule`).
    apiFetch<Categorie[]>("/categories", { token })
      .then(setCategories)
      .catch(() => {});
  }, [token]);

  function resoudreCategorieId(label: string): number | undefined {
    const nomReel = NOMS_CATEGORIE_REELS[label] ?? label;
    return categories.find((c) => c.nom_categorie === nomReel)?.id;
  }

  async function envoyer() {
    if (!token || !categorieChoisie) return;
    const categorieId = resoudreCategorieId(categorieChoisie);
    if (!categorieId) {
      setErreurEnvoi("Catégorie introuvable, réessaie plus tard.");
      return;
    }

    setEnvoiEnCours(true);
    setErreurEnvoi(null);

    const formData = new FormData();
    formData.append("categorie_id", String(categorieId));
    formData.append("nom_produit", nomProduit);
    if (marque) formData.append("marque", marque);
    if (description.trim()) formData.append("description", description);
    formData.append("prix", prixPartenaire);
    formData.append("quantite_stock", quantite);
    formData.append("type_livraison", typeLivraison);
    if (dureeGarantie.trim()) formData.append("duree_garantie_mois", dureeGarantie);
    if (processeur) formData.append("processeur", processeur);
    if (carteGraphique) formData.append("carte_graphique", carteGraphique);
    if (ram) formData.append("memoire_ram", ram);
    if (disqueDurCapacite.trim()) formData.append("stockage", `${disqueDurCapacite.trim()} ${disqueDurType}`);
    if (tailleEcran) formData.append("taille", tailleEcran);
    if (systemeExploitation) formData.append("systeme_exploitation", systemeExploitation);
    if (couleur) formData.append("couleur", couleur);
    if (etat) formData.append("etat_produit", etat);
    // Un logiciel/licence n'est jamais livré par un livreur — aucun barème à envoyer.
    if (typeLivraison === "physique") ajouterBaremeAuFormData(formData, frais);
    cadeaux.forEach((c) => formData.append("cadeaux[]", c));
    // Pack complet = les cadeaux sélectionnés + les articles saisis à la main, fusionnés sans doublon.
    Array.from(new Set([...cadeaux, ...contenuPackManuel])).forEach((c) => formData.append("contenu_pack[]", c));
    cadeaux.forEach((c) => {
      const fichier = cadeauxFichiers[c];
      if (fichier) formData.append(`images_cadeaux[${c}]`, fichier);
    });
    photosFichiers.forEach((fichier) => formData.append("images[]", fichier));

    try {
      const produit = await apiFetch<{ id: number }>("/produits", { method: "POST", token, body: formData });
      router.push(`/produits/${produit.id}/detail`);
    } catch {
      setErreurEnvoi("L'envoi a échoué, réessaie.");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  function ajouterCadeau(valeur: string) {
    if (!valeur || cadeaux.includes(valeur)) return;
    setCadeaux((c) => [...c, valeur]);
  }

  function retirerCadeau(valeur: string) {
    setCadeaux((c) => c.filter((c2) => c2 !== valeur));
    setCadeauxFichiers((f) => {
      const copie = { ...f };
      delete copie[valeur];
      return copie;
    });
    setCadeauxApercus((a) => {
      const copie = { ...a };
      delete copie[valeur];
      return copie;
    });
  }

  function choisirImageCadeau(nomCadeau: string, fichiers: FileList | null) {
    const fichier = fichiers?.[0];
    if (!fichier) return;
    setCadeauxFichiers((f) => ({ ...f, [nomCadeau]: fichier }));
    // FileReader (data:) plutôt que URL.createObjectURL() (blob:) — la CSP de
    // cette app n'autorise pas `blob:` pour les images (voir ChampPhotoProfil.tsx).
    const lecteur = new FileReader();
    lecteur.onload = () => setCadeauxApercus((a) => ({ ...a, [nomCadeau]: lecteur.result as string }));
    lecteur.readAsDataURL(fichier);
  }

  function ajouterContenuPack() {
    const valeur = contenuPackSaisie.trim();
    if (!valeur || contenuPackManuel.includes(valeur)) return;
    setContenuPackManuel((c) => [...c, valeur]);
    setContenuPackSaisie("");
  }

  function retirerContenuPack(valeur: string) {
    setContenuPackManuel((c) => c.filter((c2) => c2 !== valeur));
  }

  function choisirCategorie(label: string) {
    setCategorieChoisie(label);
    setEtape("infos");
  }

  function ajouterPhotos(fichiers: FileList | null) {
    if (!fichiers) return;
    const liste = Array.from(fichiers);
    const urls = liste.map((fichier) => URL.createObjectURL(fichier));
    setPhotos((p) => [...p, ...urls]);
    setPhotosFichiers((f) => [...f, ...liste]);
  }

  if (etape === "categorie") {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="bg-gradient-espace relative flex h-[238px] shrink-0 flex-col items-center px-4 pt-4 text-white">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Retour"
            className="absolute left-4 top-4 flex h-8 w-8 shrink-0 items-center justify-center"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <p className="mt-8 text-center text-2xl font-extrabold">Que veux-tu vendre</p>
        </div>

        <div className="relative -mt-24 flex-1 rounded-t-[40px] bg-white px-[22px] pb-6 pt-3">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-brand-line" />

          <div className="grid grid-cols-2 gap-x-[15px] gap-y-4">
            {CATEGORIES.map((categorie) => (
              <button
                key={categorie.label}
                type="button"
                onClick={() => choisirCategorie(categorie.label)}
                className="flex h-[158px] w-[162.75px] flex-col items-center justify-center gap-3 rounded-[22px] bg-white p-6"
                style={{ border: "1px solid rgba(29, 99, 224, 0.48)", boxShadow: "0px 1px 100px 0px rgba(29, 99, 224, 0.08)" }}
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "rgba(250, 236, 252, 1)" }}>
                  <Image src={categorie.icone} alt="" width={32} height={32} className="h-8 w-8 object-contain" />
                </span>
                <span className="text-sm font-bold text-brand-ink">{categorie.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (etape === "infos") {
    return (
      <div className="flex h-full flex-col bg-[#f2f5fa]">
        <div className="relative flex h-11 shrink-0 items-center justify-center bg-[#8a8a8a]">
          <button
            type="button"
            onClick={() => setEtape("categorie")}
            aria-label="Retour"
            className="absolute left-4 flex h-8 w-8 shrink-0 items-center justify-center text-white"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          {categorieChoisie ? <p className="text-sm font-semibold text-white">{categorieChoisie}</p> : null}
        </div>

        <div className="rounded-t-[28px] bg-white pt-3">
          <div className="mx-auto h-1 w-10 rounded-full bg-brand-line" />
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-[#f2f5fa] px-4 pb-4 pt-4">
          <div className={CARTE_CLASSE} style={CARTE_OMBRE}>
            <button
              type="button"
              onClick={() => fichierRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-line py-8"
            >
              <span className="relative flex h-8 w-8 items-center justify-center text-brand-ink">
                <CameraIcon className="h-7 w-7" />
                <span className="bg-gradient-espace absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold text-white">
                  +
                </span>
              </span>
              <span className="text-sm font-bold text-brand-ink">Ajouter une photo du produit</span>
              <span className="text-xs text-brand-muted">Au moins 5 photo</span>
            </button>
            <input
              ref={fichierRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                ajouterPhotos(e.target.files);
                e.target.value = "";
              }}
            />

            <div className="mt-3 grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((index) => {
                const photo = photos[index];
                const estPrincipale = index === 0;

                return (
                  <div
                    key={index}
                    className={`relative flex aspect-square flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl ${
                      photo ? "" : estPrincipale ? "border-2 border-dashed border-[color:var(--brand-blue-end)]" : "bg-[#EAF1FE]"
                    }`}
                  >
                    {photo ? (
                      <Image src={photo} alt="" fill className="object-cover" sizes="160px" />
                    ) : (
                      <>
                        <ImageIcon className="h-6 w-6 text-[color:var(--brand-blue-end)]" />
                        {estPrincipale ? <span className="text-xs font-semibold text-brand-ink">Photo Produit</span> : null}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${CARTE_CLASSE} space-y-3`} style={CARTE_OMBRE}>
            <input
              value={nomProduit}
              onChange={(e) => setNomProduit(e.target.value)}
              placeholder="Nom du produit"
              className="w-full rounded-2xl border border-brand-line px-4 py-3 text-sm text-brand-ink outline-none placeholder:text-brand-muted"
            />
            <select value={marque} onChange={(e) => setMarque(e.target.value)} className="w-full rounded-2xl border border-brand-line px-4 py-3 text-sm text-brand-ink outline-none">
              <option value="" disabled>
                Marque
              </option>
              {MARQUES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className={CARTE_CLASSE} style={CARTE_OMBRE}>
            <p className="mb-2 text-sm font-bold text-brand-ink">Type de livraison</p>
            <div className="flex gap-2">
              {TYPES_LIVRAISON.map((t) => (
                <button
                  key={t.valeur}
                  type="button"
                  onClick={() => setTypeLivraison(t.valeur)}
                  className={`flex-1 rounded-2xl border px-3 py-3 text-center text-xs font-semibold transition-colors ${
                    typeLivraison === t.valeur
                      ? "bg-gradient-espace border-transparent text-white"
                      : "border-brand-line text-brand-muted"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white px-4 pb-6 pt-3">
          <button
            type="button"
            disabled={!nomProduit.trim()}
            onClick={() => setEtape("caracteristiques")}
            className="bg-gradient-espace h-12 w-full rounded-[11px] text-sm font-bold text-white disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </div>
    );
  }

  if (etape === "caracteristiques") {
    return (
      <div className="flex h-full flex-col bg-[#f2f5fa]">
        <div className="relative flex h-11 shrink-0 items-center justify-center bg-[#8a8a8a]">
          <button
            type="button"
            onClick={() => setEtape("infos")}
            aria-label="Retour"
            className="absolute left-4 flex h-8 w-8 shrink-0 items-center justify-center text-white"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-t-[28px] bg-white pb-1 pt-3">
          <div className="mx-auto h-1 w-10 rounded-full bg-brand-line" />
          <p className="mt-3 text-center text-base text-brand-muted">caractéristiques spécifique</p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-[#f2f5fa] px-4 pb-4 pt-4">
          <div className={`${CARTE_CLASSE} space-y-3`} style={CARTE_OMBRE}>
            <select value={processeur} onChange={(e) => setProcesseur(e.target.value)} className={CHAMP_CLASSE}>
              <option value="" disabled>
                Processeur
              </option>
              {PROCESSEURS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select value={carteGraphique} onChange={(e) => setCarteGraphique(e.target.value)} className={CHAMP_CLASSE}>
              <option value="" disabled>
                Carte graphique
              </option>
              {CARTES_GRAPHIQUES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select value={ram} onChange={(e) => setRam(e.target.value)} className={CHAMP_CLASSE}>
              <option value="" disabled>
                Ram
              </option>
              {RAMS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                value={disqueDurCapacite}
                onChange={(e) => setDisqueDurCapacite(e.target.value)}
                placeholder="Disque dur"
                className={`${CHAMP_CLASSE} flex-1`}
              />
              <select
                value={disqueDurType}
                onChange={(e) => setDisqueDurType(e.target.value)}
                className="w-24 rounded-2xl border border-brand-line px-2 py-3 text-sm text-brand-ink outline-none"
              >
                {TYPES_DISQUE.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <select value={tailleEcran} onChange={(e) => setTailleEcran(e.target.value)} className={CHAMP_CLASSE}>
              <option value="" disabled>
                La taille de l&apos;écran
              </option>
              {TAILLES_ECRAN.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select value={systemeExploitation} onChange={(e) => setSystemeExploitation(e.target.value)} className={CHAMP_CLASSE}>
              <option value="" disabled>
                Système d&apos;exploitation
              </option>
              {SYSTEMES_EXPLOITATION.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className={CARTE_CLASSE} style={CARTE_OMBRE}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              rows={5}
              className="w-full rounded-2xl border border-brand-line px-4 py-3 text-sm text-brand-ink outline-none placeholder:text-brand-muted"
            />
          </div>

          <div className={CARTE_CLASSE} style={CARTE_OMBRE}>
            <p className="mb-2 text-sm font-bold text-brand-ink">Garantie</p>
            <div className="flex items-center rounded-2xl border border-brand-line px-4 py-3">
              <input
                type="number"
                min={0}
                max={120}
                value={dureeGarantie}
                onChange={(e) => setDureeGarantie(e.target.value)}
                placeholder="Durée de garantie"
                className="min-w-0 flex-1 text-sm text-brand-ink outline-none placeholder:text-brand-muted"
              />
              <span className="shrink-0 text-sm text-brand-muted">mois</span>
            </div>
          </div>
        </div>

        <div className="bg-white px-4 pb-6 pt-3">
          <button type="button" onClick={() => setEtape("final")} className="bg-gradient-espace h-12 w-full rounded-[11px] text-sm font-bold text-white">
            Suivant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#f2f5fa]">
      <div className="relative flex h-11 shrink-0 items-center justify-center bg-[#8a8a8a]">
        <button
          type="button"
          onClick={() => setEtape("caracteristiques")}
          aria-label="Retour"
          className="absolute left-4 flex h-8 w-8 shrink-0 items-center justify-center text-white"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="rounded-t-[28px] bg-white pb-1 pt-3">
        <div className="mx-auto h-1 w-10 rounded-full bg-brand-line" />
        <p className="mt-3 text-center text-base text-brand-muted">caractéristiques spécifique</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-[#f2f5fa] px-4 pb-4 pt-4">
        <div className={`${CARTE_CLASSE} space-y-3`} style={CARTE_OMBRE}>
          <div>
            <p className="mb-2 text-sm font-bold text-brand-ink">Couleurs disponible</p>
            <div className="flex flex-wrap gap-3">
              {COULEURS.map((c) => (
                <button
                  key={c.nom}
                  type="button"
                  onClick={() => setCouleur(c.nom)}
                  aria-label={c.nom}
                  aria-pressed={couleur === c.nom}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-2 transition-all ${
                    couleur === c.nom ? "ring-[color:var(--brand-blue-end)]" : "ring-transparent"
                  }`}
                >
                  {c.hex ? (
                    <span className="h-9 w-9 rounded-full border border-black/10" style={{ background: c.hex }} />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-brand-line text-[9px] font-semibold text-brand-muted">
                      Autre
                    </span>
                  )}
                </button>
              ))}
            </div>
            {couleur ? <p className="mt-2 text-xs text-brand-muted">Sélectionné : {couleur}</p> : null}
          </div>

          <select value={quantite} onChange={(e) => setQuantite(e.target.value)} className={CHAMP_CLASSE}>
            <option value="" disabled>
              Quantité
            </option>
            {QUANTITES.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>

        <div className={CARTE_CLASSE} style={CARTE_OMBRE}>
          <p className="text-sm font-bold text-brand-ink">Pack complet</p>
          <p className="mb-3 text-xs text-brand-muted">
            Composé automatiquement des cadeaux sélectionnés ci-dessous — ajoute une photo pour chacun, et saisis à la main tout autre article inclus.
          </p>

          <select
            value={cadeauChoisi}
            onChange={(e) => {
              ajouterCadeau(e.target.value);
              setCadeauChoisi("");
            }}
            className={CHAMP_CLASSE}
          >
            <option value="" disabled>
              Ajouter un cadeau
            </option>
            {CADEAUX_DISPONIBLES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {cadeaux.length > 0 ? (
            <div className="mt-3 flex flex-col gap-2">
              {cadeaux.map((c) => (
                <div key={c} className="flex items-center gap-2.5 rounded-2xl bg-[#F5F7FA] px-3 py-2">
                  <button
                    type="button"
                    onClick={() => cadeauFichierRefs.current[c]?.click()}
                    aria-label={`Ajouter une photo pour ${c}`}
                    className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white"
                  >
                    {cadeauxApercus[c] ? (
                      // eslint-disable-next-line @next/next/no-img-element -- aperçu local (data:), pas une ressource Next/Image distante.
                      <img src={cadeauxApercus[c]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-brand-muted" />
                    )}
                  </button>
                  <input
                    ref={(el) => {
                      cadeauFichierRefs.current[c] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      choisirImageCadeau(c, e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-brand-ink">{c}</span>
                  <button type="button" onClick={() => retirerCadeau(c)} aria-label={`Retirer ${c}`} className="shrink-0 text-brand-muted">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-2">
            <input
              value={contenuPackSaisie}
              onChange={(e) => setContenuPackSaisie(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  ajouterContenuPack();
                }
              }}
              placeholder="Autre article inclus (saisie libre)"
              className={`${CHAMP_CLASSE} flex-1`}
            />
            <button
              type="button"
              onClick={ajouterContenuPack}
              disabled={!contenuPackSaisie.trim()}
              className="bg-gradient-espace h-11 shrink-0 rounded-2xl px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              Ajouter
            </button>
          </div>

          {contenuPackManuel.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {contenuPackManuel.map((c) => (
                <span key={c} className="flex items-center gap-1.5 rounded-full bg-[#F5F7FA] px-3 py-1.5 text-sm text-brand-ink">
                  {c}
                  <button type="button" onClick={() => retirerContenuPack(c)} aria-label={`Retirer ${c}`} className="text-brand-muted">
                    ✕
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className={CARTE_CLASSE} style={CARTE_OMBRE}>
          <p className="text-sm font-bold text-brand-ink">Prix partenaire</p>
          <p className="mb-2 text-xs text-brand-muted">Le prix que tu veux toucher — le Coordinateur fixe le prix public à la publication.</p>
          <div className="flex items-center rounded-2xl border border-brand-line px-4 py-3">
            <input
              type="number"
              min={0}
              value={prixPartenaire}
              onChange={(e) => setPrixPartenaire(e.target.value)}
              placeholder="Prix partenaire"
              className="min-w-0 flex-1 text-sm text-brand-ink outline-none placeholder:text-brand-muted"
            />
            <span className="shrink-0 text-sm text-brand-muted">FCFA</span>
          </div>
        </div>

        <div className={CARTE_CLASSE} style={CARTE_OMBRE}>
          <select value={etat} onChange={(e) => setEtat(e.target.value)} className={CHAMP_CLASSE}>
            <option value="">État du produit</option>
            {ETATS_PRODUIT.map((e) => (
              <option key={e.valeur} value={e.valeur}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        {/* Un logiciel/licence (numérique) n'est jamais livré par un livreur — aucun barème pertinent. */}
        {token && typeLivraison === "physique" ? (
          <div className={`${CARTE_CLASSE} space-y-3`} style={CARTE_OMBRE}>
            <div>
              <p className="text-sm font-bold text-brand-ink">Frais de livraison</p>
              <p className="text-xs text-brand-muted">Renseigne les localités livrées — les autres restent indisponibles.</p>
            </div>
            <BaremeLivraison token={token} valeurs={frais} onChange={setFrais} />
          </div>
        ) : null}
      </div>

      <div className="bg-white px-4 pb-6 pt-3">
        {erreurEnvoi ? <p className="mb-2 text-center text-xs text-red-500">{erreurEnvoi}</p> : null}
        <button
          type="button"
          // categories.length === 0 : garde-fou contre une soumission avant la
          // fin du GET /categories (chargé en arrière-plan dès le montage) —
          // sans ça, resoudreCategorieId() peut échouer si l'utilisateur va
          // très vite jusqu'à cette étape finale.
          disabled={!prixPartenaire.trim() || envoiEnCours || categories.length === 0}
          onClick={envoyer}
          className="bg-gradient-espace h-12 w-full rounded-[11px] text-sm font-bold text-white disabled:opacity-50"
        >
          {envoiEnCours ? "Envoi…" : "Envoyer au Coordinateur"}
        </button>
      </div>
    </div>
  );
}
