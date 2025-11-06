# 🚀 Guide de Déploiement

Ce guide vous explique comment déployer **The Courrier** sur **Netlify** ou **Vercel**.

---

## 📋 Prérequis

Avant de déployer, assurez-vous d'avoir :
- ✅ Un compte GitHub avec votre projet poussé
- ✅ Votre **clé API Nexus Mods** (obtenue sur [nexusmods.com](https://www.nexusmods.com/users/myaccount?tab=api))
- ✅ Le projet buildé avec succès en local (`npm run build`)

---

## 🟦 Déploiement sur Netlify

### 1️⃣ Créer un compte et importer le projet

1. Allez sur [netlify.com](https://netlify.com) et créez un compte (ou connectez-vous)
2. Cliquez sur **"Add new site"** → **"Import an existing project"**
3. Connectez votre compte GitHub et sélectionnez le repo **The_Courrier**

### 2️⃣ Configuration du build

Netlify devrait détecter automatiquement les paramètres grâce au fichier `netlify.toml` :

- **Build command** : `npm run build`
- **Publish directory** : `build`
- **Functions directory** : `netlify/functions`

Si ce n'est pas le cas, ajoutez-les manuellement.

### 3️⃣ Configurer les variables d'environnement

Dans les paramètres du site Netlify :

1. Allez dans **Site settings** → **Environment variables**
2. Ajoutez les variables suivantes :

| Variable | Valeur |
|----------|--------|
| `NEXUS_API_KEY` | Votre clé API Nexus Mods |
| `NEXUS_APP_NAME` | `the-courrier` (ou votre nom d'app) |
| `NEXUS_USERNAME` | Votre nom d'utilisateur Nexus |

### 4️⃣ Déployer

Cliquez sur **"Deploy site"** et attendez que le build se termine (2-3 minutes).

### 5️⃣ Tester

Une fois déployé, votre site sera accessible sur une URL du type :
```
https://your-app-name.netlify.app
```

---

## 🔺 Déploiement sur Vercel

### 1️⃣ Créer un compte et importer le projet

1. Allez sur [vercel.com](https://vercel.com) et créez un compte (ou connectez-vous)
2. Cliquez sur **"Add New..."** → **"Project"**
3. Importez votre repo GitHub **The_Courrier**

### 2️⃣ Configuration du build

Vercel devrait détecter automatiquement qu'il s'agit d'une app React :

- **Framework Preset** : Create React App
- **Build Command** : `npm run build`
- **Output Directory** : `build`

### 3️⃣ Configurer les variables d'environnement

Dans la page d'import, avant de déployer :

1. Dépliez la section **"Environment Variables"**
2. Ajoutez les variables suivantes :

| Variable | Valeur |
|----------|--------|
| `NEXUS_API_KEY` | Votre clé API Nexus Mods |
| `NEXUS_APP_NAME` | `the-courrier` (ou votre nom d'app) |
| `NEXUS_USERNAME` | Votre nom d'utilisateur Nexus |

### 4️⃣ Déployer

Cliquez sur **"Deploy"** et attendez que le build se termine (2-3 minutes).

### 5️⃣ Tester

Une fois déployé, votre site sera accessible sur une URL du type :
```
https://your-app-name.vercel.app
```

---

## 🔧 Structure des Fonctions Serverless

### Netlify
Les fonctions sont dans `/netlify/functions/` :
- `nexus-validate.mjs` → `/api/nexus/validate`
- `nexus-tracked.mjs` → `/api/nexus/tracked`
- `nexus-untrack.mjs` → `/api/nexus/tracked/:domain/:modId`

### Vercel
Les fonctions sont dans `/api/nexus/` :
- `validate.mjs` → `/api/nexus/validate`
- `tracked.mjs` → `/api/nexus/tracked`
- `untrack.mjs` → `/api/nexus/untrack`

---

## 🧪 Test en Local avec les Fonctions Serverless

### Pour Netlify
```bash
# Installer le CLI Netlify
npm install -g netlify-cli

# Démarrer en dev avec les fonctions
netlify dev
```

### Pour Vercel
```bash
# Installer le CLI Vercel
npm install -g vercel

# Démarrer en dev avec les fonctions
vercel dev
```

### Ou utiliser le serveur existant
```bash
# Le serveur Express local fonctionne toujours
npm start
node server.mjs
```

---

## 🔒 Sécurité

- ✅ Les clés API sont stockées dans les variables d'environnement (jamais dans le code)
- ✅ Les fonctions serverless font office de proxy pour cacher vos clés
- ✅ CORS configuré pour accepter uniquement votre domaine en production

---

## 🐛 Dépannage

### Erreur "Missing NEXUS_API_KEY"
➡️ Vérifiez que vous avez bien ajouté la variable d'environnement dans les paramètres de votre hébergeur.

### Les fonctions ne répondent pas
➡️ Vérifiez les logs :
- **Netlify** : Onglet "Functions" dans le dashboard
- **Vercel** : Onglet "Logs" dans le dashboard

### Build échoue
➡️ Vérifiez que toutes les dépendances sont dans `package.json` :
```bash
npm install node-fetch cors express dotenv
```

---

## 📦 Déploiements Automatiques

Les deux plateformes déploient automatiquement à chaque push sur `main` (ou votre branche par défaut).

Pour désactiver les déploiements auto :
- **Netlify** : Site settings → Build & deploy → Stop auto publishing
- **Vercel** : Project settings → Git → Disable auto deploy

---

## 🎯 Recommandations

| Critère | Netlify | Vercel |
|---------|---------|--------|
| **Simplicité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Free tier** | 100GB/mois | 100GB/mois |
| **Functions** | 125k req/mois | 100GB-hours/mois |

**Conseil** : Les deux sont excellents. Choisissez selon vos préférences ! 

---

## 📞 Support

- [Documentation Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Documentation Vercel Functions](https://vercel.com/docs/functions)
- [API Nexus Mods](https://app.swaggerhub.com/apis-docs/NexusMods/nexus-mods_public_api_params_in_form_data/1.0)

---

**Bon déploiement ! 🚀**
