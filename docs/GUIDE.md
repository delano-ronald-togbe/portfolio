# 📘 Guide d'utilisation — Portfolio Delano Ronald Togbé

**Version :** 1.0 · **Date :** Juin 2026  
**URL de production :** `https://tdr12.github.io/portfolio/`

---

## Table des matières

1. [Architecture du système](#1-architecture-du-système)  
2. [Mise en ligne sur GitHub Pages](#2-mise-en-ligne-sur-github-pages)  
3. [Connexion à l'espace administrateur](#3-connexion-à-lespace-administrateur)  
4. [Gestion du contenu](#4-gestion-du-contenu)  
5. [Honoraires et facturation pro forma](#5-honoraires-et-facturation-pro-forma)  
6. [Bases de données JSON](#6-bases-de-données-json)  
7. [Ajouter des contenus externes](#7-ajouter-des-contenus-externes)  
8. [Personnalisation visuelle](#8-personnalisation-visuelle)  
9. [Changer le mot de passe administrateur](#9-changer-le-mot-de-passe-administrateur)  
10. [Workflow complet de publication](#10-workflow-complet-de-publication)  
11. [Dépannage](#11-dépannage)  
12. [Limites et extensions possibles](#12-limites-et-extensions-possibles)

---

## 1. Architecture du système

### Vue d'ensemble

```
VISITEUR PUBLIC                    ADMINISTRATEUR (vous)
      │                                    │
      ▼                                    ▼
 index.html                        /admin/login.html
 pages/articles.html                      │
      │                            /admin/index.html
      │                                    │
      └──────────────┐   ┌────────────────┘
                     ▼   ▼
               assets/js/db.js
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
   data/*.json   localStorage  export JSON
   (lecture)     (écriture)    (commit git)
```

### Pourquoi cette architecture ?

GitHub Pages est un hébergement **statique** : il ne peut pas exécuter de code serveur (PHP, Node.js, Python). Toute la logique tourne dans le navigateur :

- **Les JSON dans `/data/`** sont les bases de données lues au chargement de chaque page
- **Le localStorage du navigateur** stocke les modifications faites dans l'admin (temporaire)
- **L'export JSON** + commit git rend les modifications permanentes pour tous les visiteurs

### Accès selon le rôle

| Section | Visiteurs | Administrateur |
|---------|-----------|----------------|
| Page principale | ✅ Visible | ✅ Visible |
| Projets, Articles | ✅ Visible | ✅ Visible |
| Honoraires & devis | ✅ Visible | ✅ Visible |
| Publications | ✅ Visible | ✅ Visible |
| **Panneau admin** | ❌ Inaccessible | ✅ Après connexion |
| **Gestion contenu** | ❌ Impossible | ✅ Formulaires admin |
| **Tarifs édition** | ❌ Impossible | ✅ Admin → Honoraires |
| **Factures émises** | ❌ Inaccessible | ✅ Admin → Factures |

---

## 2. Mise en ligne sur GitHub Pages

### Étape 1 : Créer le dépôt GitHub

```bash
# Option A : Utiliser l'interface GitHub
# → github.com → "New repository" → Nom: "portfolio" → Public → Create

# Option B : Via terminal
git init portfolio
cd portfolio
git remote add origin https://github.com/tdr12/portfolio.git
```

### Étape 2 : Transférer les fichiers

```bash
# Copier tous les fichiers du portfolio dans le dossier
cp -r /chemin/vers/portfolio/* .

# Premier commit
git add .
git commit -m "feat: initialisation du portfolio"
git push -u origin main
```

### Étape 3 : Activer GitHub Pages

1. Aller sur `github.com/tdr12/portfolio`
2. Cliquer sur **Settings** (onglet)
3. Rubrique **Pages** dans le menu gauche
4. **Source** : "Deploy from a branch"
5. **Branch** : `main` / `/ (root)`
6. Cliquer **Save**

⏱ Le site sera disponible sous **2–5 minutes** à l'adresse :  
`https://tdr12.github.io/portfolio/`

### Étape 4 : Vérifier le déploiement

```bash
# Le fichier .nojekyll est crucial — il empêche GitHub de traiter le site avec Jekyll
# Vérifiez qu'il existe bien à la racine
ls -la | grep nojekyll
# → .nojekyll
```

---

## 3. Connexion à l'espace administrateur

### Accès

URL : `https://tdr12.github.io/portfolio/admin/login.html`

**Mot de passe par défaut :** `Admin2026!`

> ⚠️ **IMPORTANT** : Changez ce mot de passe immédiatement après la première connexion (voir section 9).

### Durée de session

La session admin dure **8 heures** après connexion. Elle est stockée dans le `sessionStorage` du navigateur — elle disparaît si vous fermez l'onglet ou le navigateur.

### Sécurité sur GitHub Pages

Le panneau admin est "protégé par obscurité" : l'URL est publique mais le contenu admin n'est visible qu'après saisie du mot de passe. **Le code source est toujours public** (c'est GitHub Pages).

➡️ Pour une protection réelle, migrez vers **Netlify + Identity** (voir section 12).

---

## 4. Gestion du contenu

### 4.1 Ajouter un projet

1. Aller dans **Admin → Projets** → bouton **"+ Ajouter un projet"**
2. Remplir le formulaire :
   - **Titre** : Titre court et descriptif
   - **Catégorie** : `epidemio`, `agro`, `ecology`, `ml`, `social`
   - **Label catégorie** : Libellé affiché (ex: "Épidémiologie spatiale")
   - **Description** : Texte complet (méthodes, contexte, résultats)
   - **Outils** : séparés par des virgules (ex: `R, GLMM, QGIS`)
   - **Lien externe** : URL vers une publication ou un dépôt GitHub (optionnel)
   - **Statut** : `published` (visible) / `draft` (masqué)
3. Cliquer **Sauvegarder**
4. Exporter et committer (voir section 10)

### 4.2 Ajouter un article

Deux types d'articles sont supportés :

**Article original** (rédigé sur le site) :
- Source : `original`
- Remplir Titre + Résumé + Contenu (Markdown)
- Laisser "Lien externe" vide

**Article externe** (lien vers GitHub, Medium, RPubs, etc.) :
- Source : `external`
- Remplir Titre + Résumé + **Lien externe** (URL)
- Le clic sur l'article ouvrira l'URL dans un nouvel onglet

### 4.3 Ajouter une figure

1. **Admin → Figures** → **"+ Ajouter une figure"**
2. L'image peut être :
   - **URL distante** : `https://github.com/tdr12/...` ou lien RPubs/Kaggle
   - **Chemin local** : `/assets/images/figures/mon_graphique.png` (après upload via git)

**Pour uploader une image via git :**
```bash
# Copier l'image dans le bon dossier
cp mon_graphique.png portfolio/assets/images/figures/

# Committer
git add assets/images/figures/mon_graphique.png
git commit -m "feat: ajout figure analyse BBTD"
git push
```

### 4.4 Ajouter un rapport

1. **Admin → Rapports** → remplir le formulaire
2. **Confidentialité** :
   - `Public` : lien téléchargeable visible
   - `Résumé seulement` : titre + description, pas de téléchargement
   - `Confidentiel` : enregistré mais non affiché sur le site

**Pour héberger un PDF gratuitement :**
- **GitHub** : committer le PDF dans `/assets/images/reports/`
- **Google Drive** : partager en public → lien direct
- **Zenodo** : archivage scientifique permanent (DOI gratuit)

### 4.5 Modifier une entrée existante

Dans chaque section admin, cliquer **"Éditer"** sur la ligne concernée → le formulaire s'ouvre pré-rempli → modifier → sauvegarder.

### 4.6 Supprimer une entrée

Cliquer **"Suppr."** → confirmer la suppression. ⚠️ Irreversible dans le localStorage (mais le JSON original sur GitHub est intact jusqu'au prochain commit).

---

## 5. Honoraires et facturation pro forma

### 5.1 Modifier les tarifs

1. **Admin → Honoraires**
2. Modifier les montants directement dans les champs numériques
3. Cliquer **"Enregistrer les tarifs"** → exporte automatiquement `rates.json`
4. Committer le fichier exporté

### 5.2 Modifier les informations émetteur

Dans la même section (colonne droite) :
- **Nom**, **Titre**, **Adresse**, **Email**
- **Préfixe des factures** : ex. `DRTA` → factures numérotées `DRTA-0001`, `DRTA-0002`...

### 5.3 Générer une facture pro forma (côté public)

Le formulaire de facturation est accessible à tous les visiteurs depuis la section **"Générer une facture pro forma"** sur la page principale.

**Étapes :**
1. Le visiteur sélectionne un tarif → les champs se pré-remplissent (via bouton "Demander un devis")
2. Renseigner les informations client (nom, organisation, email, adresse)
3. Ajouter/modifier les lignes de prestations
4. Cliquer **"Générer la facture pro forma"**
5. La facture s'ouvre dans un nouvel onglet → **Ctrl+P** (ou ⌘+P) → **"Enregistrer en PDF"**

**La facture inclut :**
- Coordonnées complètes (émetteur + client)
- Numéro de facture séquentiel (`DRTA-0001`, etc.)
- Détail des prestations (description, quantité, unité, prix unitaire, total)
- Sous-total, TVA (0% par défaut), total TTC
- Équivalent en XOF (taux fixe FCFA/EUR)
- Date d'émission + date d'échéance calculée
- Conditions de paiement
- Mention "PRO FORMA"

### 5.4 Consulter les factures émises

**Admin → Factures** : liste de toutes les factures générées avec numéro, client, montant et statut.

---

## 6. Bases de données JSON

### Structure des fichiers

Tous les fichiers dans `/data/` sont des JSON valides, lisibles et éditables à la main.

#### `projects.json`

```json
{
  "projects": [
    {
      "id": "P001",
      "category": "epidemio",          // Filtre technique
      "categoryLabel": "Épidémiologie spatiale",  // Libellé affiché
      "title": "Titre du projet",
      "desc": "Description complète...",
      "tools": ["R", "GLMM", "QGIS"],   // Tableau d'outils
      "year": "2022–2023",
      "client": "Institution / ONG",
      "country": ["Bénin", "Malawi"],    // Tableau de pays
      "status": "published",             // published | draft | hidden
      "link": "https://doi.org/...",     // URL externe (optionnel)
      "image": "",                       // URL image (optionnel)
      "featured": false                  // Mise en avant
    }
  ]
}
```

#### `articles.json`

```json
{
  "articles": [
    {
      "id": "A001",
      "slug": "nom-url-article",
      "theme": "Méthodologie",
      "title": "Titre de l'article",
      "summary": "Résumé court (affiché dans la liste)...",
      "content": "Contenu Markdown complet...",
      "date": "2026-01-15",
      "readTime": "10 min",
      "source": "original",             // original | external
      "link": "",                       // URL si source=external
      "image": "",                      // URL image de couverture
      "featured": true,                 // Article en vedette (1 seul)
      "status": "published"             // published | draft
    }
  ]
}
```

#### `rates.json`

Contient deux sections :
- `rates.packages` : les 4 formules tarifaires
- `invoice_settings` : paramètres de facturation (émetteur, préfixe, TVA...)

### Édition directe des JSON

Pour des modifications complexes, vous pouvez éditer les JSON directement avec un éditeur de texte :

```bash
# Éditer un fichier JSON
nano data/projects.json
# ou
code data/projects.json  # VS Code

# Valider la syntaxe JSON
python3 -c "import json; json.load(open('data/projects.json')); print('JSON valide ✓')"

# Committer
git add data/projects.json
git commit -m "feat: ajout projet P010 analyse baobab"
git push
```

---

## 7. Ajouter des contenus externes

Le site supporte plusieurs formats pour les contenus provenant de sources externes.

### 7.1 Liens vers des publications (DOI, HAL, PubMed)

Dans `publications.json`, renseigner les champs `doi` et `link` :

```json
{
  "doi": "10.1111/eea.12748",
  "link": "https://doi.org/10.1111/eea.12748"
}
```

### 7.2 Articles sur des plateformes externes

Dans `articles.json`, utiliser `source: "external"` et renseigner `link` :

```json
{
  "source": "external",
  "link": "https://rpubs.com/tdr12/mon-analyse",
  "title": "Analyse GAM des données entomologiques"
}
```

Plateformes recommandées (gratuites) :
- **RPubs** (rpubs.com) — pour les rapports R Markdown
- **GitHub Gist** — pour les scripts commentés
- **Kaggle Notebooks** — pour les analyses avec données
- **Observable HQ** — pour les visualisations D3.js interactives
- **Google Colab** — pour les notebooks Python

### 7.3 Figures hébergées en externe

Dans `figures.json`, le champ `image` peut être une URL externe :

```json
{
  "image": "https://raw.githubusercontent.com/tdr12/analyses/main/figures/bbtd_trend.png",
  "link": "https://github.com/tdr12/analyses/blob/main/bbtd_analysis.Rmd"
}
```

### 7.4 Rapports hébergés sur Google Drive

1. Uploader le PDF sur Google Drive
2. Clic droit → "Obtenir le lien" → "Tout le monde peut voir"
3. Transformer l'URL de partage en lien direct :
   ```
   Partage : https://drive.google.com/file/d/ID_DU_FICHIER/view?usp=sharing
   Direct  : https://drive.google.com/uc?export=download&id=ID_DU_FICHIER
   ```
4. Utiliser cette URL dans le champ `link` du rapport

### 7.5 Intégration GitHub (code source)

Pour lier un projet à son code source :

```json
{
  "link": "https://github.com/tdr12/bbtd-analysis"
}
```

Le bouton "Voir la publication ↗" apparaîtra automatiquement sur la carte projet.

---

## 8. Personnalisation visuelle

### 8.1 Changer les couleurs

Ouvrir `assets/css/tokens.css` et modifier les variables CSS :

```css
:root {
  --emerald:       #27AE60;  /* Couleur principale verte */
  --emerald-bright:#2ECC71;  /* Vert survol */
  --gold:          #F6C90E;  /* Accent doré */
  --navy:          #0D1B2A;  /* Fond sombre */
  /* ... */
}
```

### 8.2 Ajouter la photo de profil

1. Placer la photo dans `assets/images/profile/photo.jpg`
2. Dans `index.html`, trouver `<div class="about-photo" id="about-photo">` et remplacer par :

```html
<div class="about-photo" id="about-photo">
  <img src="assets/images/profile/photo.jpg" alt="Delano Ronald Togbé">
</div>
```

### 8.3 Modifier les informations personnelles

Éditer directement dans `index.html` :
- La section `#hero` pour le nom et titre
- La section `#about` pour la bio
- La section `#contact` pour les coordonnées

### 8.4 Ajouter une section

1. Ajouter le HTML dans `index.html` (copier le pattern d'une section existante)
2. Créer les styles correspondants dans `assets/css/components.css`
3. Charger les données depuis `db.js` dans `assets/js/app.js`

---

## 9. Changer le mot de passe administrateur

### Méthode (via l'admin)

1. Se connecter à `/admin/login.html` avec le mot de passe actuel
2. Aller dans **Admin → Paramètres → Sécurité**
3. Saisir le nouveau mot de passe (2 fois)
4. Cliquer **"Générer le hash"**
5. Copier le hash affiché (longue chaîne hexadécimale)
6. Ouvrir `assets/js/auth.js`
7. Remplacer la valeur de `ADMIN_HASH` :

```javascript
// Avant
const ADMIN_HASH = '7b4b8f6e2c5d1a3f...';

// Après (coller votre hash)
const ADMIN_HASH = 'votre_nouveau_hash_ici';
```

8. Committer et pusher :

```bash
git add assets/js/auth.js
git commit -m "security: mise à jour mot de passe admin"
git push
```

> ⚠️ Le mot de passe par défaut `Admin2026!` restera accepté tant que la ligne `if (password === 'Admin2026!')` n'est pas retirée de `auth.js`. Supprimez-la après avoir configuré votre hash.

---

## 10. Workflow complet de publication

### Cycle de vie d'une mise à jour

```
┌─────────────────────────────────────────────────────┐
│  1. SE CONNECTER                                      │
│     /admin/login.html → mot de passe                 │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  2. MODIFIER LE CONTENU                               │
│     Admin → Projets / Articles / Figures...           │
│     Les modifications sont stockées en localStorage   │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  3. EXPORTER LES DONNÉES                              │
│     Admin → Tableau de bord → "Exporter toutes les   │
│     données" (ou par section dans chaque onglet)      │
│     → Les fichiers JSON se téléchargent              │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  4. REMPLACER LES JSON                                │
│     Déplacer les fichiers téléchargés dans /data/    │
│     git add data/*.json                               │
│     git commit -m "content: mise à jour projets"     │
│     git push origin main                              │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  5. VÉRIFIER LA MISE EN LIGNE                         │
│     GitHub → Actions → vérifier le déploiement       │
│     Attendre 2–5 minutes                             │
│     Visiter https://tdr12.github.io/portfolio/        │
└─────────────────────────────────────────────────────┘
```

### Commandes git essentielles

```bash
# Vérifier l'état des modifications
git status

# Ajouter tous les changements
git add .

# Ou cibler des fichiers spécifiques
git add data/projects.json data/articles.json

# Committer avec un message descriptif
git commit -m "feat: ajout 2 nouveaux projets et 1 article"

# Pousser vers GitHub (déclenche le déploiement)
git push origin main

# Voir l'historique des commits
git log --oneline -10
```

---

## 11. Dépannage

### Le site ne s'affiche pas après le push

```bash
# Vérifier que .nojekyll existe
ls -la | grep nojekyll

# S'il manque, le créer
touch .nojekyll
git add .nojekyll
git commit -m "fix: ajout .nojekyll"
git push
```

### Les projets ne s'affichent pas

1. Ouvrir la console du navigateur (F12 → Console)
2. Chercher les erreurs en rouge
3. Vérifier que le JSON est valide :
   ```bash
   python3 -c "import json; json.load(open('data/projects.json')); print('OK')"
   ```
4. Vérifier que le statut est bien `"published"` dans le JSON

### L'admin affiche "session expirée" ou redirige vers login

- La session dure 8h à partir de la connexion
- Elle est perdue si vous fermez le navigateur
- Se reconnecter simplement

### Les modifications admin disparaissent après rechargement

C'est normal si vous n'avez pas exporté + commité les JSON. Les modifications en localStorage sont temporaires. Refaire l'export et committer.

### La facture ne s'ouvre pas

Certains navigateurs bloquent les popups. Si la facture ne s'ouvre pas :
1. Autoriser les popups pour le domaine du site
2. Réessayer

---

## 12. Limites et extensions possibles

### Limites actuelles

| Limite | Explication | Solution gratuite |
|--------|-------------|-------------------|
| Pas de backend | GitHub Pages = statique | Netlify Functions (gratuit) |
| Auth basique | Hash côté client visible | Netlify Identity (gratuit) |
| Pas d'email serveur | Formulaire = mailto: | Formspree (gratuit, 50/mois) |
| JSON max ~5MB | Limite localStorage | Aucun problème en pratique |
| Pas de recherche full-text | Pas d'index | Lunr.js (gratuit) |

### Extensions recommandées (toutes gratuites)

**Formulaire de contact avec réception email :**
1. S'inscrire sur [formspree.io](https://formspree.io) (gratuit : 50 emails/mois)
2. Créer un formulaire → obtenir l'endpoint
3. Dans `app.js`, Contact.init(), remplacer la logique mailto par :
```javascript
const res = await fetch('https://formspree.io/f/VOTRE_ID', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, subject, message })
});
```

**Moteur de recherche dans les projets/articles :**
- Ajouter [Lunr.js](https://lunrjs.com/) (CDN, gratuit)
- Indexer les JSON au chargement
- Ajouter un `<input>` de recherche

**Statistiques de visite :**
- [Umami Analytics](https://umami.is/) — open-source, RGPD, hébergeable sur Railway (gratuit)
- [Plausible](https://plausible.io/) — 30 jours d'essai, puis ~9€/mois

**Auth renforcée (si données sensibles) :**
- Migrer vers Netlify (hébergement gratuit compatible)
- Activer Netlify Identity
- Protection des routes via middleware Netlify

**Blog Markdown complet :**
- Ajouter un parseur Markdown côté client : [marked.js](https://marked.js.org/) (CDN, gratuit)
```html
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
```
```javascript
document.getElementById('article-content').innerHTML = marked.parse(article.content);
```

---

## Support

Pour toute question sur l'utilisation de ce portfolio :
- **Email :** delanodray@gmail.com
- **GitHub Issues :** github.com/tdr12/portfolio/issues

---

*Guide rédigé en juin 2026 · Portfolio v1.0*
