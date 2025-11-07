# 🚀 Guide de Déploiement

Ce guide vous explique comment déployer **The Courrier** sur **Vercel**.

---

## 📋 Prérequis

Avant de déployer, assurez-vous d'avoir :

- ✅ Un compte GitHub avec votre projet poussé sur la branche `main`
- ✅ Le projet buildé avec succès en local (`npm run build`)
- ✅ Les dépendances installées (`npm install`)

> **Note** : La clé API Nexus Mods n'est **plus requise côté serveur**. Les utilisateurs configurent leurs propres identifiants directement dans l'application via le modal au premier lancement.

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

### 3️⃣ Configurer les variables d'environnement (Optionnel)

Dans la page d'import, avant de déployer :

1. Dépliez la section **"Environment Variables"**
2. **Cette étape est maintenant optionnelle** ! Deux options s'offrent à vous :

#### Option A : Configuration par l'utilisateur (Recommandé ⭐)

Ne configurez **aucune variable d'environnement**. Les utilisateurs entreront leur propre nom d'utilisateur et clé API au premier lancement de l'application via un modal.

**Avantages** :
- ✅ Chaque utilisateur utilise son propre compte Nexus Mods
- ✅ Pas de limite de rate-limit partagée
- ✅ Meilleure sécurité : credentials stockés localement dans le navigateur

#### Option B : Configuration serveur (Ancienne méthode)

Si vous voulez que tous les utilisateurs utilisent le même compte Nexus Mods, ajoutez :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `NEXUS_API_KEY` | Votre clé API Nexus Mods | Clé obtenue sur nexusmods.com |
| `NEXUS_USERNAME` | Votre nom d'utilisateur | Votre username Nexus Mods |

> **Note** : Si ces variables ne sont pas définies, l'application demandera automatiquement les credentials à l'utilisateur.

### 4️⃣ Déployer

Cliquez sur **"Deploy"** et attendez que le build se termine (2-3 minutes).

### 5️⃣ Tester

Une fois déployé, votre site sera accessible sur une URL du type :

```text
https://your-app-name.vercel.app
```

**Au premier lancement** :
- Un modal s'affichera demandant le nom d'utilisateur et la clé API Nexus Mods
- Les utilisateurs entreront leurs propres identifiants
- Ces informations seront stockées localement dans le navigateur (localStorage)
- Chaque utilisateur utilisera son propre compte Nexus Mods

**Si vous avez configuré les variables d'environnement** :
- L'application utilisera directement ces credentials
- Le modal ne s'affichera pas

---

## 🔧 Structure des Fonctions Serverless

Les fonctions sont dans `/api/nexus/` et sont automatiquement accessibles :

- `validate.mjs` → Endpoint : `POST /api/nexus/validate`
- `tracked.mjs` → Endpoint : `GET /api/nexus/tracked`
- `untrack.mjs` → Endpoint : `DELETE /api/nexus/untrack?domain=:domain&modId=:modId`

> **Important** : Les rewrites pour Vercel sont configurés dans `vercel.json` pour gérer les paramètres d'URL.

---

## 🧪 Test en Local avec les Fonctions Serverless

### Avec le CLI Vercel

```bash
# Installer le CLI Vercel
npm install -g vercel

# Démarrer en dev avec les fonctions
vercel dev
```

### Avec le serveur Express existant (Alternative)

```bash
# Le serveur Express local fonctionne toujours pour le développement
npm start
# Dans un autre terminal
npm run server
```

> **Note** : Le serveur Express (`server.mjs`) est principalement pour le développement local. En production, utilisez les fonctions serverless Vercel.

---

## 🔒 Sécurité

- ✅ **Stockage local** : Les identifiants sont stockés uniquement dans le localStorage du navigateur de chaque utilisateur
- ✅ **Pas de serveur** : Aucune clé API n'est stockée sur Vercel
- ✅ **Proxy sécurisé** : Les fonctions serverless relaient les requêtes sans stocker les credentials
- ✅ **Headers de sécurité** : X-Frame-Options, X-Content-Type-Options, Referrer-Policy configurés
- ✅ **Isolation utilisateur** : Chaque utilisateur utilise son propre compte Nexus Mods

> **Important** : Ne jamais commiter de fichier `.env` contenant des clés API dans votre dépôt Git.

> **Configuration détaillée** : voir [CREDENTIALS_CONFIG.md](./CREDENTIALS_CONFIG.md)

---

## 🐛 Dépannage

### Erreur "Missing NEXUS_API_KEY"

➡️ Cette erreur apparaît si l'utilisateur n'a pas encore entré ses credentials dans le modal.

**Solution** : Laissez l'utilisateur configurer ses credentials via le modal au premier lancement.

### Le modal ne s'affiche pas

➡️ Vérifiez si des credentials sont déjà stockés dans le localStorage :

1. Ouvrez la console du navigateur (F12)
2. Allez dans l'onglet "Application" > "Local Storage"
3. Cherchez la clé `nexus_credentials`
4. Supprimez-la pour réinitialiser et afficher le modal

### Les fonctions ne répondent pas

➡️ Vérifiez les logs de vos fonctions serverless dans le Dashboard Vercel → Deployment → Runtime Logs

### Build échoue

➡️ Assurez-vous que toutes les dépendances sont présentes dans `package.json`. Installez-les localement pour vérifier :

```bash
npm install
npm run build
```

### Erreur CORS

➡️ Les fonctions serverless incluent déjà les headers CORS. Si vous rencontrez des problèmes, vérifiez que vous appelez bien les endpoints via `/api/nexus/*` et non directement les fonctions.

### Credentials non sauvegardés

➡️ Si le localStorage ne fonctionne pas :

- Vérifiez que les cookies ne sont pas bloqués dans votre navigateur
- Essayez en navigation privée pour tester
- Vérifiez les paramètres de confidentialité du navigateur

---

## 📦 Déploiements Automatiques

Vercel déploie automatiquement à chaque push sur la branche configurée (par défaut `main`).

**Pour désactiver les déploiements auto** : Project settings → Git → Disable auto deploy

**Pour changer de branche de production** : Project settings → Git → Production Branch

---

## 📞 Support

- [Documentation Vercel Functions](https://vercel.com/docs/functions)
- [API Nexus Mods](https://app.swaggerhub.com/apis-docs/NexusMods/nexus-mods_public_api_params_in_form_data/1.0)
- [Configuration des credentials](./CREDENTIALS_CONFIG.md)

---

## 🎉 Conclusion

Bon déploiement ! 🚀
