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
  // au Livreur, aucun document n'est demandé ici.
  nom_entreprise: string;
};

type AuthContextValue = {
  user: Utilisateur | null;
  token: string | null;
  pret: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (donnees: DonneesInscription) => Promise<void>;
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
      body: { email, password, device_name: NOM_APPAREIL },
    });

    accesRefuseSiRoleInvalide(reponse.user);
    memoriser(reponse);
  }

  /**
   * Auto-inscription (POST /auth/register) — voir roles_auto_inscription()
   * côté backend : le Fournisseur (contrairement au Coordinateur, provisionné
   * par un Administrateur) crée lui-même son compte. type_utilisateur est
   * fixé côté client, pas un choix laissé à l'utilisateur de cette app.
   * Aucun fichier à envoyer (contrairement au Livreur) : corps JSON simple.
   */
  async function register(donnees: DonneesInscription) {
    const reponse = await apiFetch<SessionResult>("/auth/register", {
      method: "POST",
      body: {
        nom: donnees.nom,
        prenom: donnees.prenom || undefined,
        email: donnees.email,
        telephone: donnees.telephone || undefined,
        password: donnees.password,
        password_confirmation: donnees.password_confirmation,
        type_utilisateur: "fournisseur",
        nom_entreprise: donnees.nom_entreprise,
      },
    });

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

  return (
    <AuthContext.Provider value={{ user, token, pret, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé sous <AuthProvider>.");
  return context;
}
