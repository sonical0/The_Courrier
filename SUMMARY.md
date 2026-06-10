# The Courrier - Guide d'Utilisation et d'Implémentation

## Vue d'ensemble

**The Courrier** est une application React permettant de suivre les mises à jour de vos mods préférés sur Nexus Mods. Ce document vous guide dans l'utilisation et l'implémentation du système.

> **Note :** Pour l'historique technique détaillé des changements, consultez [CHANGELOG.md](./CHANGELOG.md)

## Fonctionnalités Principales

### Pour les Utilisateurs

- **Configuration personnelle** : Utilisez vos propres identifiants Nexus Mods avec validation en temps reel
- **Actualites des mods** : Page dediee aux mises a jour recentes (7j, 15j, 30j, annee)
- **Affichage enrichi** : Vrais noms de jeux et icones officielles Nexus
- **Categories des mods** : Affichage des categories pour chaque mod (180+ categories pour 5 jeux)
- **Badges NEW** : Identifiez les nouveaux mods depuis votre derniere visite, dismissables individuellement ou en bloc
- **Filtre par categorie** : Restreindre l'affichage a une categorie de mod (Gameplay, Armures, etc.)
- **Tags/statuts** : Marquer chaque mod comme Installe, A installer, En pause ou Archive ; filtre par statut dans la liste
- **Export/Import config** : Sauvegarder et restaurer les tags, mods vus et theme via un fichier JSON
- **Notifications navigateur** : Alerte automatique quand de nouveaux mods sont detectes, bouton ON/OFF dans la navbar
- **Recherche** : Filtrage par nom de mod ou auteur en temps reel
- **Tri avance** : Trier par date, nom ou auteur
- **Gestion des suivis** : Retrait individuel ou en lot, avec confirmation unique
- **Export JSON** : Telechargement de la liste complete des mods suivis
- **Tableau de bord** : Statistiques globales, distribution par jeu, auteurs les plus actifs
- **Verification d'incompatibilites** : Detection de conflits potentiels entre mods
- **Integration Steam** : Suivi des versions de jeux avec alertes de mises a jour
- **Theme adaptatif** : Mode clair/sombre persistant

### Pour les Développeurs

- **Déploiement simplifié** : Aucun secret à configurer
- **Multi-plateforme** : Compatible Vercel et Netlify
- **Cache intelligent** : Optimisation des appels API
- **Architecture propre** : Hooks React réutilisables
- **Système extensible** : Outils fournis pour ajouter de nouveaux jeux

## Documentation Complémentaire

Ce guide se concentre sur l'utilisation pratique. Pour plus de détails :

- **[CHANGELOG.md](./CHANGELOG.md)** - Historique technique des versions
- **[CREDENTIALS_CONFIG.md](./CREDENTIALS_CONFIG.md)** - Configuration avancée des credentials
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Scénarios de test complets
- **[ADDING_GAME_CATEGORIES.md](./ADDING_GAME_CATEGORIES.md)** - Guide pour ajouter des catégories de nouveaux jeux
- **[EXAMPLES.js](./EXAMPLES.js)** - Exemples de code pour développeurs
- **[README.md](./README.md)** - Documentation technique du projet

## Comment l'utiliser

### Pour les utilisateurs finaux

1. Ouvrez l'application
2. La popup s'affiche automatiquement
3. Entrez vos identifiants Nexus Mods :
   - Username : votre nom d'utilisateur Nexus
   - API Key : disponible sur https://www.nexusmods.com/users/myaccount?tab=api
4. Cliquez sur "Enregistrer"
5. C'est prêt !

### Pour modifier les credentials

- Cliquez sur "Config" dans la navbar
- Modifiez les informations
- Cliquez sur "Enregistrer"

### Pour supprimer les credentials

- Cliquez sur le bouton de suppression dans la navbar
- Confirmez la suppression

## Configuration Technique

### Développement Local

```bash
npm install
npm run server  # Démarre Express sur le port 4000
npm start       # Démarre React dev server (proxy vers 4000)
```

## Déploiement

Consultez [DEPLOYMENT.md](./DEPLOYMENT.md) pour les instructions complètes de déploiement sur Vercel.
   - Importez le repo GitHub

2. **Build automatique**
   - Netlify détecte le build via `netlify.toml`
   - Build command : `npm run build`
   - Publish directory : `build`
   - Functions directory : `netlify/functions`

3. **Variables d'environnement (optionnelles)**
   - `NEXUS_API_KEY`, `NEXUS_USERNAME`, `NEXUS_APP_NAME`
   - Par défaut, chaque utilisateur configure ses propres credentials dans l'interface

4. **Déployer**
   - Cliquez sur "Deploy site"
   - Accédez à votre app sur `https://your-app-name.netlify.app`

---

**Points clés :**
- Les credentials Nexus sont gérés côté client (localStorage) pour chaque utilisateur
- Les fonctions serverless sont compatibles Vercel et Netlify sans modification
- Consultez [DEPLOYMENT.md](./DEPLOYMENT.md) pour les instructions détaillées et les cas avancés

## Avantages du Système

### Pour les utilisateurs
- Utilise leur propre compte Nexus
- Pas de partage de rate-limit
- Configuration simple en 30 secondes
- Gestion facile des credentials

### Pour les développeurs
- Pas de secrets à gérer en production
- Déploiement simplifié
- Rétrocompatible avec l'ancien système
- Code propre et maintenable

### Pour la sécurité
- Credentials jamais sur le serveur
- Stockage local dans le navigateur
- Transit sécurisé via HTTPS
- Isolation par utilisateur

## Tests à Effectuer

### Test Rapide (2 minutes)

1. Lancer l'application
2. Vérifier que la popup s'affiche
3. Entrer des credentials de test
4. Vérifier que le badge utilisateur apparaît
5. Naviguer vers "Nexus Mods" et vérifier le chargement
6. Rafraîchir la page (F5) - les credentials doivent persister

### Test Complet

Voir [TESTING_GUIDE.md](./TESTING_GUIDE.md) pour tous les scénarios de test.

## Structure des Fichiers

Pour une vue d'ensemble de l'architecture :

```
The_Courrier/
├── src/
│   ├── App.jsx                           # Point d'entrée de l'application
│   ├── components/
│   │   ├── CredentialsModal.jsx          # Modal de configuration des identifiants
│   │   ├── useNexusCredentials.js        # Hook de gestion localStorage
│   │   ├── useNexusMods.js               # Hook d'interaction avec l'API Nexus
│   │   └── useTheme.js                   # Hook de gestion du thème
│   └── pages/
│       ├── ActuUpdatePage.jsx            # Page des mises à jour récentes
│       └── NexusModsPage.jsx             # Page de gestion des mods suivis
├── api/nexus/                            # Fonctions serverless Vercel
├── netlify/functions/                    # Fonctions serverless Netlify
└── Documentation/                        # Voir section "Documentation Complémentaire"
```

> **Changements récents :** Voir [CHANGELOG.md](./CHANGELOG.md) pour la liste complète des fichiers créés, modifiés et supprimés.

## Prochaines Étapes Possibles

Voir [CHANGELOG.md](./CHANGELOG.md) pour les fonctionnalités déjà implémentées.

### Ameliorations Fonctionnelles

- [x] Tests unitaires pour CredentialsModal (10 tests) et useLastVisit (9 tests)
- [x] Validation de la cle API en temps reel dans la modal
- [x] Recherche par nom et auteur (NexusModsPage, ActuUpdatePage)
- [x] Suppression en lot des mods suivis
- [x] Export JSON de la liste des mods
- [x] Badge NEW dismissable par mod (bouton "Lu" individuel + "Tout marquer comme lu")
- [x] Filtre par categorie de mod (NexusModsPage et ActuUpdatePage)
- [x] Tags/statuts sur les mods (Installe, A installer, En pause, Archive) avec persistance et filtre
- [x] Tests unitaires pour useNexusCredentials (8 tests) et useNexusMods (11 tests)
- [x] Import/Export de configuration (tags, seenMods, theme — credentials exclus)
- [x] Notifications navigateur pour les nouveaux mods (bouton ON/OFF, permission, persistance)
- [ ] Support de multiples comptes Nexus
- [ ] Extension a d'autres plateformes (Steam, GOG)

### Optimisations Techniques

- [ ] Chiffrement des credentials en localStorage
- [ ] Compression des données de cache
- [ ] Service Worker pour le mode hors-ligne
- [ ] Analytics anonymes d'utilisation

## Conseils et Bonnes Pratiques

### Interface Utilisateur

- Obtenez votre API key sur [Nexus Mods](https://www.nexusmods.com/users/myaccount?tab=api)
- Ne partagez jamais votre clé API avec d'autres personnes
- Si vous changez de navigateur, reconfigurez vos credentials
- Les credentials sont stockés localement et ne quittent jamais votre navigateur

### Développement et Déploiement

- Testez d'abord en local avant de déployer en production
- Vérifiez les logs des fonctions serverless pour diagnostiquer les erreurs
- Surveillez les erreurs 401/403 (problèmes d'authentification)
- HTTPS est obligatoire en production pour la sécurité
- Les headers CORS sont pré-configurés pour Vercel et Netlify

## Dépannage Rapide

**La popup ne s'affiche pas**
→ Vider le cache du navigateur et localStorage

**Erreur 401 même avec credentials valides**
→ Vérifier que la clé API est correcte sur Nexus Mods

**Les credentials ne persistent pas**
→ Vérifier que localStorage est activé dans le navigateur

**Headers non envoyés aux API**
→ Vérifier que `useNexusMods(credentials)` reçoit bien les credentials

> Pour plus de solutions, consultez [TESTING_GUIDE.md](./TESTING_GUIDE.md)

## Ressources

### Documentation du Projet

- [CREDENTIALS_CONFIG.md](./CREDENTIALS_CONFIG.md) - Configuration avancée des credentials
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Guide de test complet
- [EXAMPLES.js](./EXAMPLES.js) - Exemples de code

### Ressources Externes

- [Documentation API Nexus Mods](https://app.swaggerhub.com/apis-docs/NexusMods/nexus-mods_public_api_params_in_form_data/1.0)
- [Obtenir une API Key Nexus](https://www.nexusmods.com/users/myaccount?tab=api)
- [React Hooks Documentation](https://react.dev/reference/react)
- [localStorage MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

## Etat Actuel

**Version 3.8.1** - 10 Juin 2026

### Fonctionnalites Actives

- Configuration personnelle des identifiants Nexus avec validation en temps reel
- Tableau de bord avec statistiques globales et distribution des mods
- Page des actualites de mods avec filtres periode, jeu, tri, recherche
- Liste complete des mods avec recherche, tri, suppression en lot et export JSON
- Verificateur d'incompatibilites entre mods
- Integration Steam : suivi des versions de jeux, alertes de mise a jour
- Isolation de session par utilisateur (securite)
- Cache multi-niveaux (60s / 10min / 24h / 2h)
- Stockage local des credentials et preferences
- Support Vercel (serverless)
- Tests automatises : CredentialsModal (10), useLastVisit (9), NexusModsPage (7), useModTags (9), useNexusCredentials (8), useNexusMods (11), useConfigBackup (9), useNotifications (13) — 76 tests au total

### Statut

- **Production Ready** - Deploye sur Vercel
- **Multi-utilisateurs** - Chaque utilisateur utilise ses propres credentials, sessions isolees
- **Documentation complete** - Guides utilisateurs et developpeurs

> **Historique complet :** Consultez [CHANGELOG.md](./CHANGELOG.md) pour tous les details techniques des versions precedentes.

---

**Derniere mise a jour :** 10 Juin 2026 — v3.8.1
