# The Courrier 

> **WebApp de veille technologique pour les mods Nexus Mods**

Une application web moderne permettant de suivre et monitorer les mises à jour de vos mods favoris sur Nexus Mods. Profitez d'une interface épurée pour consulter les actualités, changelogs et gérer vos mods suivis par jeu.

[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.18-38B2AC.svg)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

---

##  Pitch du Projet

**The Courrier** est une webapp de **veille de données** pour les modifications (mods) de jeux vidéo hébergées sur Nexus Mods. Elle permet aux joueurs et moddeurs de :

-  **Surveiller** les mises à jour de leurs mods favoris en temps réel
- � **Analyser** les changelogs et historiques de versions
-  **Organiser** leurs mods par jeu avec une interface intuitive
- � **Être informés** des dernières nouveautés de la communauté modding

Contrairement à l'interface standard de Nexus Mods, The Courrier offre une expérience optimisée pour la veille avec :
- Filtrage temporel avancé (7/15/30 jours, année)
- Affichage enrichi avec noms de jeux et icônes officielles
- Gestion personnalisée des credentials par utilisateur
- Mode sombre/clair pour un confort optimal

---

## � Stack Technique

### Frontend
- **React 19.2.0** - Framework JavaScript pour interfaces utilisateur
- **React Router 7.9.4** - Navigation côté client (SPA)
- **Tailwind CSS 3.4.18** - Framework CSS utility-first pour le design
- **Bootstrap 5.3.8** - Composants UI complémentaires
- **JavaScript (ES6+)** - Langage principal

### Backend
- **Node.js 18+** - Runtime JavaScript
- **Express 4.19.2** - Serveur HTTP pour développement local
- **node-fetch 3.3.2** - Client HTTP pour appels API
- **Serverless Functions** - Architecture sans serveur (Vercel)

### Outils de Développement
- **Create React App 5.0.1** - Toolchain React
- **Vercel** - Plateforme de déploiement
- **Git** - Contrôle de version

---

## Captures d'écran

### Homepage - Premier lancement (Mode clair)
![Homepage premier lancement](./screenshots/homepage-first-launch-light.png)
*Page d'accueil au premier lancement avec modal de configuration des identifiants*

### Homepage - Mises à jour récentes
![Page d'accueil](./screenshots/homepage.png)
*Suivez les mises à jour de vos mods favoris avec un filtrage temporel avancé*

### Liste des mods - Desktop (Mode clair)
![Liste des mods desktop](./screenshots/mods-list-desktop-light.png)
*Vue desktop de la liste des mods avec layout optimisé pour grands écrans*

### Liste des mods par jeu
![Liste des mods](./screenshots/mods-list.png)
*Gérez tous vos mods suivis, organisés par jeu*

### Configuration des identifiants
![Modal de configuration](./screenshots/credentials-modal.png)
*Configuration simple et sécurisée de vos identifiants Nexus Mods*

---

##  Fonctionnalités

###  Actualités des Mods (ActuUpdatePage)
- Affichage des mods récemment mis à jour
- Filtrage par période (7, 15, 30 jours, année passée)
- **Noms réels des jeux** avec icônes officielles Nexus Mods
- Changelogs détaillés avec version précédente
- Liens directs vers les pages Nexus Mods

###  Mods Suivis (NexusModsPage)
- Vue par jeu de tous vos mods suivis
- Gestion des mods (ne plus suivre)
- Informations détaillées (version, auteur, changelog)
- Dates de mise à jour

###  Configuration
- Interface de configuration des identifiants Nexus Mods
- Stockage sécurisé dans le navigateur (localStorage)
- Mode clair/sombre
- Interface responsive (mobile, tablette, desktop)

##  Démarrage Rapide

### Prérequis

- **Node.js 18+** et npm
- Un compte **Nexus Mods** (gratuit)
- Une **clé API Nexus Mods**

### Obtenir votre clé API Nexus Mods

1. Créez un compte sur [nexusmods.com](https://www.nexusmods.com) (si ce n'est pas déjà fait)
2. Connectez-vous et allez sur votre page de compte
3. Cliquez sur l'onglet **"API Access"** : [https://www.nexusmods.com/users/myaccount?tab=api](https://www.nexusmods.com/users/myaccount?tab=api)
4. Cliquez sur **"Generate API Key"** (si vous n'en avez pas déjà une)
5. Copiez votre clé API (elle ressemble à : `abc123def456...`)

>  **Important** : Ne partagez jamais votre clé API publiquement !

**Credentials de test disponibles** (pour tester rapidement l'application) :

- **Username** : `TheCourrier0`
- **Password** : `The Courrier0` (pour se connecter sur nexusmods.com)
- **API Key** : `UWM49C/gfBy+QCvaL2pe9p+C8PLiNji+HjObvGWuxsI9qKW3X1I=--LjVbDPG5bU/U59Ph--lzlQfxo4wC5kS6KTnG0IMw==`

>  Ces credentials sont publics et destinés aux tests uniquement. Créez votre propre compte pour une utilisation personnelle.

### Installation

```bash
# Cloner le repository
git clone https://github.com/sonical0/The_Courrier.git
cd The_Courrier

# Installer les dépendances
npm install
```

### Lancement du projet

#### Option 1 : Développement avec serveur local (Recommandé)

```bash
# Terminal 1 : Démarrer le serveur backend Express (port 4000)
npm run server

# Terminal 2 : Démarrer l'application React (port 3000)
npm start
```

L'application sera accessible sur **http://localhost:3000**

#### Option 2 : Build production

```bash
# Créer le build optimisé
npm run build

# Le dossier build/ contiendra les fichiers prêts pour le déploiement
```

### Premier lancement

1. Ouvrez l'application dans votre navigateur
2. Une **popup de configuration** s'affiche automatiquement
3. Entrez votre **nom d'utilisateur Nexus Mods**
4. Entrez votre **clé API** (obtenue précédemment)
5. Cliquez sur **"Enregistrer"**
6. C'est prêt ! 

Vos identifiants sont stockés localement dans votre navigateur et ne sont jamais envoyés à nos serveurs.

##  Architecture Technique

### Sitemap & Routing

L'application utilise **React Router** pour la navigation côté client (Single Page Application) :

```
/                           → ActuUpdatePage (page d'accueil)
/nexus-mods                 → NexusModsPage (gestion des mods suivis)
```

### Structure des Composants

```
src/
├── App.jsx                              # Point d'entrée principal
│   ├── Router & Routes                  # Configuration du routing
│   ├── Header avec navigation           # Barre de navigation persistante
│   ├── Gestion des credentials          # Hook useNexusCredentials
│   └── Gestion du thème                 # Hook useTheme (dark/light)
│
├── pages/
│   ├── ActuUpdatePage.jsx               # Page des actualités de mods
│   │   ├── Filtrage temporel            # 7j/15j/30j/année
│   │   ├── Affichage des mods mis à jour
│   │   ├── Changelogs enrichis          # Version actuelle vs précédente
│   │   └── Liens vers Nexus Mods
│   │
│   └── NexusModsPage.jsx                # Page de gestion des mods suivis
│       ├── Dropdown de sélection de jeu # Organisé par domaine de jeu
│       ├── Liste des mods par jeu       # Filtrée dynamiquement
│       ├── Détails des mods             # Version, auteur, changelog
│       └── Action "Ne plus suivre"      # Untrack avec confirmation
│
└── components/
    ├── CredentialsModal.jsx             # Modal de configuration Nexus Mods
    │   ├── Formulaire username/API key
    │   ├── Validation des champs
    │   ├── Affichage conditionnel       # Auto au 1er lancement
    │   └── Gestion de l'annulation
    │
    ├── useNexusCredentials.js           # Hook de gestion des credentials
    │   ├── Lecture du localStorage
    │   ├── Sauvegarde sécurisée
    │   ├── Suppression
    │   └── État de chargement
    │
    ├── useNexusMods.js                  # Hook d'interaction avec l'API Nexus
    │   ├── Fetch des mods suivis        # GET /api/nexus/tracked
    │   ├── Untrack d'un mod             # DELETE /api/nexus/tracked/:domain/:modId
    │   ├── Enrichissement des données   # Normalisation & cache
    │   ├── Gestion des jeux             # Groupement par domaine
    │   └── Injection des credentials    # Headers HTTP personnalisés
    │
    └── useTheme.js                      # Hook de gestion du thème
        ├── Détection automatique        # Préférence système
        ├── Toggle manuel                # Bouton jour/nuit
        └── Persistance                  # localStorage
```

### Services & API

#### Backend Local (Développement)

```
server.mjs                               # Serveur Express pour dev local
├── PORT 4000
├── Endpoints :
│   ├── GET  /api/nexus/validate         # Validation des credentials
│   ├── GET  /api/nexus/tracked          # Liste des mods suivis
│   └── DELETE /api/nexus/tracked/:domain/:modId
└── Proxy vers API Nexus Mods
```

#### Fonctions Serverless (Production - Vercel)

```
api/nexus/
├── validate.mjs                         # POST /api/nexus/validate
├── tracked.mjs                          # GET /api/nexus/tracked
│   ├── Cache 60s pour la liste complète
│   ├── Cache 10min par mod individuel
│   ├── Cache 24h pour infos de jeux
│   ├── Enrichissement avec details
│   └── Enrichissement avec changelogs
└── untrack.mjs                          # DELETE /api/nexus/untrack
    └── Query params: domain, modId
```

### Flux de Données

```
┌─────────────┐
│  Utilisateur │
└──────┬──────┘
       │ 1. Configure credentials (username + API key)
       ↓
┌─────────────────┐
│  localStorage   │ ← Stockage sécurisé local
└──────┬──────────┘
       │ 2. Credentials injectés dans les headers HTTP
       ↓
┌──────────────────────┐
│  useNexusMods Hook   │
└──────┬───────────────┘
       │ 3. Appels API avec headers X-Nexus-Username & X-Nexus-ApiKey
       ↓
┌───────────────────────┐
│ Serverless Functions │
└──────┬────────────────┘
       │ 4. Proxy + Enrichissement + Cache
       ↓
┌─────────────────────────┐
│  API Nexus Mods (HTTPS) │
└──────┬──────────────────┘
       │ 5. Données brutes
       ↓
┌───────────────────────┐
│ Serverless Functions │ ← Enrichissement & Formatage
└──────┬────────────────┘
       │ 6. Données enrichies
       ↓
┌──────────────────────┐
│  Composants React    │ ← Affichage UI
└──────────────────────┘
```

### Système de Cache

| Donnée | TTL | Clé de cache |
|--------|-----|--------------|
| Liste des mods suivis | 60 secondes | `tracked` |
| Détails d'un mod | 10 minutes | `mod:{domain}:{id}` |
| Informations de jeu | 24 heures | `game:{domain}` |

Le cache est en mémoire côté serveur et réinitialisé à chaque redémarrage de fonction serverless.

##  Endpoints API Nexus Mods

L'application utilise l'API publique officielle de Nexus Mods v1. Tous les appels transitent par nos fonctions serverless pour sécuriser les credentials.

### Endpoints Utilisés

| Endpoint Nexus Mods | Méthode | Usage | Documentation |
|---------------------|---------|-------|---------------|
| `/v1/users/validate.json` | GET | Validation des credentials API | [ Doc](https://app.swaggerhub.com/apis-docs/NexusMods/nexus-mods_public_api_params_in_form_data/1.0#/default/get_v1_users_validate_json) |
| `/v1/user/tracked_mods.json` | GET | Liste des mods suivis par l'utilisateur | [ Doc](https://app.swaggerhub.com/apis-docs/NexusMods/nexus-mods_public_api_params_in_form_data/1.0#/default/get_v1_user_tracked_mods_json) |
| `/v1/games/{game_domain_name}/mods/{id}.json` | GET | Détails d'un mod spécifique | [ Doc](https://app.swaggerhub.com/apis-docs/NexusMods/nexus-mods_public_api_params_in_form_data/1.0#/default/get_v1_games__game_domain_name__mods__id__json) |
| `/v1/games/{game_domain_name}/mods/{id}/changelogs.json` | GET | Changelogs d'un mod | [ Doc](https://app.swaggerhub.com/apis-docs/NexusMods/nexus-mods_public_api_params_in_form_data/1.0#/default/get_v1_games__game_domain_name__mods__id__changelogs_json) |
| `/v1/games/{game_domain_name}.json` | GET | Informations sur un jeu (nom, icône) | [ Doc](https://app.swaggerhub.com/apis-docs/NexusMods/nexus-mods_public_api_params_in_form_data/1.0#/default/get_v1_games__game_domain_name__json) |

### Nos Endpoints (Proxy)

| Endpoint The Courrier | Méthode | Proxie vers | Description |
|-----------------------|---------|-------------|-------------|
| `/api/nexus/validate` | POST | `/v1/users/validate.json` | Vérifie les credentials utilisateur |
| `/api/nexus/tracked` | GET | `/v1/user/tracked_mods.json` + enrichissement | Récupère et enrichit la liste des mods suivis |
| `/api/nexus/tracked/:domain/:modId` | DELETE | - | Retire un mod de la liste de suivi |

### Authentification

Tous les appels à l'API Nexus Mods nécessitent :

```http
Headers:
  apikey: YOUR_NEXUS_API_KEY
  Application-Name: The Courrier
  User-Agent: The Courrier (username)
```

En production, ces headers sont automatiquement ajoutés par nos fonctions serverless. Les credentials utilisateur sont transmis via des headers personnalisés :

```http
Headers:
  X-Nexus-Username: username_from_localstorage
  X-Nexus-ApiKey: apikey_from_localstorage
```

### Rate Limits

L'API Nexus Mods impose des limites :
- **Utilisateurs gratuits** : ~100 requêtes/heure
- **Utilisateurs premium** : ~200 requêtes/heure

Notre système de cache réduit considérablement le nombre d'appels API réels.

### Documentation Complète

 **Documentation officielle Nexus Mods API v1** :
[https://app.swaggerhub.com/apis-docs/NexusMods/nexus-mods_public_api_params_in_form_data/1.0](https://app.swaggerhub.com/apis-docs/NexusMods/nexus-mods_public_api_params_in_form_data/1.0)

---

##  Sécurité & Credentials

Chaque utilisateur configure ses propres identifiants Nexus Mods via l'interface, stockés dans le localStorage du navigateur.

**Configuration détaillée des identifiants** : voir [CREDENTIALS_CONFIG.md](./CREDENTIALS_CONFIG.md)

---

##  Déploiement

L'application peut être déployée sur **Vercel** sans configuration complexe. Aucune variable d'environnement n'est nécessaire - chaque utilisateur configure ses propres identifiants.

**Guide complet de déploiement** : voir [DEPLOYMENT.md](./DEPLOYMENT.md)

---

##  Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guide complet de déploiement sur Vercel
- **[CREDENTIALS_CONFIG.md](./CREDENTIALS_CONFIG.md)** - Configuration détaillée des identifiants
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Scénarios de test et validation
- **[CHANGELOG.md](./CHANGELOG.md)** - Historique complet des versions
- **[SUMMARY.md](./SUMMARY.md)** - Vue d'ensemble et guide d'utilisation

---

##  Scripts NPM

| Commande | Description |
|----------|-------------|
| `npm start` | Lance le serveur de développement React (port 3000) |
| `npm run server` | Lance le serveur Express local (port 4000) |
| `npm run build` | Crée le build optimisé pour la production |
| `npm test` | Lance les tests unitaires (Jest + React Testing Library) |
| `npm run eject` | Éjecte la configuration CRA ( irréversible) |

---

##  Tests

**Scénarios de test complets** : voir [TESTING_GUIDE.md](./TESTING_GUIDE.md)

**Tests Rapides** (2 minutes) :

1.  Vérifier l'affichage du modal au premier lancement
2.  Configurer des credentials de test
3.  Naviguer vers "Nexus Mods" et vérifier le chargement
4.  Rafraîchir (F5) et vérifier la persistance des credentials

### Tests Automatisés

```bash
npm test
```

---

##  Changelog

**Historique complet des versions** : voir [CHANGELOG.md](./CHANGELOG.md)

### Version 3.0.0 (6 Nov 2025)

-  Affichage des vrais noms de jeux avec icônes officielles
-  Renommage `BootstrapPage` → `ActuUpdatePage`
-  Suppression de `TailwindPage` et `useWeather` (non utilisés)
-  Amélioration du layout des cartes de mods
-  Correction du bug de reconnexion après suppression des credentials

### Version 2.0.0 (5 Nov 2025)

-  Configuration des credentials dans l'interface utilisateur
-  Stockage local sécurisé (localStorage)
-  Support multi-utilisateurs
-  Architecture serverless compatible Vercel

### Version 1.0.0 (Initial)

-  Interface de base avec React
-  Intégration API Nexus Mods
-  Page d'actualités des mods
-  Page de gestion des mods suivis

---

##  Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. **Fork** le projet
2. Créez une **branche** pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. **Committez** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une **Pull Request**

### Guidelines

- Respectez la structure de code existante
- Ajoutez des tests pour les nouvelles fonctionnalités
- Mettez à jour la documentation si nécessaire
- Suivez les conventions de nommage JavaScript/React

---

##  Licence

Voir [LICENSE](./LICENSE) pour plus de détails.

---

##  Auteur

**sonical0**
- GitHub: [@sonical0](https://github.com/sonical0)
- Repository: [The_Courrier](https://github.com/sonical0/The_Courrier)

---

##  Remerciements

- **Nexus Mods** pour leur API publique
- La communauté **React** et **Tailwind CSS**
- Tous les contributeurs du projet

---

## � Support & Contact

-  **Bugs** : Ouvrez une issue sur [GitHub](https://github.com/sonical0/The_Courrier/issues)
-  **Suggestions** : Créez une discussion sur [GitHub Discussions](https://github.com/sonical0/The_Courrier/discussions)
-  **Documentation** : Consultez les fichiers `.md` dans le repository

---

**Made with  for the modding community**

---

##  Liens Utiles

- [Nexus Mods](https://www.nexusmods.com) - Plateforme de mods
- [API Nexus Mods Documentation](https://app.swaggerhub.com/apis-docs/NexusMods/nexus-mods_public_api_params_in_form_data/1.0) - Documentation API
- [React Documentation](https://react.dev) - Framework frontend
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS
- [Vercel](https://vercel.com) - Plateforme de déploiement


````


