"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api";

export type Utilisateur = {
  id: number;
  nom: string;
  prenom: string | null;
  email: string;
  type_utilisateur: string;
  roles: string[];
  permissions: string[];
};

type SessionResult = { user: Utilisateur; token: string };

export type DonneesInscription = {
  nom: string;
  prenom?: string;
  email: string;
  telephone?: string;
  password: string;
  password_confirmation: string;
  // Seul champ "métier" exigé en plus à l'inscription (voir RegisterRequest
  // côté backend, required_if type_utilisateur=fournisseur) — contrairement
  // au Livreur, aucun document n'est exigé ici, la photo reste optionnelle.
  nom_entreprise: string;
  photo?: File;
};

type DemandeOtpResultat = { compteExistant: boolean; userId?: number; codeDebug?: string };
type InscriptionTelephoneResultat = { userId: number; codeDebug?: string };

type AuthContextValue = {
  user: Utilisateur | null;
  token: string | null;
  pret: boolean;
  /** @deprecated Conservé pour les comptes déjà créés par e-mail/mot de passe — voir /connexion/email. */
  login: (email: string, password: string) => Promise<void>;
  /** @deprecated Plus utilisé par aucun écran — les nouvelles inscriptions passent par inscrireParTelephone(). */
  register: (donnees: DonneesInscription) => Promise<void>;
  demanderOtp: (telephone: string) => Promise<DemandeOtpResultat>;
  inscrireParTelephone: (telephone: string, nom: string, prenom: string | undefined, nomEntreprise: string, photo?: File) => Promise<InscriptionTelephoneResultat>;
  verifierOtpInscription: (userId: number, code: string) => Promise<void>;
  logout: () => Promise<void>;
};

const STOCKAGE_CLE = "ordispace.fournisseur.session";
const NOM_APPAREIL = "fournisseur-web";
const ROLES_AUTORISES = ["fournisseur"];

const AuthContext = createContext<AuthContextValue | null>(null);

function accesRefuseSiRoleInvalide(user: Utilisateur) {
  if (!ROLES_AUTORISES.includes(user.type_utilisateur)) {
    throw new ApiRequestError(
      { code: "ACCES_REFUSE", message: "Ce compte n'a pas accès à l'espace Fournisseur." },
      403
    );
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pret, setPret] = useState(false);

  // Lecture localStorage nécessairement différée à after-mount (useEffect) :
  // le rendu serveur n'a pas accès à localStorage, donc le premier rendu
  // client doit rester identique à celui du serveur (session absente) pour
  // éviter une erreur d'hydratation — le flag `pret` distingue "pas encore
  // vérifié" de "vérifié, pas de session". Même pattern que les autres apps.
  useEffect(() => {
    const brut = localStorage.getItem(STOCKAGE_CLE);
    if (brut) {
      try {
        const session = JSON.parse(brut) as SessionResult;
        setUser(session.user);
        setToken(session.token);
      } catch {
        localStorage.removeItem(STOCKAGE_CLE);
      }
    }
    setPret(true);
  }, []);

  function memoriser(session: SessionResult) {
    setUser(session.user);
    setToken(session.token);
    localStorage.setItem(STOCKAGE_CLE, JSON.stringify(session));
  }

  /**
   * Le Fournisseur n'a pas de 2FA (roles_2fa_obligatoire() ne liste que
   * Coordinateur/Admin côté backend) — /auth/login renvoie donc toujours
   * directement {user, token}, jamais {requires_2fa}.
   */
  async function login(email: string, password: string) {
    const reponse = await apiFetch<SessionResult>("/auth/login", {
      method: "POST",
      body: { email, password, device_name: NOM_APPAREIL, type_utilisateur: "fournisseur" },
    });

    accesRefuseSiRoleInvalide(reponse.user);
    memoriser(reponse);
  }

  /**
   * Auto-inscription (POST /auth/register) — voir roles_auto_inscription()
   * côté backend : le Fournisseur (contrairement au Coordinateur, provisionné
   * par un Administrateur) crée lui-même son compte. type_utilisateur est
   * fixé côté client, pas un choix laissé à l'utilisateur de cette app.
   * Aucun document exigé (contrairement au Livreur) : corps JSON simple, sauf
   * si une photo de profil optionnelle est fournie (alors FormData).
   */
  async function register(donnees: DonneesInscription) {
    const champs = {
      nom: donnees.nom,
      prenom: donnees.prenom || undefined,
      email: donnees.email,
      telephone: donnees.telephone || undefined,
      password: donnees.password,
      password_confirmation: donnees.password_confirmation,
      type_utilisateur: "fournisseur",
      nom_entreprise: donnees.nom_entreprise,
    };

    let body: unknown = champs;
    if (donnees.photo) {
      const formData = new FormData();
      for (const [cle, valeur] of Object.entries(champs)) {
        if (valeur !== undefined) formData.append(cle, valeur);
      }
      formData.append("photo", donnees.photo);
      body = formData;
    }

    const reponse = await apiFetch<SessionResult>("/auth/register", { method: "POST", body });

    accesRefuseSiRoleInvalide(reponse.user);
    memoriser(reponse);
  }

  async function logout() {
    if (token) {
      await apiFetch("/auth/logout", { method: "POST", token }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(STOCKAGE_CLE);
  }

  /** Étape 1 de la connexion/inscription par téléphone — voir Api\Auth\TelephoneAuthController::demanderOtp(). */
  async function demanderOtp(telephone: string): Promise<DemandeOtpResultat> {
    const reponse = await apiFetch<{ compte_existant: boolean; user_id?: number; code_debug?: string }>(
      "/auth/telephone/otp",
      { method: "POST", body: { telephone, type_utilisateur: "fournisseur" } }
    );

    return { compteExistant: reponse.compte_existant, userId: reponse.user_id, codeDebug: reponse.code_debug };
  }

  /** Numéro inconnu à l'étape précédente — crée le compte (voir TelephoneAuthController::inscrire()). */
  async function inscrireParTelephone(
    telephone: string,
    nom: string,
    prenom: string | undefined,
    nomEntreprise: string,
    photo?: File
  ): Promise<InscriptionTelephoneResultat> {
    const champs = { telephone, nom, prenom, type_utilisateur: "fournisseur", nom_entreprise: nomEntreprise };

    let body: unknown = champs;
    if (photo) {
      const formData = new FormData();
      for (const [cle, valeur] of Object.entries(champs)) {
        if (valeur !== undefined) formData.append(cle, valeur);
      }
      formData.append("photo", photo);
      body = formData;
    }

    const reponse = await apiFetch<{ user_id: number; code_debug?: string }>("/auth/telephone/inscription", { method: "POST", body });

    return { userId: reponse.user_id, codeDebug: reponse.code_debug };
  }

  /** Dernière étape, commune aux deux chemins ci-dessus — code reçu par WhatsApp. */
  async function verifierOtpInscription(userId: number, code: string) {
    const reponse = await apiFetch<SessionResult>("/auth/verify-otp", {
      method: "POST",
      body: { user_id: userId, code, device_name: NOM_APPAREIL },
    });

    accesRefuseSiRoleInvalide(reponse.user);
    memoriser(reponse);
  }

  return (
    <AuthContext.Provider value={{ user, token, pret, login, register, demanderOtp, inscrireParTelephone, verifierOtpInscription, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé sous <AuthProvider>.");
  return context;
}
