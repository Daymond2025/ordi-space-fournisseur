# OrdiSpace — Espace Fournisseur

Application web mobile (Next.js) des fournisseurs OrdiSpace : ils publient et gèrent leurs produits, suivent les commandes reçues, échangent avec la coordination et suivent leurs paiements.

Elle consomme l'API du dépôt [`Ordi-Space_backend`](https://github.com/Daymond2025/Ordi-Space_backend) (Laravel) via des jetons Bearer (Sanctum).

## Stack technique

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS 4
- Authentification : téléphone + code OTP reçu par WhatsApp (inscription possible depuis l'app) ; connexion e-mail + mot de passe conservée pour les anciens comptes (rôle `fournisseur`)
- Application installable (PWA, service worker, notifications push)

## Fonctionnalités principales

- **Space** — accueil : statistiques par période, produits à activité récente.
- **Produits** — liste, ajout, modification, fiche détaillée, négociation de prix, centre de paiement d'un produit.
- **Discussion produit** — fil par produit : cartes commandes, « Nouvelle commande », rapport du jour, messages.
- **Centre des commandes** — « Chat & commandes » et « Commandes uniquement » (5 filtres de statut), détail commande, recherche d'un livreur.
- **Livreurs**, **Paiement**, **Statistiques**, **Profil** (fiche entreprise modifiable).

Le fournisseur ne voit jamais les conversations des partenaires OrdiSpace.

## Structure du projet

```text
src/
├── app/
│   ├── connexion/ (email/, verification/), inscription/, mot-de-passe-oublie/
│   └── (shell)/               # Pages avec la barre de navigation
│       ├── produits/          # Liste, nouveau, [id] (discussion), detail, modifier, negociation-prix, paiement
│       ├── commandes/, commande/[id]/ (recherche/)
│       ├── livreurs/, paiement/, statistiques/, profil/ (modifier/)
├── components/                # auth/, commande/, discussion/, livreur/, operations/, produit/, space/
├── context/                   # AuthContext
└── lib/                       # api.ts, types.ts, statuts.ts, push.ts, partage.ts, temps.ts
```

## Démarrage

Prérequis : Node.js 20+, et l'API backend lancée.

```bash
npm install
cp .env.example .env.local   # renseigner NEXT_PUBLIC_API_URL
npm run dev                  # http://localhost:3000
```

Pour lancer plusieurs applications OrdiSpace en même temps, choisir un autre port (`npm run dev -- -p 3005`) et l'ajouter à `CORS_ALLOWED_ORIGINS` dans le `.env` du backend. En local, sans WhatsApp configuré, le code OTP est renvoyé par l'API (`code_debug`).

### Variables d'environnement

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL de base de l'API (ex. `http://127.0.0.1:8000/api/v1` en local, `https://ordisapce.daymondboutique.com/api/v1` en production) |

Aucune clé secrète ne doit se trouver dans cette app.

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de développement (Turbopack) |
| `npm run build` | Build de production |
| `npm run start` | Sert le build de production |
| `npm run lint` | ESLint |

## Déploiement

Configurer `NEXT_PUBLIC_API_URL` sur l'hébergeur et ajouter le domaine de l'app à `CORS_ALLOWED_ORIGINS` côté backend.
