# Changelog - The Courrier

## Version 3.1.0 - Amélioration de la Documentation (7 Novembre 2025)

### Documentation

#### Refactorisation Complète
- Déduplication de tous les fichiers markdown
- Suppression de CHANGELOG_CREDENTIALS.md (contenu identique à CHANGELOG.md)
- Centralisation par domaine : chaque fichier .md a un rôle unique
- README.md allégé avec liens vers les docs spécialisées
- SUMMARY.md recréé comme vue d'ensemble + index
- PRE_DEPLOYMENT_CHECK.md transformé en checklist opérationnelle
- Retrait de toutes les références Netlify (focus Vercel uniquement)
- Suppression de tous les émojis des fichiers markdown

#### Credentials de Test
- Ajout d'un compte de test Nexus Mods public
  - Username: `TheCourrier0`
  - Password: `The Courrier0`
  - API Key: `UWM49C/gfBy+QCvaL2pe9p+C8PLiNji+HjObvGWuxsI9qKW3X1I=--LjVbDPG5bU/U59Ph--lzlQfxo4wC5kS6KTnG0IMw==`
- Documentation dans README.md, DEPLOYMENT.md et TESTING_GUIDE.md

#### Architecture Documentaire
```text
README.md               → Présentation + Architecture + Liens
├─> CHANGELOG.md        → Historique complet (source unique)
├─> CREDENTIALS_CONFIG.md → Configuration credentials (source unique)
├─> TESTING_GUIDE.md    → Tests complets (source unique)
├─> DEPLOYMENT.md       → Déploiement Vercel (source unique)
├─> PRE_DEPLOYMENT_CHECK.md → Checklist opérationnelle
└─> SUMMARY.md          → Vue d'ensemble utilisateur + Index
```

### Fichiers Modifiés
- README.md - Sections détaillées remplacées par des liens
- SUMMARY.md - Recréé avec vue d'ensemble utilisateur uniquement
- DEPLOYMENT.md - Focus Vercel, suppression Netlify, ajout credentials test
- TESTING_GUIDE.md - Ajout credentials test, liens vers autres docs
- PRE_DEPLOYMENT_CHECK.md - Transformé en checklist avec liens
- CREDENTIALS_CONFIG.md - Ajout liens vers TESTING_GUIDE et DEPLOYMENT
- Tous les .md - Suppression des émojis

### Fichiers Supprimés
- CHANGELOG_CREDENTIALS.md - Fusionné dans CHANGELOG.md

---

## Version 3.0.0 - Refonte des fonctionnalités (6 Novembre 2025)

###  Nouvelles Fonctionnalités

#### Affichage des Jeux
-  **Noms de jeux réels** : Affichage du vrai nom des jeux (ex: "Baldur's Gate 3" au lieu de "baldursgate3")
-  **Icônes de jeux** : Affichage des icônes officielles Nexus Mods à côté des noms de jeux
-  **Cache intelligent** : Cache de 24h pour les informations de jeux (optimisation API)

#### Architecture
-  **Renommage des composants** : `BootstrapPage` → `ActuUpdatePage` (plus explicite)
-  **Nettoyage du code** : Suppression de `TailwindPage` et du hook `useWeather` (non utilisés)
-  **Amélioration de l'affichage** : Correction du layout des cartes (flex-col, flex-grow)

###  Changements Techniques

#### Backend - Enrichissement des données de jeux

**Nouveau :** Fonction `getGameInfo()` dans les fichiers serverless

```javascript
// Récupération des infos de jeu depuis l'API Nexus
async function getGameInfo(domain, username, apiKey) {
  const gameInfo = await fetchJson(
    `https://api.nexusmods.com/v1/games/${domain}.json`,
    { headers: nexusHeaders(username, apiKey) }
  );
  return {
    id: gameInfo.id,
    name: gameInfo.name,
    domain: gameInfo.domain_name || domain,
  };
}

// Enrichissement des mods avec les infos de jeux
const enrichedWithGames = enriched.map(m => {
  const gameInfo = gamesMap.get(m.domain);
  return {
    ...m,
    gameId: m.gameId || gameInfo?.id,
    gameName: gameInfo?.name || m.gameName,
  };
});
```

#### Frontend - Correction du parsing des données

**Avant :**
```javascript
gameId: m.game_id ?? m.game?.id,  // Cherchait snake_case en premier
gameName: m.game_name ?? m.game?.name,
```

**Après :**
```javascript
gameId: m.gameId ?? m.game_id ?? m.game?.id,  // Cherche camelCase en premier
gameName: m.gameName ?? m.game_name ?? m.game?.name,
```

#### Affichage des icônes de jeux

```jsx
{gameData?.gameId && (
  <img 
    src={`https://staticdelivery.nexusmods.com/Images/games/4_3/tile_${gameData.gameId}.jpg`}
    alt={`${gameLabel} icon`}
    className="w-10 h-10 rounded object-cover border-2"
    onError={(e) => e.target.style.display = 'none'}
  />
)}
```

###  Fichiers Créés

```
src/pages/
  ActuUpdatePage.jsx           # Renommage de BootstrapPage
```

###  Fichiers Modifiés

```
src/
  App.jsx                      # Import ActuUpdatePage, suppression de TailwindPage
  components/
    useNexusMods.js            # Correction parsing gameId/gameName (camelCase first)
  pages/
    ActuUpdatePage.jsx         # Ajout affichage icônes, amélioration layout
    NexusModsPage.jsx          # Amélioration layout (flex-col, flex-grow)

server.mjs                     # Ajout fonction getGameInfo + enrichissement
api/nexus/tracked.mjs          # Ajout fonction getGameInfo + enrichissement
netlify/functions/nexus-tracked.mjs  # Ajout fonction getGameInfo + enrichissement
```

###  Fichiers Supprimés

```
src/pages/
  BootstrapPage.jsx            # Renommé en ActuUpdatePage
  TailwindPage.jsx             # Supprimé (fonctionnalité non utilisée)
src/components/
  useWeather.js                # Supprimé (fonctionnalité non utilisée)
```

###  Corrections de bugs

1. **Bug de reconnexion** : Les données étaient chargées avant les credentials depuis localStorage
   - **Solution** : Attendre le chargement des credentials avant d'afficher les routes
   
2. **Boutons disparus** : Les boutons "Ouvrir sur Nexus" et "Ne plus suivre" n'étaient plus visibles
   - **Solution** : Ajout de `flex flex-col` sur la carte et `flex-grow` sur le contenu

3. **Noms de jeux incorrects** : Affichage du domain au lieu du vrai nom
   - **Solution** : Enrichissement via l'API `/v1/games/{domain}.json`

###  Améliorations de Performance

- **Cache des jeux** : 24h (au lieu de recalculer à chaque requête)
- **Cache des mods** : 10 min (inchangé)
- **Requêtes parallèles** : Les infos de jeux sont récupérées en parallèle

###  Breaking Changes

Aucun ! Toutes les modifications sont rétrocompatibles.

###  Déploiement

Les modifications sont prêtes pour :
-  **Vercel** : Fonction serverless `api/nexus/tracked.mjs` mise à jour
-  **Netlify** : Fonction serverless `netlify/functions/nexus-tracked.mjs` mise à jour
-  **Local** : Serveur Express `server.mjs` mis à jour

###  Structure du Projet (Mise à jour)

```
src/
  pages/
    ActuUpdatePage.jsx         # Page des actualités de mods (ex-BootstrapPage)
    NexusModsPage.jsx          # Page des mods suivis
  components/
    CredentialsModal.jsx       # Modal de configuration
    useNexusCredentials.js     # Gestion des credentials
    useNexusMods.js            # Hook API Nexus Mods
    useTheme.js                # Gestion du thème clair/sombre
```

---

## Version 2.0.0 - Configuration des Identifiants Utilisateur (5 Novembre 2025)

###  Nouvelles Fonctionnalités

#### Interface Utilisateur
-  **Modal de configuration** : Popup Bootstrap pour saisir username et API key
-  **Affichage du statut** : Badge dans la navbar montrant l'utilisateur connecté
-  **Boutons de gestion** : Configuration et suppression des credentials depuis la navbar
-  **Messages d'erreur améliorés** : Alertes claires en cas de credentials manquants

#### Stockage et Sécurité
-  **localStorage** : Stockage local et sécurisé des credentials dans le navigateur
-  **Hook personnalisé** : `useNexusCredentials` pour gérer facilement les credentials
-  **Validation** : Vérification de la présence des credentials avant les requêtes

#### Backend
-  **Headers HTTP personnalisés** : `X-Nexus-Username` et `X-Nexus-ApiKey`
-  **Rétrocompatibilité** : Support des variables d'environnement (fallback)
-  **Toutes les fonctions API** : tracked, untrack mises à jour (Vercel + Netlify)

###  Fichiers Créés

```
src/
  components/
    CredentialsModal.jsx       # Modal de saisie des credentials
    useNexusCredentials.js     # Hook de gestion du localStorage

docs/
  CREDENTIALS_CONFIG.md        # Documentation complète
  EXAMPLES.js                  # Exemples d'utilisation
  CHANGELOG.md                 # Ce fichier (historique complet)
```

###  Fichiers Modifiés

```
src/
  App.jsx                      # Intégration du système de credentials
  components/
    useNexusMods.js            # Envoi des credentials dans les headers
  pages/
    BootstrapPage.jsx          # Passage des credentials + meilleure gestion d'erreurs
    NexusModsPage.jsx          # Passage des credentials + meilleure gestion d'erreurs

api/nexus/
  tracked.mjs                  # Support des headers X-Nexus-*
  untrack.mjs                  # Support des headers X-Nexus-*

netlify/functions/
  nexus-tracked.mjs            # Support des headers X-Nexus-*
  nexus-untrack.mjs            # Support des headers X-Nexus-*

README.md                      # Ajout d'une section sur les credentials
```

###  Changements Techniques

#### Frontend

**Avant :**
```javascript
// Les credentials étaient en dur dans les variables d'environnement serveur
const res = await fetch('/api/nexus/tracked');
```

**Après :**
```javascript
// Les credentials sont passés via des headers depuis le localStorage
const headers = {
  'X-Nexus-Username': credentials.username,
  'X-Nexus-ApiKey': credentials.apiKey
};
const res = await fetch('/api/nexus/tracked', { headers });
```

#### Backend

**Avant :**
```javascript
// Lecture depuis les variables d'environnement uniquement
const key = process.env.NEXUS_API_KEY;
const user = process.env.NEXUS_USERNAME;
```

**Après :**
```javascript
// Lecture depuis les headers HTTP (priorité) ou env variables (fallback)
const key = req.headers['x-nexus-apikey'] || process.env.NEXUS_API_KEY;
const user = req.headers['x-nexus-username'] || process.env.NEXUS_USERNAME;
```

###  Avantages

1. **Multi-utilisateurs** : Chaque utilisateur utilise son propre compte Nexus Mods
2. **Pas de rate-limit partagé** : Chaque utilisateur a ses propres limites
3. **Sécurité** : Les credentials ne sont jamais stockés sur le serveur
4. **Simplicité** : Pas besoin de configurer des variables d'environnement
5. **Flexibilité** : Changement de compte facile via l'interface

###  Breaking Changes

Aucun ! Le système est **rétrocompatible**. Si des variables d'environnement sont configurées, elles seront utilisées comme fallback.

###  Migration

#### Pour les utilisateurs finaux
Rien à faire ! L'application demandera automatiquement les credentials au premier lancement.

#### Pour les développeurs/déployeurs

**Option 1 : Laisser les utilisateurs configurer (recommandé)**
- Ne configurez aucune variable d'environnement
- Les utilisateurs saisiront leurs propres credentials

**Option 2 : Garder l'ancien système**
- Gardez vos variables d'environnement `NEXUS_API_KEY` et `NEXUS_USERNAME`
- L'application fonctionnera comme avant

**Option 3 : Hybride**
- Configurez des credentials par défaut en variables d'environnement
- Les utilisateurs pourront les remplacer par les leurs via l'interface

### � Documentation

- [CREDENTIALS_CONFIG.md](./CREDENTIALS_CONFIG.md) - Guide complet
- [EXAMPLES.js](./EXAMPLES.js) - Exemples de code
- [README.md](./README.md) - Guide de démarrage rapide

###  Bugs Connus

Aucun bug connu pour le moment.

###  Améliorations Futures

- [ ] Chiffrement des credentials dans le localStorage
- [ ] Support de multiples comptes utilisateur
- [ ] Import/export de configuration
- [ ] Validation en temps réel de la clé API
- [ ] Mode "se souvenir de moi" avec expiration
- [ ] Support d'autres plateformes (Steam, GOG, etc.)

---

**Date de release :** 5 Novembre 2025  
**Version :** 2.0.0  
**Auteur :** The Courrier Team

