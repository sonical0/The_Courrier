# 🎉 The Courrier - Vue d'Ensemble# 🎉 The Courrier - Guide d'Utilisation et d'Implémentation



## 📖 Présentation## 📖 Vue d'ensemble



**The Courrier** est une application React permettant de suivre les mises à jour de vos mods préférés sur Nexus Mods.**The Courrier** est une application React permettant de suivre les mises à jour de vos mods préférés sur Nexus Mods. Ce document vous guide dans l'utilisation et l'implémentation du système.



> 💡 **Documentation technique complète** : voir [README.md](./README.md)> 💡 **Note :** Pour l'historique technique détaillé des changements, consultez [CHANGELOG.md](./CHANGELOG.md)



## 🎯 Fonctionnalités Principales## 🎯 Fonctionnalités Principales



### Pour les Utilisateurs### Pour les Utilisateurs

- 🔐 **Configuration personnelle** : Utilisez vos propres identifiants Nexus Mods

- 🔐 **Configuration personnelle** : Utilisez vos propres identifiants Nexus Mods- 📰 **Actualités des mods** : Page dédiée aux mises à jour récentes (24h, 7j, 30j)

- 📰 **Actualités des mods** : Page dédiée aux mises à jour récentes (24h, 7j, 30j)- 🎮 **Affichage enrichi** : Vrais noms de jeux et icônes officielles Nexus

- 🎮 **Affichage enrichi** : Vrais noms de jeux et icônes officielles Nexus- 📋 **Gestion des suivis** : Ajoutez/retirez des mods de votre liste

- 📋 **Gestion des suivis** : Ajoutez/retirez des mods de votre liste- 🌓 **Thème adaptatif** : Mode clair/sombre automatique

- 🌓 **Thème adaptatif** : Mode clair/sombre automatique

### Pour les Développeurs

### Pour les Développeurs- ✅ **Déploiement simplifié** : Aucun secret à configurer

- ✅ **Multi-plateforme** : Compatible Vercel et Netlify

- ✅ **Déploiement simplifié** : Aucun secret à configurer- ✅ **Cache intelligent** : Optimisation des appels API

- ✅ **Multi-plateforme** : Compatible Vercel et Netlify- ✅ **Architecture propre** : Hooks React réutilisables

- ✅ **Cache intelligent** : Optimisation des appels API

- ✅ **Architecture propre** : Hooks React réutilisables## 📚 Documentation Complémentaire



## 🚀 Comment l'UtiliserCe guide se concentre sur l'utilisation pratique. Pour plus de détails :



### Pour les utilisateurs finaux- **[CHANGELOG.md](./CHANGELOG.md)** - Historique technique des versions

- **[CREDENTIALS_CONFIG.md](./CREDENTIALS_CONFIG.md)** - Configuration avancée des credentials

1. Ouvrez l'application- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Scénarios de test complets

2. La popup s'affiche automatiquement- **[EXAMPLES.js](./EXAMPLES.js)** - Exemples de code pour développeurs

3. Entrez vos identifiants Nexus Mods :- **[README.md](./README.md)** - Documentation technique du projet

   - Username : votre nom d'utilisateur Nexus

   - API Key : disponible sur <https://www.nexusmods.com/users/myaccount?tab=api>## 🚀 Comment l'utiliser

4. Cliquez sur "Enregistrer"

5. C'est prêt ! 🎉### Pour les utilisateurs finaux



### Pour modifier les credentials1. Ouvrez l'application

2. La popup s'affiche automatiquement

- Cliquez sur **⚙️ Config** dans la navbar3. Entrez vos identifiants Nexus Mods :

- Modifiez les informations   - Username : votre nom d'utilisateur Nexus

- Cliquez sur "Enregistrer"   - API Key : disponible sur https://www.nexusmods.com/users/myaccount?tab=api

4. Cliquez sur "Enregistrer"

### Pour supprimer les credentials5. C'est prêt ! 🎉



- Cliquez sur **🗑️** dans la navbar### Pour modifier les credentials

- Confirmez la suppression

- Cliquez sur **⚙️ Config** dans la navbar

## 📁 Structure du Projet- Modifiez les informations

- Cliquez sur "Enregistrer"

```text

The_Courrier/### Pour supprimer les credentials

├── src/

│   ├── App.jsx                           # Point d'entrée de l'application- Cliquez sur **🗑️** dans la navbar

│   ├── components/- Confirmez la suppression

│   │   ├── CredentialsModal.jsx          # Modal de configuration des identifiants

│   │   ├── useNexusCredentials.js        # Hook de gestion localStorage## 🔧 Configuration Technique

│   │   ├── useNexusMods.js               # Hook d'interaction avec l'API Nexus

│   │   └── useTheme.js                   # Hook de gestion du thème### Développement Local

│   └── pages/

│       ├── ActuUpdatePage.jsx            # Page des mises à jour récentes

│       └── NexusModsPage.jsx             # Page de gestion des mods suivis## 🚀 Déploiement (Vercel & Netlify)

├── api/nexus/                            # Fonctions serverless Vercel

├── netlify/functions/                    # Fonctions serverless Netlify**The Courrier** est conçu pour être déployé facilement sur Vercel ou Netlify, sans configuration complexe.

└── Documentation/                        # Voir section ci-dessous

```### Déploiement sur Vercel



## 📚 Documentation Complémentaire1. **Importer le projet**  

   - Créez un compte sur [vercel.com](https://vercel.com)  

- **[README.md](./README.md)** - Documentation technique complète du projet   - Importez le repo GitHub

- **[CHANGELOG.md](./CHANGELOG.md)** - Historique technique des versions

- **[CREDENTIALS_CONFIG.md](./CREDENTIALS_CONFIG.md)** - Configuration avancée des credentials2. **Build automatique**  

- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Scénarios de test complets   - Vercel détecte l'app React  

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guide de déploiement Vercel/Netlify   - Build command : `npm run build`  

   - Output directory : `build`

> **Note** : Les tests sont décrits dans [TESTING_GUIDE.md](./TESTING_GUIDE.md). Le déploiement est décrit dans [DEPLOYMENT.md](./DEPLOYMENT.md).

3. **Fonctions serverless**  

## 🎉 État Actuel   - Dossier : `/api/nexus/`  

   - Les endpoints sont automatiquement exposés

**Version 3.0.0** - 6 Novembre 2025

4. **Variables d'environnement (optionnelles)**  

### Fonctionnalités Actives   - `NEXUS_API_KEY`, `NEXUS_USERNAME`, `NEXUS_APP_NAME`  

   - Par défaut, chaque utilisateur configure ses propres credentials dans l'interface

- ✅ Configuration personnelle des identifiants Nexus

- ✅ Affichage des vrais noms de jeux avec icônes5. **Déployer**  

- ✅ Page des actualités de mods (ActuUpdatePage)   - Cliquez sur "Deploy"  

- ✅ Gestion complète des mods suivis   - Accédez à votre app sur `https://your-app-name.vercel.app`

- ✅ Stockage local sécurisé

- ✅ Cache intelligent multi-niveaux---

- ✅ Support Vercel et Netlify

### Déploiement sur Netlify

### Statut

1. **Importer le projet**  

- ✅ **Production Ready** - Prêt pour déploiement   - Créez un compte sur [netlify.com](https://netlify.com)  

- ✅ **Multi-utilisateurs** - Chaque utilisateur utilise ses propres credentials   - Importez le repo GitHub

- ✅ **Documentation complète** - Guides utilisateurs et développeurs

2. **Build automatique**  

---   - Netlify détecte le build via `netlify.toml`  

   - Build command : `npm run build`  

**Dernière mise à jour** : 7 Novembre 2025   - Publish directory : `build`  

   - Functions directory : `netlify/functions`

3. **Variables d'environnement (optionnelles)**  
   - `NEXUS_API_KEY`, `NEXUS_USERNAME`, `NEXUS_APP_NAME`  
   - Par défaut, chaque utilisateur configure ses propres credentials dans l'interface

4. **Déployer**  
   - Cliquez sur "Deploy site"  
   - Accédez à votre app sur `https://your-app-name.netlify.app`

---

**Points clés :**
- Les credentials Nexus sont gérés côté client (localStorage) pour chaque utilisateur
- Les fonctions serverless sont compatibles Vercel et Netlify sans modification
- Consultez [DEPLOYMENT.md](./DEPLOYMENT.md) pour les instructions détaillées et les cas avancés

## 🎯 Avantages du Système

### Pour les utilisateurs
- ✅ Utilise leur propre compte Nexus
- ✅ Pas de partage de rate-limit
- ✅ Configuration simple en 30 secondes
- ✅ Gestion facile des credentials

### Pour les développeurs
- ✅ Pas de secrets à gérer en production
- ✅ Déploiement simplifié
- ✅ Rétrocompatible avec l'ancien système
- ✅ Code propre et maintenable

### Pour la sécurité
- ✅ Credentials jamais sur le serveur
- ✅ Stockage local dans le navigateur
- ✅ Transit sécurisé via HTTPS
- ✅ Isolation par utilisateur

## 🧪 Tests à Effectuer

### Test Rapide (2 minutes)

1. ✅ Lancer l'application
2. ✅ Vérifier que la popup s'affiche
3. ✅ Entrer des credentials de test
4. ✅ Vérifier que le badge utilisateur apparaît
5. ✅ Naviguer vers "Nexus Mods" et vérifier le chargement
6. ✅ Rafraîchir la page (F5) - les credentials doivent persister

### Test Complet

Voir [TESTING_GUIDE.md](./TESTING_GUIDE.md) pour tous les scénarios de test.

## 📁 Structure des Fichiers

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

> 📝 **Changements récents :** Voir [CHANGELOG.md](./CHANGELOG.md) pour la liste complète des fichiers créés, modifiés et supprimés.

## 🔮 Prochaines Étapes Possibles

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

## 💡 Conseils et Bonnes Pratiques

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

## 🐛 Dépannage Rapide

**La popup ne s'affiche pas**  
→ Vider le cache du navigateur et localStorage

**Erreur 401 même avec credentials valides**  
→ Vérifier que la clé API est correcte sur Nexus Mods

**Les credentials ne persistent pas**  
→ Vérifier que localStorage est activé dans le navigateur

**Headers non envoyés aux API**  
→ Vérifier que `useNexusMods(credentials)` reçoit bien les credentials

> 📘 Pour plus de solutions, consultez [TESTING_GUIDE.md](./TESTING_GUIDE.md)

## 📞 Ressources

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

## 🎉 État Actuel

**Version 3.0.0** - 6 Novembre 2025

### Fonctionnalités Actives

- ✅ Configuration personnelle des identifiants Nexus
- ✅ Affichage des vrais noms de jeux avec icônes
- ✅ Page des actualités de mods (ActuUpdatePage)
- ✅ Gestion complète des mods suivis
- ✅ Stockage local sécurisé
- ✅ Cache intelligent multi-niveaux
- ✅ Support Vercel et Netlify

### Statut

- ✅ **Production Ready** - Prêt pour déploiement
- ✅ **Multi-utilisateurs** - Chaque utilisateur utilise ses propres credentials
- ✅ **Documentation complète** - Guides utilisateurs et développeurs

> 📝 **Historique complet :** Consultez [CHANGELOG.md](./CHANGELOG.md) pour tous les détails techniques des versions précédentes.

---

**Dernière mise à jour :** 6 Novembre 2025
