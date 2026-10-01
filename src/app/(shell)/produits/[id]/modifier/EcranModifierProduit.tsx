"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ChevronLeftIcon, ImageIcon } from "@/components/icons";
import type { Categorie } from "@/lib/types";
import {
  CADEAUX_DISPONIBLES,
  CARTES_GRAPHIQUES,
  COULEURS,
  ETATS_PRODUIT,
  MARQUES,
  PROCESSEURS,
  QUANTITES,
  RAMS,
  SYSTEMES_EXPLOITATION,
  TAILLES_ECRAN,
  TYPES_LIVRAISON,
} from "@/lib/produitBoutique";
import { BaremeLivraison, ajouterBaremeAuFormData } from "@/components/produit/BaremeLivraison";
import { formaterPrix, type ProduitDetailComplet } from "@/lib/produitDetail";

const CARTE_CLASSE = "rounded-2xl bg-white p-4";
const CARTE_OMBRE = { boxShadow: "0px 1px 100px 0px rgba(29, 99, 224, 0.08)" };
const CHAMP_CLASSE = "w-full rounded-2xl border border-brand-line px-4 py-3 text-sm text-brand-ink outline-none placeholder:text-brand-muted";

/**
 * "Modifier" (menu ☰, "Mes produits") — contrairement à Cordinateur_App_Web/
 * .../EcranModifierProduit.tsx (qui ne touche que la fiche via PATCH
 * /produits/{id}/fiche, Coordinateur-only), le fournisseur passe par PUT
 * /produits/{id} (ProduitController::update(), StoreProduitRequest) — donc
 * TOUS les champs qu'il a le droit de fixer en une seule page, y compris
 * prix/quantité/barème (pas de "Prix de vente", toujours prohibé pour lui).
 * N'est atteignable que si ProduitPolicy::update() autorise (statut
 * en_attente/rejete/corrige — voir FeuilleMenuProduit.tsx, qui grise le
 * bouton sinon) ; les photos sont gérées à part (ajout/suppression
 * immédiats), comme côté Coordinateur.
 */
export function EcranModifierProduit({ produitId }: { produitId: number }) {
  const { token } = useAuth();
  const router = useRouter();
  const fichierRef = useRef<HTMLInputElement>(null);

  const [produit, setProduit] = useState<ProduitDetailComplet | null>(null);
  const [categories, setCategories] = useState<Categorie[]>([]);

  const [nomProduit, setNomProduit] = useState("");
  const [marque, setMarque] = useState("");
  const [categorieId, setCategorieId] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [prixPartenaire, setPrixPartenaire] = useState("");
  const [quantite, setQuantite] = useState("");
  const [typeLivraison, setTypeLivraison] = useState<"physique" | "numerique">("physique");

  const [processeur, setProcesseur] = useState("");
  const [carteGraphique, setCarteGraphique] = useState("");
  const [ram, setRam] = useState("");
  const [stockage, setStockage] = useState("");
  const [tailleEcran, setTailleEcran] = useState("");
  const [systemeExploitation, setSystemeExploitation] = useState("");
  const [dureeGarantieMois, setDureeGarantieMois] = useState("");

  const [couleur, setCouleur] = useState("");
  const [cadeauChoisi, setCadeauChoisi] = useState("");
  // Pack complet = cadeaux sélectionnés + articles saisis à la main, fusionnés à l'enregistrement (voir enregistrer()) — même logique que EcranAjouterProduit.tsx.
  const [cadeaux, setCadeaux] = useState<string[]>([]);
  const [cadeauxFichiers, setCadeauxFichiers] = useState<Record<string, File>>({});
  const [cadeauxApercus, setCadeauxApercus] = useState<Record<string, string>>({});
  const cadeauFichierRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [contenuPackSaisie, setContenuPackSaisie] = useState("");
  const [contenuPackManuel, setContenuPackManuel] = useState<string[]>([]);

  // État déclaratif seulement — commission/prix barré/réduction retirés :
  // c'est le Coordinateur qui les fixe avant publication, pas le fournisseur.
  const [etat, setEtat] = useState("");
  const [frais, setFrais] = useState<Record<number, string>>({});

  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  function appliquerProduit(data: ProduitDetailComplet) {
    setProduit(data);
    setNomProduit(data.nom_produit);
    setMarque(data.marque ?? "");
    setCategorieId(data.categorie ? data.categorie.id : "");
    setDescription(data.description ?? "");
    setPrixPartenaire(data.prix);
    setQuantite(String(data.quantite_stock));
    setTypeLivraison(data.type_livraison);
    setProcesseur(data.processeur ?? "");
    setCarteGraphique(data.carte_graphique ?? "");
    setRam(data.memoire_ram ?? "");
    setStockage(data.stockage ?? "");
    setTailleEcran(data.taille ?? "");
    setSystemeExploitation(data.systeme_exploitation ?? "");
    setDureeGarantieMois(data.duree_garantie_mois !== null ? String(data.duree_garantie_mois) : "");
    setCouleur(data.couleur ?? "");
    const cadeauxActuels = data.cadeaux ?? [];
    setCadeaux(cadeauxActuels);
    // `contenu_pack` est historiquement cadeaux + manuel fusionnés — on ne
    // réaffiche ici que la partie manuelle, les cadeaux ayant déjà leur
    // propre chip ci-dessous (évite de les voir en double).
    setContenuPackManuel((data.contenu_pack ?? []).filter((item) => !cadeauxActuels.includes(item)));
    setCadeauxApercus(
      Object.fromEntries(Object.entries(data.images_cadeaux ?? {}).filter(([, url]) => url !== null)) as Record<string, string>
    );
    setEtat(data.etat_produit ?? "");
    setFrais(
      Object.fromEntries(data.frais_livraison.filter((f) => f.localite).map((f) => [f.localite!.id, String(Number(f.montant))]))
    );
  }

  async function charger() {
    if (!token) return;
    const data = await apiFetch<ProduitDetailComplet>(`/produits/${produitId}`, { token });
    appliquerProduit(data);
  }

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<ProduitDetailComplet>(`/produits/${produitId}`, { token })
      .then((data) => {
        if (!annule) appliquerProduit(data);
      })
      .catch(() => {});
    apiFetch<Categorie[]>("/categories", { token })
      .then((data) => {
        if (!annule) setCategories(data);
      })
      .catch(() => {});

    return () => {
      annule = true;
    };
  }, [token, produitId]);

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
    // FileReader (data:) plutôt que URL.createObjectURL() (blob:), bloqué par la CSP — voir ChampPhotoProfil.tsx.
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

  async function ajouterPhoto(fichier: File) {
    if (!token) return;
    const formData = new FormData();
    formData.append("images[]", fichier);
    await apiFetch(`/produits/${produitId}/images`, { method: "POST", token, body: formData });
    await charger();
  }

  async function supprimerPhoto(imageId: number) {
    if (!token) return;
    await apiFetch(`/produits/${produitId}/images/${imageId}`, { method: "DELETE", token });
    await charger();
  }

  async function enregistrer() {
    if (!token || enregistrement || !categorieId) return;
    setErreur(null);
    setEnregistrement(true);

    const formData = new FormData();
    formData.append("categorie_id", String(categorieId));
    formData.append("nom_produit", nomProduit);
    if (marque) formData.append("marque", marque);
    if (description.trim()) formData.append("description", description);
    formData.append("prix", prixPartenaire);
    formData.append("quantite_stock", quantite);
    formData.append("type_livraison", typeLivraison);
    if (processeur) formData.append("processeur", processeur);
    if (carteGraphique) formData.append("carte_graphique", carteGraphique);
    if (ram) formData.append("memoire_ram", ram);
    if (stockage.trim()) formData.append("stockage", stockage.trim());
    if (tailleEcran) formData.append("taille", tailleEcran);
    if (systemeExploitation) formData.append("systeme_exploitation", systemeExploitation);
    if (dureeGarantieMois.trim()) formData.append("duree_garantie_mois", dureeGarantieMois);
    if (couleur) formData.append("couleur", couleur);
    if (etat) formData.append("etat_produit", etat);
    if (typeLivraison === "physique") ajouterBaremeAuFormData(formData, frais);
    cadeaux.forEach((c) => formData.append("cadeaux[]", c));
    Array.from(new Set([...cadeaux, ...contenuPackManuel])).forEach((c) => formData.append("contenu_pack[]", c));
    cadeaux.forEach((c) => {
      const fichier = cadeauxFichiers[c];
      if (fichier) formData.append(`images_cadeaux[${c}]`, fichier);
    });
    // PHP interprète un PUT multipart/form-data comme du POST classique
    // seulement via cette convention Laravel (_method) — Fetch ne sait pas
    // envoyer de vrai PUT multipart autrement.
    formData.append("_method", "PUT");

    try {
      await apiFetch(`/produits/${produitId}`, { method: "POST", token, body: formData });
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
        <p className="text-base font-extrabold leading-none">Modifier le produit</p>
      </div>

      {!produit ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : (
        <div className="space-y-4 px-4 py-4">
          <div className={CARTE_CLASSE} style={CARTE_OMBRE}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-muted">Photos</p>
            <div className="flex flex-wrap gap-2">
              {produit.images.map((image) => (
                <div key={image.id} className="relative h-20 w-20 overflow-hidden rounded-xl bg-white">
                  <Image src={image.url_image} alt="" fill className="object-cover" sizes="80px" />
                  <button
                    type="button"
                    onClick={() => supprimerPhoto(image.id)}
                    aria-label="Supprimer cette photo"
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fichierRef.current?.click()}
                aria-label="Ajouter une photo"
                className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-brand-line text-brand-muted"
              >
                <ImageIcon className="h-6 w-6" />
              </button>
              <input
                ref={fichierRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const fichier = e.target.files?.[0];
                  if (fichier) ajouterPhoto(fichier);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className={`${CARTE_CLASSE} space-y-3`} style={CARTE_OMBRE}>
            <input value={nomProduit} onChange={(e) => setNomProduit(e.target.value)} placeholder="Nom du produit" className={CHAMP_CLASSE} />
            <select value={categorieId} onChange={(e) => setCategorieId(e.target.value ? Number(e.target.value) : "")} className={CHAMP_CLASSE}>
              <option value="">Choisir une catégorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom_categorie}
                </option>
              ))}
            </select>
            <select value={marque} onChange={(e) => setMarque(e.target.value)} className={CHAMP_CLASSE} aria-label="Marque">
              <option value="">Marque</option>
              {MARQUES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              {marque && !MARQUES.some((m) => m.toLowerCase() === marque.toLowerCase()) ? <option value={marque}>{marque}</option> : null}
            </select>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              rows={3}
              className={CHAMP_CLASSE}
            />
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

          <div className={`${CARTE_CLASSE} space-y-3`} style={CARTE_OMBRE}>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">Caractéristiques</p>
            <select value={processeur} onChange={(e) => setProcesseur(e.target.value)} className={CHAMP_CLASSE} aria-label="Processeur">
              <option value="">Processeur</option>
              {PROCESSEURS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select value={carteGraphique} onChange={(e) => setCarteGraphique(e.target.value)} className={CHAMP_CLASSE} aria-label="Carte graphique">
              <option value="">Carte graphique</option>
              {CARTES_GRAPHIQUES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select value={ram} onChange={(e) => setRam(e.target.value)} className={CHAMP_CLASSE} aria-label="Ram">
              <option value="">Ram</option>
              {RAMS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <input value={stockage} onChange={(e) => setStockage(e.target.value)} placeholder="Stockage (ex : 256 GO SSD)" className={CHAMP_CLASSE} />
            <select value={tailleEcran} onChange={(e) => setTailleEcran(e.target.value)} className={CHAMP_CLASSE} aria-label="Taille de l'écran">
              <option value="">Taille de l&apos;écran</option>
              {TAILLES_ECRAN.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={systemeExploitation}
              onChange={(e) => setSystemeExploitation(e.target.value)}
              className={CHAMP_CLASSE}
              aria-label="Système d'exploitation"
            >
              <option value="">Système d&apos;exploitation</option>
              {SYSTEMES_EXPLOITATION.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              value={dureeGarantieMois}
              onChange={(e) => setDureeGarantieMois(e.target.value)}
              placeholder="Durée de garantie (mois)"
              className={CHAMP_CLASSE}
            />
          </div>

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
            <select value={quantite} onChange={(e) => setQuantite(e.target.value)} className={CHAMP_CLASSE} aria-label="Quantité">
              <option value="" disabled>
                Quantité
              </option>
              {QUANTITES.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
              {quantite && !QUANTITES.includes(Number(quantite)) ? <option value={quantite}>{quantite}</option> : null}
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
                        // eslint-disable-next-line @next/next/no-img-element -- aperçu local (data:) ou URL déjà servie, pas une ressource Next/Image distante à optimiser.
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
            {produit.prix_vente ? (
              <p className="mt-2 text-xs text-brand-muted">Prix public actuel : {formaterPrix(produit.prix_vente)} FCFA (fixé par le Coordinateur).</p>
            ) : null}
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

          {token && typeLivraison === "physique" ? (
            <div className={`${CARTE_CLASSE} space-y-3`} style={CARTE_OMBRE}>
              <div>
                <p className="text-sm font-bold text-brand-ink">Frais de livraison</p>
                <p className="text-xs text-brand-muted">Renseigne les localités livrées — les autres restent indisponibles.</p>
              </div>
              <BaremeLivraison token={token} valeurs={frais} onChange={setFrais} />
            </div>
          ) : null}

          {erreur ? <p className="text-center text-xs text-red-500">{erreur}</p> : null}

          <button
            type="button"
            disabled={enregistrement || !nomProduit.trim() || !categorieId || !prixPartenaire.trim() || !quantite.trim()}
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
