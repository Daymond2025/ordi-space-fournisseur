// Thème des écrans de connexion/inscription de cette app (kit
// d'authentification : CadreAuth, MascotteVivante, DecorAuth…). Chaque app a
// le sien : couleurs, décor animé, accessoire de la mascotte et répliques.

export type ThemeAuth = {
  espace: string;
  slogan: string;
  degrade: string;
  halos: [string, string, string];
  accent: string;
  accentFin: string;
  accentHalo: string;
  accentOmbre: string;
  decor: "constellation" | "etincelles" | "colis" | "route" | "etiquettes" | "engrenages" | "bulles" | "radar";
  posture: "flotte" | "roule";
  accessoire: "aucun" | "engrenage" | "logo" | "radar" | "etoile" | "coeur" | "colis" | "casque";
  logo?: string;
  confettis: string[];
  badge: string;
  repliques: {
    salut: string;
    repos: string;
    telephone: string;
    telephoneOk: string;
    email: string;
    emailOk: string;
    mdp: string;
    erreur: string;
    code: string;
    succes: string;
    nom: string;
  };
};

export const THEME_AUTH: ThemeAuth = {
  "espace": "Fournisseur",
  "slogan": "Publie tes produits, prépare tes commandes, suis tes paiements.",
  "degrade": "linear-gradient(160deg,#047857 0%,#059669 40%,#0ea5e9 100%)",
  "halos": [
    "rgba(110,231,183,0.35)",
    "rgba(56,189,248,0.35)",
    "rgba(255,255,255,0.16)"
  ],
  "accent": "#059669",
  "accentFin": "#0ea5e9",
  "accentHalo": "rgba(5,150,105,0.16)",
  "accentOmbre": "rgba(5,150,105,0.38)",
  "decor": "colis",
  "posture": "flotte",
  "accessoire": "aucun",
  "confettis": [
    "#059669",
    "#34d399",
    "#0ea5e9",
    "#ffffff",
    "#fbbf24"
  ],
  "badge": "Connexion sécurisée · code WhatsApp",
  "repliques": {
    "telephone": "Ton numéro WhatsApp 📱",
    "telephoneOk": "Parfait, je t'envoie le code 🚀",
    "email": "Ton adresse e-mail 📧",
    "emailOk": "Cet e-mail me va ✅",
    "mdp": "Je ne regarde pas 🙈",
    "code": "Regarde WhatsApp 💬",
    "salut": "Tes produits t'attendent 📦",
    "repos": "Prêt à approvisionner ? 🚚",
    "erreur": "Oups… on vérifie ça 😅",
    "succes": "Bon business ! 🎉",
    "nom": "Présente ton entreprise 🏢"
  }
};
