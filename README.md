# Portfolio — Delano Ronald Togbé

> Biostatisticien & Data Scientist · Abomey-Calavi, Bénin

Site portfolio professionnel hébergé sur **GitHub Pages**. Entièrement gratuit, aucune dépendance payante.

## 🚀 Déploiement rapide

```bash
# 1. Cloner ou forker ce dépôt
git clone https://github.com/tdr12/portfolio.git

# 2. Activer GitHub Pages
# Settings → Pages → Source: Deploy from branch → main → / (root)

# 3. Le site est accessible à :
# https://tdr12.github.io/portfolio/
```

## 📁 Structure du projet

```
portfolio/
├── index.html              # Page principale (publique)
├── .nojekyll               # Désactive Jekyll (GitHub Pages)
├── README.md
│
├── assets/                 # Ressources statiques
│   ├── css/
│   │   ├── tokens.css      # Variables CSS (couleurs, fonts...)
│   │   ├── base.css        # Reset, typographie, utilitaires
│   │   ├── layout.css      # Navigation, hero, footer, stats
│   │   ├── components.css  # Cartes, filtres, articles, contact
│   │   └── admin.css       # Styles panneau d'administration
│   ├── js/
│   │   ├── auth.js         # Authentification admin (SHA-256)
│   │   ├── db.js           # Gestionnaire données (JSON + localStorage)
│   │   ├── invoice.js      # Générateur factures pro forma
│   │   ├── app.js          # Application publique principale
│   │   └── admin-app.js    # Application panneau admin
│   ├── fonts/              # Polices locales (optionnel)
│   └── images/
│       ├── profile/        # Photo de profil
│       ├── projects/       # Images des projets
│       ├── figures/        # Figures et visualisations
│       └── reports/        # Couvertures de rapports
│
├── data/                   # Bases de données JSON (éditables)
│   ├── projects.json       # Projets de consulting
│   ├── articles.json       # Articles de blog
│   ├── publications.json   # Publications scientifiques
│   └── rates.json          # Honoraires & factures
│
├── admin/                  # Panneau d'administration (protégé)
│   ├── login.html          # Page de connexion
│   └── index.html          # Dashboard admin
│
├── pages/                  # Pages secondaires
│   └── articles.html       # Liste complète des articles
│
├── components/             # Composants HTML réutilisables (référence)
└── docs/
    └── GUIDE.md            # Guide d'utilisation complet
```

## 🔑 Administration

Accès : `https://tdr12.github.io/portfolio/admin/login.html`

Mot de passe par défaut : `Admin2026!` — **à changer immédiatement**

## 📊 Bases de données

Toutes les données sont dans `/data/*.json` :
- Éditables via le panneau admin (sauvegarde en localStorage)
- Exporter via "Exporter JSON" dans l'admin
- Committer les fichiers exportés pour publication permanente

## 🛠 Technologies utilisées (toutes gratuites)

| Technologie | Usage | Coût |
|-------------|-------|------|
| GitHub Pages | Hébergement | Gratuit |
| GitHub | Dépôt + CI/CD | Gratuit |
| Google Fonts | Typographie | Gratuit |
| JSON | Bases de données | Natif |
| localStorage | Stockage temporaire | Natif navigateur |
| Web Crypto API | Hash mot de passe | Natif navigateur |
| window.print() | Export PDF factures | Natif navigateur |

## 📝 Workflow de mise à jour du contenu

```
1. Se connecter à /admin/login.html
2. Ajouter/modifier le contenu via les formulaires
3. Cliquer "Exporter JSON" dans l'admin
4. git add data/*.json
5. git commit -m "feat: ajout projet P010"
6. git push origin main
→ GitHub Pages se met à jour automatiquement (~2 min)
```

## 📄 Licence

Usage personnel — Delano Ronald Togbé © 2026
