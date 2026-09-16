# Changelog - The Courrier

## Version 4.0.0 - Optimisations techniques : chiffrement + cache + compression (10 Juin 2026)

### Nouvelles Fonctionnalites

#### Chiffrement AES-GCM des credentials en localStorage
- Module `src/utils/cryptoStorage.js` : encryptValue / decryptValue via Web Crypto API (zero dependance)
- Cle derivee par PBKDF2 (100 000 iterations, SHA-256), IV aleatoire par chiffrement (AES-GCM 256)
- Format stocke : `<base64iv>.<base64cipher>` dans la cle `nexus_accounts`
- Migration transparente depuis JSON brut (ancien format) : lu directement, rechiffre au prochain enregistrement
- Migration automatique depuis l'ancien format `nexus_credentials` : inchangee

#### Cache 10 minutes par utilisateur pour les mods suivis
- `useNexusMods` : verifie le cache localStorage avant chaque appel a `/api/nexus/tracked`
- TTL de 10 minutes, cle specifique par username (`courrier_mods_cache_<username>`)
- Cache bypasse sur `refresh()` et `untrackMod()` (invalidation + re-fetch force)
- Zero appel reseau au reload si le cache est valide

#### Compression LZ-String des donnees localStorage
- Module `src/utils/compressedStorage.js` : setCompressed / getCompressed via lz-string
- Applique a `courrier_seen_mods` (useLastVisit) et `courrier_mods_cache_<username>` (useNexusMods)
- Migration automatique : getCompressed lit les valeurs JSON brutes existantes via fallback

### Tests
- `src/utils/cryptoStorage.test.js` : 5 tests (round-trip, IV aleatoire, chaine vide, entree malformee, ciphertext corrompu)
- `src/utils/compressedStorage.test.js` : 6 tests (round-trip array/objet, cle absente, migration JSON brut, compression reelle, tableau vide)
- `src/components/useNexusMods.test.js` : +6 tests cache (hit/expiration/absent/bypass refresh/invalidation untrack/isolation user)
- `src/components/useNexusCredentials.test.js` : mock cryptoStorage ajoute (tests inchanges, 15 tests)
- `src/components/useLastVisit.test.js` : mock compressedStorage ajoute (tests inchanges, 9 tests)
- Total : 100 tests (ancien : 83)

### Dependances
- `lz-string` ^1.5.0 ajoutee aux dependances

### Fichiers Crees
- `src/utils/cryptoStorage.js`
- `src/utils/cryptoStorage.test.js`
- `src/utils/compressedStorage.js`
- `src/utils/compressedStorage.test.js`

### Fichiers Modifies
- `src/components/useNexusCredentials.js` - Chiffrement AES-GCM du stockage credentials
- `src/components/useNexusCredentials.test.js` - Mock cryptoStorage
- `src/components/useNexusMods.js` - Cache 10min avec compressedStorage
- `src/components/useNexusMods.test.js` - 6 nouveaux tests cache + mock compressedStorage
- `src/components/useLastVisit.js` - Compression seen_mods via compressedStorage
- `src/components/useLastVisit.test.js` - Mock compressedStorage
- `src/setupTests.js` - Polyfills TextEncoder/TextDecoder et crypto.subtle pour Jest/jsdom
- `package.json` - Version 4.0.0, dependance lz-string

---

## Version 3.9.0 - Support de multiples comptes Nexus Mods (10 Juin 2026)

### Nouvelles Fonctionnalites

#### Gestion de plusieurs comptes Nexus Mods
- Stockage de plusieurs comptes dans localStorage (format nexus_accounts)
- Migration automatique depuis l'ancien format nexus_credentials au premier demarrage
- Liste des comptes enregistres dans la modal de configuration avec bouton de basculement
- Suppression d'un compte individuel (bouton visible si au moins 2 comptes existent)
- Basculement instantane vers un autre compte depuis la liste

#### Nouveau hook useNexusCredentials (refactorise)
- Nouveaux exports : accounts, activeAccountId, switchAccount(id), removeAccount(id)
- saveCredentials : ajoute un nouveau compte ou met a jour la cle si meme username
- clearCredentials : supprime le compte actif et bascule sur le premier compte restant
- credentials, hasCredentials, loading inchanges (retro-compatibilite totale)

### Tests
- useNexusCredentials.test.js : 15 tests (ancien : 8)
- Couverture ajoutee : migration legacy, ajout second compte, mise a jour cle existante, switchAccount, removeAccount

### Fichiers Modifies
- src/components/useNexusCredentials.js - Refactoring complet multi-comptes
- src/components/useNexusCredentials.test.js - Tests mis a jour et etendus
- src/components/CredentialsModal.jsx - Liste des comptes avec basculement/suppression
- src/App.jsx - Passage des nouvelles props a CredentialsModal

---

## Version 3.8.1 - Notifications navigateur (10 Juin 2026)

### Nouvelles Fonctionnalites

#### Notifications navigateur pour les nouveaux mods
- Notification automatique au chargement si des nouveaux mods sont detectes
- Bouton "Notifs ON/OFF" dans la navbar desktop et le menu mobile
- Premier clic declenche la demande de permission navigateur
- Le bouton est desactive si le navigateur a bloque les notifications
- Preference persistee dans localStorage (cle courrier_notifications_enabled)

#### Nouveau hook useNotifications
- requestPermission() : demande la permission navigateur (court-circuite si deja granted)
- disableNotifications() : desactive sans revoquer la permission
- notify(title, body) : envoie une notification si activee et permission granted
- notifyNewMods(count) : message au singulier ou pluriel selon le nombre

### Tests
- Ajout de src/components/useNotifications.test.js (13 tests)
- Couverture : initialisation, requestPermission granted/denied/deja-granted, disableNotifications, notify, notifyNewMods singulier/pluriel/zero

### Fichiers Modifies
- src/components/useNotifications.js - Nouveau hook
- src/components/useNotifications.test.js - Nouveau fichier de tests
- src/App.jsx - Integration du hook, bouton navbar, notification automatique

---

## Version 3.8.0 - Export et import de configuration (10 Juin 2026)

### Nouvelles Fonctionnalites

#### Export de configuration
- Bouton "Exporter" dans la navbar (desktop et mobile)
- Telecharge un fichier the-courrier-config-YYYY-MM-DD.json
- Contenu : tags de mods, mods vus (seenMods), derniere visite, theme
- Les credentials Nexus ne sont jamais exportes (securite)

#### Import de configuration
- Bouton "Importer" dans la navbar (desktop et mobile)
- Selecteur de fichier JSON, validation de la structure avant restauration
- Seules les cles reconnues sont restaurees (les cles inconnues sont ignorees)
- Bandeau de confirmation avec compte des elements restaures, puis rechargement automatique
- Bandeau d'erreur si le fichier est invalide ou corrompu (disparait apres 4 secondes)

### Tests
- Ajout de src/components/useConfigBackup.test.js (9 tests)
- Couverture : structure de l'export, absence des credentials, import restauration, erreurs de format/structure

### Fichiers Modifies
- src/components/useConfigBackup.js - Nouveau module (exportConfig, importConfig)
- src/components/useConfigBackup.test.js - Nouveau fichier de tests
- src/App.jsx - Boutons export/import, gestionnaire d'import, bandeau de statut

---

## Version 3.7.1 - Tests unitaires useNexusCredentials et useNexusMods (10 Juin 2026)

### Tests

#### useNexusCredentials (8 tests)
- Chargement depuis localStorage au montage
- Ignorance d'un objet incomplet (username ou apiKey absent)
- Ignorance d'un JSON invalide sans plantage
- saveCredentials : persistance dans l'etat et localStorage, valeur de retour
- clearCredentials : suppression de l'etat et localStorage, valeur de retour

#### useNexusMods (11 tests)
- Etat de chargement puis resolution avec mods normalises
- Envoi des headers X-Nexus-Username / X-Nexus-ApiKey si credentials fournis
- Absence des headers si credentials null
- Erreur HTTP : set error, games vide
- Erreur reseau : set error avec le message d'exception
- Normalisation : mod_id -> id, domain_name -> domain, champs name/version/author
- modsForGame : filtre par domaine, retourne vide si domaine inconnu
- modsForGame : tri decroissant par updatedAt
- refresh() : second appel fetch, mise a jour de l'etat
- untrackMod() : appel DELETE + refresh, retour success:true
- untrackMod() : retour success:false + message en cas d'erreur

### Fichiers Modifies
- src/components/useNexusCredentials.test.js - Nouveau fichier de tests
- src/components/useNexusMods.test.js - Nouveau fichier de tests

---

## Version 3.7.0 - Systeme de tags/statuts sur les mods (10 Juin 2026)

### Nouvelles Fonctionnalites

#### Tags de statut sur chaque mod suivi
- Quatre statuts disponibles : Installe, A installer, En pause, Archive
- Boutons de statut sur chaque carte de mod dans la liste des mods
- Cliquer sur le statut actif le retire (toggle)
- Bordure coloree sur la carte selon le statut actif (vert/bleu/jaune/rouge)
- Les statuts sont persistes dans localStorage (cle courrier_mod_tags)

#### Filtre par statut
- Selecteur "Statut" dans la barre de filtres de NexusModsPage
- Options : Tous les statuts, Installe, A installer, En pause, Archive, Sans statut
- Cumulable avec le filtre jeu, le filtre categorie et la recherche textuelle

#### Nouveau hook useModTags
- Exports : getTag(domain, id), setTag(domain, id, tag), clearTag(domain, id), toggleTag(domain, id, tag)
- Persistance automatique dans localStorage a chaque modification
- Constantes exportees : TAG_LABELS (labels d'affichage), TAG_COLORS (classes Tailwind par statut)

### Tests
- Ajout de src/components/useModTags.test.js (9 tests)
- Couverture : getTag lecture/persistance, setTag ecrasement, clearTag suppression, toggleTag on/off/switch

### Fichiers Modifies
- src/components/useModTags.js - Nouveau hook
- src/components/useModTags.test.js - Nouveau fichier de tests
- src/pages/NexusModsPage.jsx - Boutons de statut, bordure coloree, filtre statut

---

## Version 3.6.1 - Filtre par categorie (10 Juin 2026)

### Nouvelles Fonctionnalites

#### Filtre par categorie dans la liste des mods et les actualites
- Ajout d'un selecteur "Categorie" dans NexusModsPage et ActuUpdatePage
- Le menu est conditionnel : il n'apparait que si au moins un mod possede une categorie
- Les categories disponibles sont derivees des mods du jeu selectionne, independamment du filtre categorie actif (evite la disparition des options lors du filtrage)
- Dans ActuUpdatePage, changer de jeu reinitialise automatiquement le filtre categorie
- Le filtre categorie se combine avec le filtre jeu et la recherche textuelle

### Tests
- Ajout de src/pages/NexusModsPage.test.jsx (7 tests)
- Couverture : affichage initial, presence du menu, filtre par categorie specifique, retour a "Toutes les categories", absence du menu si aucune categorie, cumul filtre + recherche

### Fichiers Modifies
- src/pages/NexusModsPage.jsx - Selecteur de categorie dans la barre de filtres
- src/pages/ActuUpdatePage.jsx - Selecteur de categorie + reinitialisation au changement de jeu
- src/pages/NexusModsPage.test.jsx - Nouveau fichier de tests

---

## Version 3.6.0 - Badge NEW dismissable par mod (10 Juin 2026)

### Nouvelles Fonctionnalites

#### Marquage individuel et en lot des mods comme lus
- Ajout d'un bouton "Lu" a cote de chaque badge NEW dans NexusModsPage et ActuUpdatePage
- Ajout d'un bouton "Tout marquer comme lu (N)" dans les entetes des deux pages, visible uniquement quand au moins un nouveau mod est present
- Les mods marques comme lus perdent leur badge NEW immediatement sans attendre la prochaine visite
- Les mods vus sont persistes dans localStorage (cle courrier_seen_mods) et survivent aux rechargements de page

#### Extension du hook useLastVisit
- Nouveaux exports : seenMods (Set), markAsSeen(domain, modId), markAllAsSeen(mods)
- isNew(modUpdatedAt, domain, modId) : accepte desormais domain et modId pour exclure les mods vus
- countNew(mods) : exclut les mods presents dans seenMods

### Tests
- Ajout de src/components/useLastVisit.test.js (9 tests)
- Couverture : isNew avec seenMods, markAsSeen persistance, markAllAsSeen bulk, countNew avec exclusion

### Fichiers Modifies
- src/components/useLastVisit.js - Extension avec seenMods, markAsSeen, markAllAsSeen
- src/components/useLastVisit.test.js - Nouveau fichier de tests
- src/pages/NexusModsPage.jsx - Bouton "Lu" par carte + bouton "Tout marquer comme lu"
- src/pages/ActuUpdatePage.jsx - Bouton "Lu" par carte + bouton "Tout marquer comme lu"

---

## Version 3.5.1 - Validation des credentials en temps reel (10 Juin 2026)

### Nouvelles Fonctionnalites

#### Bouton de test de connexion dans la modal credentials
- Ajout d'un bouton "Tester la connexion" dans CredentialsModal.jsx
- Appel a l'endpoint /api/nexus/validate avant l'enregistrement des credentials
- Affichage du resultat inline (succes avec nom d'utilisateur ou message d'erreur)
- Le bouton est desactive tant que les deux champs sont vides ou pendant le test
- Le resultat est reinitialise automatiquement a chaque modification des champs

### Tests
- Ajout de src/components/CredentialsModal.test.jsx (10 tests)
- Couverture : etat desactive, reponse 200, reponse non-200, erreur reseau, reinitialisation, soumission

### Fichiers Modifies
- src/components/CredentialsModal.jsx - Ajout bouton de test et gestion de l'etat associe
- src/components/CredentialsModal.test.jsx - Nouveau fichier de tests

---

## Version 3.5.0 - Securite et nouvelles fonctionnalites (10 Juin 2026)

### Corrections Critiques

#### Isolation de session par utilisateur (securite)
- Correction du bug de fuite de session entre utilisateurs concurrents sur Vercel
- Les cles de cache dans api/nexus/tracked.mjs incluent desormais le nom d'utilisateur
- Avant : cle fixe "tracked" partagee entre tous les utilisateurs sur la meme instance
- Apres : cle "tracked:{username}" et "mod:{username}:{domain}:{id}"
- Impact : deux utilisateurs connectes simultanement voient exclusivement leurs propres mods

#### Deduplication du code utilitaire
- Creation de api/utils/NexusUtils.mjs : module partage entre server.mjs et api/nexus/tracked.mjs
- Symboles extraits : toEpoch, getCategoryName, withPool, sortVersionsSemantic
- Elimination de 7 blocs de code dupliques entre les contextes dev et production

### Nouvelles Fonctionnalites

#### Recherche par nom et auteur
- Ajout d'une barre de recherche textuelle dans NexusModsPage.jsx et ActuUpdatePage.jsx
- Filtrage insensible a la casse sur mod.name et mod.author
- Affichage du nombre de resultats sous la barre de recherche
- Cumul avec les filtres jeu, tri et periode existants

#### Suppression en lot des mods suivis
- Ajout de cases a cocher sur chaque carte de mod dans NexusModsPage.jsx
- Barre d'action sticky en bas de page lors d'une selection active
- Fonctions : compteur, tout selectionner / tout deselectionner, confirmation unique, suppression sequentielle
- Utilise le hook untrackMod() existant

#### Export JSON
- Bouton "Exporter JSON" dans NexusModsPage.jsx
- Telechargement du fichier the-courrier-mods-YYYY-MM-DD.json
- Champs exportes : name, author, version, category, url, game, updatedAt (ISO 8601)

### Fichiers Modifies
- api/nexus/tracked.mjs - Correction cles de cache + import NexusUtils
- api/utils/NexusUtils.mjs - Nouveau fichier (code partage)
- server.mjs - Import NexusUtils, suppression code duplique
- src/pages/NexusModsPage.jsx - Recherche, selection en lot, export JSON
- src/pages/ActuUpdatePage.jsx - Recherche

---

## Version 3.4.1 - Optimisations Performance (02 Février 2026)

### Améliorations

#### Synchronisation Steam API
- Harmonisation complète de la logique Steam entre server.mjs et api/steam/game/[appId].mjs
- Ajout du cache (TTL 2h) à la fonction serverless Steam
- Élimination de la duplication de logique (170 lignes optimisées)
- Fichiers modifiés : server.mjs, api/steam/game/[appId].mjs

#### Optimisation Logs
- Ajout variable DEBUG pour contrôler les logs en production
- 14 occurrences de console.log conditionnelles
- Logs désactivés en production, actifs en développement uniquement
- Variable : NODE_ENV === 'development'

### Impact Technique
- Réduction de la duplication de code : -170 lignes
- Cache Steam en prod : réduction des appels API
- Performance Vercel améliorée (moins de logs)
- Maintenance simplifiée : une seule logique Steam à maintenir

## Version 3.4.0 - Centralisation Catégories (02 Février 2026)

### Améliorations

#### Refactoring Catégories
- Centralisation des catégories Nexus Mods dans un fichier JSON unique
- Élimination de la duplication de code entre server.mjs et api/nexus/tracked.mjs
- Création du fichier src/data/nexus-categories.json comme source de vérité
- Fichiers modifiés : server.mjs, api/nexus/tracked.mjs, ADDING_GAME_CATEGORIES.md

### Impact Technique
- Maintenance simplifiée : une seule modification pour mettre à jour les catégories
- Réduction du risque d'incohérence entre dev et prod
- Pas d'impact sur les performances (lecture fichier au démarrage)
- ADDING_GAME_CATEGORIES.md reste valide : ajouter les catégories dans le JSON au lieu du code

## Version 3.3.1 - Automatisation Documentation (21 Janvier 2026)

### Documentation

#### Règles d'Automatisation
- Ajout de règles automatiques pour la mise à jour du CHANGELOG.md
- Matrice de décision pour les mises à jour conditionnelles
- Workflow automatique pour les agents IA
- 5 règles d'automatisation définies dans DOCUMENTATION_GUIDE.md
- Guide rapide créé : QUICK_UPDATE_GUIDE.md

#### Règles de Style Professionnel
- Suppression des emojis dans la documentation technique
- Exception pour guides utilisateurs (lisibilité)
- Documentation technique strictement professionnelle
- Standards de style définis dans DOCUMENTATION_GUIDE.md

#### Améliorations
- Section "Documentation Updates" ajoutée à copilot-instructions.md
- Matrice de mise à jour conditionnelle (type de changement → fichiers à modifier)
- Checklist automatique pour éviter les oublis
- Guide de numérotation sémantique des versions (Major.Minor.Patch)
- Workflow en arbre de décision pour les agents IA

### Fichiers Modifiés
- .github/copilot-instructions.md - Ajout sections "Documentation Updates" et "Style Guidelines"
- .github/DOCUMENTATION_GUIDE.md - Ajout "Automatic Update Workflow", "Automation Rules", "Style Guidelines"
- .github/QUICK_UPDATE_GUIDE.md - Nouveau fichier (sans emojis)
- CHANGELOG.md - Mise à jour historique (ce fichier)
- README.md - Lien vers QUICK_UPDATE_GUIDE.md
- PRE_DEPLOYMENT_CHECK.md - Mise à jour version 3.3.1

### Impact Technique
- Les agents IA peuvent maintenant mettre à jour automatiquement la documentation
- Chaque type de changement déclenche la mise à jour des fichiers appropriés
- Réduction du risque d'oubli de mise à jour du CHANGELOG
- Workflow standardisé : CHANGELOG d'abord, puis fichiers conditionnels
- Documentation professionnelle sans emojis superflus

---

## Version 3.3.0 - Synchronisation Dev/Production (21 Janvier 2026)

### Corrections Critiques

#### Synchronisation Serverless
- Correction de `api/nexus/validate.mjs` pour accepter les credentials via headers
- Mise à jour de `api/nexus/tracked.mjs` avec tri sémantique des versions (1.13 > 1.12 > 1.9)
- Uniformisation des headers CORS entre toutes les fonctions serverless
- Correction du typo dans la gestion d'erreurs de tracked.mjs

#### Documentation
- Ajout de [.github/copilot-instructions.md](../.github/copilot-instructions.md) pour guider les agents IA
- Mise à jour des patterns de synchronisation dev/prod
- Déduplication des fichiers .md

### Fichiers Modifiés
- api/nexus/validate.mjs - Support credentials headers + CORS
- api/nexus/tracked.mjs - Tri sémantique versions + correction erreur
- .github/copilot-instructions.md - Guide complet pour agents IA
- CHANGELOG.md - Mise à jour historique (ce fichier)
- SUMMARY.md - Suppression duplications
- PRE_DEPLOYMENT_CHECK.md - Mise à jour checklist

### Impact Technique
- Les fonctions serverless Vercel comportent maintenant exactement comme le serveur dev Express
- Pas de régression : tous les appels API continuent de fonctionner
- Amélioration de la maintenabilité : 7 blocs de code à maintenir synchronisés documentés

---

## Version 3.2.0 - Affichage des Catégories de Mods (30 Décembre 2025)

### Nouvelles Fonctionnalités

#### Système de Catégories
- Affichage des catégories de mods pour tous les mods suivis
- Mapping complet des catégories pour 5 jeux majeurs :
  - Skyrim Special Edition (49 catégories)
  - Skyrim classique (47 catégories)
  - Baldur's Gate 3 (21 catégories)
  - Cyberpunk 2077 (17 catégories)
  - Fallout 4 (46 catégories)
- Badge visuel avec icône pour les catégories
- Catégories affichées sur :
  - Page des mods (NexusModsPage) avec badge violet
  - Page des actualités (ActuUpdatePage) inline avec l'auteur

#### Outils d'Extraction
- Guide complet pour ajouter de nouveaux jeux (ADDING_GAME_CATEGORIES.md)
- Interface graphique d'extraction (extract-categories.html)
- Script JavaScript pour extraction via console navigateur

### Améliorations Techniques

#### Backend (server.mjs)
- Ajout de la fonction `getCategoryName(domain, categoryId)`
- Enrichissement automatique des mods avec leurs catégories
- Mapping statique extensible dans `CATEGORIES_BY_GAME`
- Fallback gracieux si catégorie non trouvée

#### Frontend
- Badge catégorie avec icône livre (📚) sur NexusModsPage
- Affichage inline discret sur ActuUpdatePage
- Style cohérent avec le design existant (Tailwind)

### Fichiers Ajoutés
- ADDING_GAME_CATEGORIES.md - Guide d'ajout de catégories
- extract-categories.html - Outil d'extraction graphique

### Fichiers Modifiés
- server.mjs - Ajout système de catégories et mapping
- src/pages/NexusModsPage.jsx - Affichage badge catégorie
- src/pages/ActuUpdatePage.jsx - Affichage inline catégorie
- src/components/useNexusMods.js - Propagation field catégorie

### Notes Techniques
- Tentative de scraping dynamique abandonnée (protection Cloudflare)
- Solution finale : mapping statique + outils d'extraction manuelle
- Performance : pas d'impact (données en cache côté serveur)
- Extensibilité : ajout facile de nouveaux jeux via guide

---

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

### Nouvelles Fonctionnalités

#### Affichage des Jeux
- **Noms de jeux réels** : Affichage du vrai nom des jeux (ex: "Baldur's Gate 3" au lieu de "baldursgate3")
- **Icônes de jeux** : Affichage des icônes officielles Nexus Mods à côté des noms de jeux
- **Cache intelligent** : Cache de 24h pour les informations de jeux (optimisation API)

#### Architecture
- **Renommage des composants** : `BootstrapPage` → `ActuUpdatePage` (plus explicite)
- **Nettoyage du code** : Suppression de `TailwindPage` et du hook `useWeather` (non utilisés)
- **Amélioration de l'affichage** : Correction du layout des cartes (flex-col, flex-grow)

### Changements Techniques

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

### Fichiers Créés

```
src/pages/
  ActuUpdatePage.jsx           # Renommage de BootstrapPage
```

### Fichiers Modifiés

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

### Fichiers Supprimés

```
src/pages/
  BootstrapPage.jsx            # Renommé en ActuUpdatePage
  TailwindPage.jsx             # Supprimé (fonctionnalité non utilisée)
src/components/
  useWeather.js                # Supprimé (fonctionnalité non utilisée)
```

### Corrections de bugs

1. **Bug de reconnexion** : Les données étaient chargées avant les credentials depuis localStorage
   - **Solution** : Attendre le chargement des credentials avant d'afficher les routes
   
2. **Boutons disparus** : Les boutons "Ouvrir sur Nexus" et "Ne plus suivre" n'étaient plus visibles
   - **Solution** : Ajout de `flex flex-col` sur la carte et `flex-grow` sur le contenu

3. **Noms de jeux incorrects** : Affichage du domain au lieu du vrai nom
   - **Solution** : Enrichissement via l'API `/v1/games/{domain}.json`

### Améliorations de Performance

- **Cache des jeux** : 24h (au lieu de recalculer à chaque requête)
- **Cache des mods** : 10 min (inchangé)
- **Requêtes parallèles** : Les infos de jeux sont récupérées en parallèle

### Breaking Changes

Aucun ! Toutes les modifications sont rétrocompatibles.

### Déploiement

Les modifications sont prêtes pour :
- **Vercel** : Fonction serverless `api/nexus/tracked.mjs` mise à jour
- **Netlify** : Fonction serverless `netlify/functions/nexus-tracked.mjs` mise à jour
- **Local** : Serveur Express `server.mjs` mis à jour

### Structure du Projet (Mise à jour)

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

### Nouvelles Fonctionnalités

#### Interface Utilisateur
- **Modal de configuration** : Popup Bootstrap pour saisir username et API key
- **Affichage du statut** : Badge dans la navbar montrant l'utilisateur connecté
- **Boutons de gestion** : Configuration et suppression des credentials depuis la navbar
- **Messages d'erreur améliorés** : Alertes claires en cas de credentials manquants

#### Stockage et Sécurité
- **localStorage** : Stockage local et sécurisé des credentials dans le navigateur
- **Hook personnalisé** : `useNexusCredentials` pour gérer facilement les credentials
- **Validation** : Vérification de la présence des credentials avant les requêtes

#### Backend
- **Headers HTTP personnalisés** : `X-Nexus-Username` et `X-Nexus-ApiKey`
- **Rétrocompatibilité** : Support des variables d'environnement (fallback)
- **Toutes les fonctions API** : tracked, untrack mises à jour (Vercel + Netlify)

### Fichiers Créés

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

### Fichiers Modifiés

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

### Changements Techniques

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

### Avantages

1. **Multi-utilisateurs** : Chaque utilisateur utilise son propre compte Nexus Mods
2. **Pas de rate-limit partagé** : Chaque utilisateur a ses propres limites
3. **Sécurité** : Les credentials ne sont jamais stockés sur le serveur
4. **Simplicité** : Pas besoin de configurer des variables d'environnement
5. **Flexibilité** : Changement de compte facile via l'interface

### Breaking Changes

Aucun ! Le système est **rétrocompatible**. Si des variables d'environnement sont configurées, elles seront utilisées comme fallback.

### Migration

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

### Documentation

- [CREDENTIALS_CONFIG.md](./CREDENTIALS_CONFIG.md) - Guide complet
- [EXAMPLES.js](./EXAMPLES.js) - Exemples de code
- [README.md](./README.md) - Guide de démarrage rapide

### Bugs Connus

Aucun bug connu pour le moment.

### Améliorations Futures

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

