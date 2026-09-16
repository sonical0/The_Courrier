# Guide de Déploiement

Ce guide vous explique comment déployer **The Courrier** sur **Vercel**.

---

## Prérequis

Avant de déployer, assurez-vous d'avoir :

- Un compte GitHub avec votre projet poussé sur la branche `main`
- Le projet buildé avec succès en local (`npm run build`)
- Les dépendances installées (`npm install`)

> **Note** : La clé API Nexus Mods n'est **plus requise côté serveur**. Les utilisateurs configurent leurs propres identifiants directement dans l'application via le modal au premier lancement.

---

## Déploiement sur Vercel

### 1. Créer un compte et importer le projet

1. Allez sur [vercel.com](https://vercel.com) et créez un compte (ou connectez-vous)
2. Cliquez sur **"Add New..."** → **"Project"**
3. Importez votre repo GitHub **The_Courrier**

### 2. Configuration du build

Vercel devrait détecter automatiquement qu'il s'agit d'une app React :

- **Framework Preset** : Create React App
- **Build Command** : `npm run build`
- **Output Directory** : `build`

### 3. Configurer les variables d'environnement (Optionnel)

Dans la page d'import, avant de déployer :

1. Dépliez la section **"Environment Variables"**
2. **Cette étape est maintenant optionnelle** ! Deux options s'offrent à vous :

#### Option A : Configuration par l'utilisateur (Recommandé)

Ne configurez **aucune variable d'environnement**. Les utilisateurs entreront leur propre nom d'utilisateur et clé API au premier lancement de l'application via un modal.

**Avantages** :
- Chaque utilisateur utilise son propre compte Nexus Mods
- Pas de limite de rate-limit partagée
- Meilleure sécurité : credentials stockés localement dans le navigateur

#### Option B : Configuration serveur (Ancienne méthode)

Si vous voulez que tous les utilisateurs utilisent le même compte Nexus Mods, ajoutez :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `NEXUS_API_KEY` | Votre clé API Nexus Mods | Clé obtenue sur nexusmods.com |
| `NEXUS_USERNAME` | Votre nom d'utilisateur | Votre username Nexus Mods |

> **Note** : Si ces variables ne sont pas définies, l'application demandera automatiquement les credentials à l'utilisateur.

**Credentials de test disponibles** (pour tester l'application) :

- **Username** : `TheCourrier0`
- **Password** : `The Courrier0` (pour se connecter sur nexusmods.com)
- **API Key** : `UWM49C/gfBy+QCvaL2pe9p+C8PLiNji+HjObvGWuxsI9qKW3X1I=--LjVbDPG5bU/U59Ph--lzlQfxo4wC5kS6KTnG0IMw==`

> Ces credentials sont publics et destinés aux tests uniquement. Ne les utilisez pas en production.

### 4. Déployer

Cliquez sur **"Deploy"** et attendez que le build se termine (2-3 minutes).

### 5. Tester

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

## Structure des Fonctions Serverless

Les fonctions sont dans `/api/nexus/` et sont automatiquement accessibles :

- `validate.mjs` → Endpoint : `POST /api/nexus/validate`
- `tracked.mjs` → Endpoint : `GET /api/nexus/tracked`
- `untrack.mjs` → Endpoint : `DELETE /api/nexus/untrack?domain=:domain&modId=:modId`

> **Important** : Les rewrites pour Vercel sont configurés dans `vercel.json` pour gérer les paramètres d'URL.

---

## Test en Local avec les Fonctions Serverless

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

## Sécurité

- **Stockage local** : Les identifiants sont stockés uniquement dans le localStorage du navigateur de chaque utilisateur
- **Pas de serveur** : Aucune clé API n'est stockée sur Vercel
- **Proxy sécurisé** : Les fonctions serverless relaient les requêtes sans stocker les credentials
- **Headers de sécurité** : X-Frame-Options, X-Content-Type-Options, Referrer-Policy configurés
- **Isolation utilisateur** : Chaque utilisateur utilise son propre compte Nexus Mods

> **Important** : Ne jamais commiter de fichier `.env` contenant des clés API dans votre dépôt Git.

> **Configuration détaillée** : voir [CREDENTIALS_CONFIG.md](./CREDENTIALS_CONFIG.md)

---

## Rate limiting et maîtrise des invocations

### Ce qui est dans le code

Le module `api/utils/rateLimit.mjs` plafonne le débit par IP, appliqué par
`server.mjs` et par chaque fonction de `api/`. Réponse au dépassement : `429`
avec `Retry-After`, plus les en-têtes `X-RateLimit-Limit` / `X-RateLimit-Remaining`.

| Variable | Défaut | Portée |
|---|---|---|
| `RATE_LIMIT_NEXUS` | 30 / minute / IP | `/api/nexus/*` |
| `RATE_LIMIT_STEAM` | 60 / minute / IP | `/api/steam/*` |

Un client sain reste très en dessous : le cache navigateur des mods suivis dure
10 minutes et celui des versions Steam 2 heures.

> **Limite à connaître.** Le compteur vit dans la mémoire du processus. Sur
> `server.mjs` (long-running) la protection est complète. **Sur Vercel, chaque
> instance a son propre compteur et un cold start repart de zéro** : la limite
> effective est « 30 × nombre d'instances tièdes ». Cela borne une boucle client
> emballée, ce qui est l'objectif, mais ce n'est pas un quota exact — et surtout,
> la fonction est déjà invoquée (donc facturée) avant que le limiteur ne réponde.

### Ce qu'il faut activer côté Vercel

Le rate limiting du **Vercel Firewall** agit *avant* l'invocation : c'est le seul
qui évite réellement le coût, et le seul exact entre instances.

1. Vercel Dashboard → le projet → **Firewall**
2. **Configure** → **Rate Limiting** → *Add Rule*
3. Condition : `Request Path` *starts with* `/api/`
4. Action : **Rate Limit**, par exemple 60 requêtes / 60 s, clé **IP Address**
5. Effet au dépassement : `Deny` (ou `Challenge` si tu préfères laisser une porte
   de sortie aux utilisateurs légitimes)

> Vérifie la disponibilité sur ton plan : selon l'offre, les règles de rate
> limiting du Firewall peuvent être limitées ou payantes.

### Cache HTTP : le levier le plus efficace

`/api/steam/game/[appId]` ne dépend que de l'`appId` et renvoie
`public, s-maxage=7200, stale-while-revalidate=86400` : les appels répétés sont
servis par le CDN Edge **sans aucune invocation**. C'est ce qui fait le plus
baisser le compteur, bien avant le limiteur.

Les routes `/api/nexus/*` dépendent des credentials envoyés en en-têtes et
déclarent donc `private, no-store` : elles ne doivent jamais passer par un cache
partagé, au risque de servir la liste de mods d'un utilisateur à un autre.

### Si le compteur d'invocations s'envole quand même

Chercher d'abord une boucle côté client, pas un abus externe. Deux causes déjà
rencontrées dans ce projet :

- un objet recréé à chaque render passé en dépendance d'un `useCallback`, dont
  dépend un `useEffect` — chaque render relance la requête (corrigé dans
  `useNexusCredentials`, commit `fba6e92`) ;
- un cache écrit mais jamais relu avant de décider s'il faut appeler (corrigé
  dans `useSteamGames`, commit `1b20417`).

Le symptôme est visible dans les logs Vercel : la même route appelée des
centaines de fois en quelques minutes depuis une seule session.

---

## Dépannage

### Erreur "Missing NEXUS_API_KEY"

Cette erreur apparaît si l'utilisateur n'a pas encore entré ses credentials dans le modal.

**Solution** : Laissez l'utilisateur configurer ses credentials via le modal au premier lancement.

### Le modal ne s'affiche pas

Vérifiez si des credentials sont déjà stockés dans le localStorage :

1. Ouvrez la console du navigateur (F12)
2. Allez dans l'onglet "Application" > "Local Storage"
3. Cherchez la clé `nexus_credentials`
4. Supprimez-la pour réinitialiser et afficher le modal

### Les fonctions ne répondent pas

Vérifiez les logs de vos fonctions serverless dans le Dashboard Vercel → Deployment → Runtime Logs

### Build échoue

Assurez-vous que toutes les dépendances sont présentes dans `package.json`. Installez-les localement pour vérifier :

```bash
npm install
npm run build
```

### Erreur CORS

Les fonctions serverless incluent déjà les headers CORS. Si vous rencontrez des problèmes, vérifiez que vous appelez bien les endpoints via `/api/nexus/*` et non directement les fonctions.

### Credentials non sauvegardés

Si le localStorage ne fonctionne pas :

- Vérifiez que les cookies ne sont pas bloqués dans votre navigateur
- Essayez en navigation privée pour tester
- Vérifiez les paramètres de confidentialité du navigateur

---

## Déploiements Automatiques

Vercel déploie automatiquement à chaque push sur la branche configurée (par défaut `main`).

**Pour désactiver les déploiements auto** : Project settings → Git → Disable auto deploy

**Pour changer de branche de production** : Project settings → Git → Production Branch

---

## Support

- [Documentation Vercel Functions](https://vercel.com/docs/functions)
- [API Nexus Mods](https://app.swaggerhub.com/apis-docs/NexusMods/nexus-mods_public_api_params_in_form_data/1.0)
- [Configuration des credentials](./CREDENTIALS_CONFIG.md)

---

## Conclusion

Bon déploiement !

