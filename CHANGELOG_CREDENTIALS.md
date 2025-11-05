# Changelog - Configuration des Identifiants Utilisateur

## Version 2.0.0 - Configuration locale des credentials

### 🎉 Nouvelles Fonctionnalités

#### Interface Utilisateur
- ✅ **Modal de configuration** : Popup Bootstrap pour saisir username et API key
- ✅ **Affichage du statut** : Badge dans la navbar montrant l'utilisateur connecté
- ✅ **Boutons de gestion** : Configuration et suppression des credentials depuis la navbar
- ✅ **Messages d'erreur améliorés** : Alertes claires en cas de credentials manquants

#### Stockage et Sécurité
- ✅ **localStorage** : Stockage local et sécurisé des credentials dans le navigateur
- ✅ **Hook personnalisé** : `useNexusCredentials` pour gérer facilement les credentials
- ✅ **Validation** : Vérification de la présence des credentials avant les requêtes

#### Backend
- ✅ **Headers HTTP personnalisés** : `X-Nexus-Username` et `X-Nexus-ApiKey`
- ✅ **Rétrocompatibilité** : Support des variables d'environnement (fallback)
- ✅ **Toutes les fonctions API** : tracked, untrack mises à jour (Vercel + Netlify)

### 📁 Fichiers Créés

```
src/
  components/
    CredentialsModal.jsx       # Modal de saisie des credentials
    useNexusCredentials.js     # Hook de gestion du localStorage

docs/
  CREDENTIALS_CONFIG.md        # Documentation complète
  EXAMPLES.js                  # Exemples d'utilisation
  CHANGELOG_CREDENTIALS.md     # Ce fichier
```

### 🔄 Fichiers Modifiés

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

### 🔧 Changements Techniques

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

### 🎯 Avantages

1. **Multi-utilisateurs** : Chaque utilisateur utilise son propre compte Nexus Mods
2. **Pas de rate-limit partagé** : Chaque utilisateur a ses propres limites
3. **Sécurité** : Les credentials ne sont jamais stockés sur le serveur
4. **Simplicité** : Pas besoin de configurer des variables d'environnement
5. **Flexibilité** : Changement de compte facile via l'interface

### ⚠️ Breaking Changes

Aucun ! Le système est **rétrocompatible**. Si des variables d'environnement sont configurées, elles seront utilisées comme fallback.

### 🚀 Migration

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

### 📚 Documentation

- [CREDENTIALS_CONFIG.md](./CREDENTIALS_CONFIG.md) - Guide complet
- [EXAMPLES.js](./EXAMPLES.js) - Exemples de code
- [README.md](./README.md) - Guide de démarrage rapide

### 🐛 Bugs Connus

Aucun bug connu pour le moment.

### 🔮 Améliorations Futures

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
