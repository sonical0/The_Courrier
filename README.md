# The Courrier

Une WebApp permettant de suivre les mises à jour de vos mods favoris sur Nexus Mods. L'application affiche les actualités des mods avec leurs changelogs, versions, et permet de gérer vos mods suivis par jeu.

## ✨ Fonctionnalités

### 📰 Actualités des Mods (ActuUpdatePage)
- Affichage des mods récemment mis à jour
- Filtrage par période (7, 15, 30 jours, année passée)
- **Noms réels des jeux** avec icônes officielles Nexus Mods
- Changelogs détaillés avec version précédente
- Liens directs vers les pages Nexus Mods

### 🎮 Mods Suivis (NexusModsPage)
- Vue par jeu de tous vos mods suivis
- Gestion des mods (ne plus suivre)
- Informations détaillées (version, auteur, changelog)
- Dates de mise à jour

### 🔧 Configuration
- Interface de configuration des identifiants Nexus Mods
- Stockage sécurisé dans le navigateur (localStorage)
- Mode clair/sombre
- Interface responsive (mobile, tablette, desktop)

## 🆕 Configuration des Identifiants

Cette application permet aux utilisateurs de **configurer leurs propres identifiants Nexus Mods** directement dans l'interface, sans avoir besoin de les stocker sur le serveur.

### ⚡ Démarrage Rapide

1. Lancez l'application
2. Une popup s'affiche automatiquement pour demander vos identifiants Nexus Mods
3. Entrez votre **nom d'utilisateur** et votre **clé API** (obtenez-la sur [nexusmods.com/users/myaccount?tab=api](https://www.nexusmods.com/users/myaccount?tab=api))
4. Cliquez sur "Enregistrer"
5. Profitez de l'application !

### 🔐 Sécurité

- Vos identifiants sont stockés **uniquement dans votre navigateur** (localStorage)
- Aucune donnée sensible n'est envoyée ni stockée sur nos serveurs
- Les credentials transitent uniquement entre votre navigateur et les serveurs de Nexus Mods

## 🏗️ Architecture

### Frontend (React)
```
src/
  pages/
    ActuUpdatePage.jsx         # Actualités des mods mis à jour
    NexusModsPage.jsx          # Liste des mods suivis par jeu
  components/
    CredentialsModal.jsx       # Modal de configuration Nexus Mods
    useNexusCredentials.js     # Hook de gestion des credentials (localStorage)
    useNexusMods.js            # Hook d'appels API Nexus Mods
    useTheme.js                # Hook de gestion du thème clair/sombre
```

### Backend (Node.js/Express + Serverless)
```
server.mjs                     # Serveur local de développement
api/nexus/                     # Fonctions Vercel
  tracked.mjs                  # Récupération des mods suivis (+ enrichissement)
  untrack.mjs                  # Suppression d'un mod suivi
  validate.mjs                 # Validation des credentials
netlify/functions/             # Fonctions Netlify (équivalentes)
  nexus-tracked.mjs
  nexus-untrack.mjs
  nexus-validate.mjs
```

### Cache et Performance
- **Mods suivis** : Cache 60s (évite les appels répétés)
- **Détails des mods** : Cache 10min par mod
- **Informations de jeux** : Cache 24h (noms, icônes)

## � Installation et Développement

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Nexus Mods avec API key

### Installation

```bash
# Cloner le repository
git clone https://github.com/sonical0/The_Courrier.git
cd The_Courrier

# Installer les dépendances
npm install
```

### Développement Local

```bash
# Terminal 1 : Serveur backend (port 4000)
npm run server

# Terminal 2 : Serveur React (port 4001)
npm start
```

L'application sera accessible sur `http://localhost:4001`

### Build Production

```bash
npm run build
```

## 📦 Déploiement

L'application est prête pour être déployée sur :

### Vercel
- Les fonctions serverless sont dans `/api/nexus/`
- Configuration dans `vercel.json`

### Netlify
- Les fonctions serverless sont dans `/netlify/functions/`
- Configuration dans `netlify.toml`

📖 Consultez [DEPLOYMENT.md](./DEPLOYMENT.md) pour les instructions détaillées.

## 📚 Documentation

- [CHANGELOG.md](./CHANGELOG.md) - Historique complet des versions
- [CREDENTIALS_CONFIG.md](./CREDENTIALS_CONFIG.md) - Configuration des identifiants
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guide de déploiement
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Guide de tests

## 🔄 Changelog Récent

### Version 3.0.0 (6 Nov 2025)
- ✅ Affichage des vrais noms de jeux avec icônes
- ✅ Renommage `BootstrapPage` → `ActuUpdatePage`
- ✅ Suppression de `TailwindPage` et `useWeather` (non utilisés)
- ✅ Amélioration du layout des cartes
- ✅ Correction du bug de reconnexion

### Version 2.0.0 (5 Nov 2025)
- ✅ Configuration des credentials dans l'interface
- ✅ Stockage local sécurisé (localStorage)
- ✅ Support multi-utilisateurs

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

Voir [LICENSE](./LICENSE) pour plus de détails.

## 👤 Auteur

**sonical0**
- GitHub: [@sonical0](https://github.com/sonical0)
- Repository: [The_Courrier](https://github.com/sonical0/The_Courrier)

---

Made with ❤️ for the modding community
