# The Courrier - Guide d'Utilisation et d'Implémentation

## Vue d'ensemble

**The Courrier** est une application React permettant de suivre les mises à jour de vos mods préférés sur Nexus Mods. Ce document vous guide dans l'utilisation et l'implémentation du système.

> **Note :** Pour l'historique technique détaillé des changements, consultez [CHANGELOG.md](./CHANGELOG.md)

## Fonctionnalités Principales

### Pour les Utilisateurs

- **Configuration personnelle** : Utilisez vos propres identifiants Nexus Mods
- **Actualités des mods** : Page dédiée aux mises à jour récentes (24h, 7j, 30j)
- **Affichage enrichi** : Vrais noms de jeux et icônes officielles Nexus
- **Catégories des mods** : Affichage des catégories pour chaque mod (180+ catégories pour 5 jeux)
- **Badges NEW** : Identifiez les nouveaux mods depuis votre dernière visite
- **Tri avancé** : Trier par date, nom ou auteur
- **Gestion des suivis** : Ajoutez/retirez des mods de votre liste
- **Thème adaptatif** : Mode clair/sombre automatique

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

### Améliorations Fonctionnelles

- [ ] Tests unitaires et d'intégration
- [ ] Validation de la clé API en temps réel
- [ ] Support de multiples comptes Nexus
- [ ] Extension à d'autres plateformes (Steam, GOG)
- [ ] Système de notifications pour les updates
- [ ] Import/Export de configuration
- [ ] Mode hors-ligne avec cache persistant

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

## État Actuel

**Version 3.0.0** - 6 Novembre 2025

### Fonctionnalités Actives

- Configuration personnelle des identifiants Nexus
- Affichage des vrais noms de jeux avec icônes
- Page des actualités de mods (ActuUpdatePage)
- Gestion complète des mods suivis
- Stockage local sécurisé
- Cache intelligent multi-niveaux
- Support Vercel et Netlify

### Statut

- **Production Ready** - Prêt pour déploiement
- **Multi-utilisateurs** - Chaque utilisateur utilise ses propres credentials
- **Documentation complète** - Guides utilisateurs et développeurs

> **Historique complet :** Consultez [CHANGELOG.md](./CHANGELOG.md) pour tous les détails techniques des versions précédentes.

---

**Dernière mise à jour :** 6 Novembre 2025
