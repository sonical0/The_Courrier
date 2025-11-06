# Configuration des Identifiants Nexus Mods

## Vue d'ensemble

Cette application permet désormais aux utilisateurs de configurer leurs propres identifiants Nexus Mods de manière sécurisée et locale, sans avoir besoin de les stocker sur le serveur.

## Fonctionnalités

### 🔐 Stockage Local et Sécurisé

- Les identifiants (username et API key) sont stockés uniquement dans le **localStorage** du navigateur de l'utilisateur
- Aucune donnée sensible n'est envoyée ni stockée sur les serveurs Vercel/Netlify
- Les credentials transitent uniquement entre le navigateur de l'utilisateur et les serveurs de Nexus Mods via les fonctions serverless

### 🎨 Interface Utilisateur

- **Modal de configuration** : Une popup s'affiche automatiquement au premier lancement si aucun identifiant n'est configuré
- **Bouton de configuration** : Dans la barre de navigation, permet de modifier les identifiants à tout moment
- **Badge utilisateur** : Affiche le nom d'utilisateur connecté dans la navbar
- **Bouton de suppression** : Permet d'effacer les identifiants localement

### 🔄 Fonctionnement

1. Au premier lancement, l'utilisateur voit une popup lui demandant :
   - Son **nom d'utilisateur Nexus Mods**
   - Sa **clé API** (disponible sur [nexusmods.com/users/myaccount?tab=api](https://www.nexusmods.com/users/myaccount?tab=api))

2. Les identifiants sont sauvegardés dans le localStorage du navigateur

3. À chaque requête API, les credentials sont envoyés via des headers HTTP personnalisés :
   - `X-Nexus-Username`: le nom d'utilisateur
   - `X-Nexus-ApiKey`: la clé API

4. Les fonctions serverless (Vercel/Netlify) lisent ces headers et les utilisent pour authentifier les requêtes vers l'API Nexus Mods

## Architecture Technique

### Frontend (React)

- **`useNexusCredentials.js`** : Hook personnalisé pour gérer le localStorage
- **`CredentialsModal.jsx`** : Composant modal Bootstrap pour la saisie des credentials
- **`useNexusMods.js`** : Hook modifié pour inclure les credentials dans les headers des requêtes
- **`App.jsx`** : Intégration du système de credentials dans l'application

### Backend (Serverless Functions)

Toutes les fonctions API ont été mises à jour pour accepter les credentials de deux manières :

1. **Via les headers HTTP** (prioritaire) : `X-Nexus-Username` et `X-Nexus-ApiKey`
2. **Via les variables d'environnement** (fallback) : `NEXUS_USERNAME` et `NEXUS_API_KEY`

Fichiers modifiés :
- `api/nexus/tracked.mjs`
- `api/nexus/untrack.mjs`
- `netlify/functions/nexus-tracked.mjs`
- `netlify/functions/nexus-untrack.mjs`

## Déploiement

### Option 1 : Variables d'environnement (ancienne méthode)

Si vous préférez toujours utiliser des variables d'environnement :

```bash
NEXUS_APP_NAME=The Courrier
NEXUS_USERNAME=votre_username
NEXUS_API_KEY=votre_cle_api
```

### Option 2 : Configuration par l'utilisateur (nouvelle méthode)

Aucune configuration serveur n'est nécessaire ! Les utilisateurs configurent leurs propres credentials directement dans l'application.

**Avantages :**
- ✅ Chaque utilisateur utilise son propre compte Nexus Mods
- ✅ Pas de limite de rate-limit partagée
- ✅ Plus de sécurité : les credentials ne sont jamais sur le serveur
- ✅ Facilite le déploiement : pas besoin de configurer des variables d'environnement

## Sécurité

### Ce qui est sécurisé ✅

- Les credentials sont stockés uniquement dans le navigateur de l'utilisateur
- Les requêtes sont envoyées directement aux serveurs Nexus Mods via HTTPS
- Les fonctions serverless agissent comme un proxy sans stocker les données

### Limitations ⚠️

- **localStorage** : Accessible par JavaScript sur le même domaine (vulnérable aux attaques XSS si le site est compromis)
- **Pas de chiffrement supplémentaire** : Les credentials sont stockés en texte clair dans le localStorage

### Recommandations

Pour un environnement de production critique, considérez :
- Implémenter un système d'authentification côté serveur
- Chiffrer les credentials avant de les stocker dans le localStorage
- Utiliser des tokens temporaires au lieu de stocker la clé API directement

## Utilisation

1. Lancez l'application
2. Si c'est la première fois, la popup s'affiche automatiquement
3. Entrez votre nom d'utilisateur et votre clé API Nexus Mods
4. Cliquez sur "Enregistrer"
5. Profitez de l'application !

Pour modifier vos identifiants plus tard, cliquez sur le bouton "⚙️ Config" dans la barre de navigation.

## Compatibilité

- ✅ Fonctionne avec Vercel
- ✅ Fonctionne avec Netlify
- ✅ Compatible avec le développement local (via proxy)
- ✅ Rétrocompatible avec l'ancienne méthode (variables d'environnement)
