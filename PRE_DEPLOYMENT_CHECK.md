# Checklist Pré-Déploiement - The Courrier

**Date de vérification** : 21 Janvier 2026  
**Version** : 3.3.1  
**Plateforme de déploiement prévue** : Vercel

> **Documentation complète** : voir [README.md](./README.md), [DEPLOYMENT.md](./DEPLOYMENT.md), [CREDENTIALS_CONFIG.md](./CREDENTIALS_CONFIG.md)
> **Guide rapide** : voir [.github/QUICK_UPDATE_GUIDE.md](./.github/QUICK_UPDATE_GUIDE.md)

---

## Checklist de Vérification

### 1. Code et Build

- [ ] `npm install` fonctionne sans erreur
- [ ] `npm run build` se termine avec succès
- [ ] `npm run server` démarre Express sur port 4000
- [ ] `npm start` démarre React dev server
- [ ] Aucun fichier `.env` commité dans le repo
- [ ] `.gitignore` contient `.env`

### 2. Configuration Serverless

- [ ] Fonctions Vercel dans `/api/nexus/` (validate.mjs, tracked.mjs, untrack.mjs)
- [ ] `vercel.json` configuré avec rewrites pour DELETE /tracked/:domain/:modId
- [ ] Headers CORS identiques dans toutes les fonctions (voir CHANGELOG.md 3.3.0)
- [ ] `nexusHeaders(username, apiKey)` accepte paramètres dans toutes les fonctions

### 3. Synchronisation Dev/Prod

**CRITIQUE** : Vérifier que ces 7 blocs sont identiques entre server.mjs et api/nexus/tracked.mjs

- [ ] `CATEGORIES_BY_GAME` constant (5 jeux configurés)
- [ ] `toEpoch()` utility function
- [ ] `nexusHeaders(username, apiKey)` helper
- [ ] `getCategoryName(domain, categoryId)` function
- [ ] `withPool(items, limit, fn)` concurrency helper
- [ ] `getGameInfo(domain, username, apiKey)` game metadata fetcher
- [ ] Changelog version sorting (semantic: 1.13 > 1.12 > 1.9)

> **Référence** : voir [.github/copilot-instructions.md](../.github/copilot-instructions.md) section "Code Synchronization"

### 4. Sécurité

- [ ] Aucune clé API hardcodée dans le code
- [ ] Headers CORS configurés dans les fonctions serverless
- [ ] Headers de sécurité : X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- [ ] localStorage utilisé pour credentials côté client
- [ ] Credentials transitent via headers `X-Nexus-Username`/`X-Nexus-ApiKey`

> **Détails sécurité** : voir [CREDENTIALS_CONFIG.md](./CREDENTIALS_CONFIG.md)

### 5. Tests

- [ ] Test local : modal s'affiche au premier lancement
- [ ] Test local : credentials persistent après F5
- [ ] Test local : navigation fonctionne (/, /nexus-mods)
- [ ] Test build : `npm run build` réussit
- [ ] Test déploiement : site accessible après deploy
- [ ] Test API : validate, tracked, untrack fonctionnent

> **Tests complets** : voir [TESTING_GUIDE.md](./TESTING_GUIDE.md)

### 6. Documentation

- [ ] README.md complet et à jour
- [ ] DEPLOYMENT.md avec instructions Vercel
- [ ] CHANGELOG.md contient version 3.3.0
- [ ] Tous les fichiers .md cohérents (pas de doublons)
- [ ] .github/copilot-instructions.md à jour

### 7. API et Cache

- [ ] Cache configuré : 60s (liste mods), 10min (détails mod), 24h (infos jeu)
- [ ] TTL cohérent dans toutes les fonctions serverless
- [ ] Endpoints exposés : `/api/nexus/validate`, `/api/nexus/tracked`, `/api/nexus/untrack`

---

## Actions Avant Déploiement

### 1. Tests Locaux Complets

# Vérifier : http://localhost:3000

```---



### 2. Build de Production###  4. Architecture Technique -  VALIDÉ



```bashDocumentation exhaustive de l'architecture :

npm run build

# Doit se terminer sans erreur#### Sitemap & Routing

```-  `/` → ActuUpdatePage

-  `/nexus-mods` → NexusModsPage

### 3. Vérification Git

#### Structure des Composants

```bash```

# Vérifier qu'aucun .env n'est commitésrc/

git status├── App.jsx                    # Point d'entrée

├── pages/

# Vérifier les fichiers modifiés│   ├── ActuUpdatePage.jsx     # Actualités

git diff│   └── NexusModsPage.jsx      # Gestion mods

```└── components/

    ├── CredentialsModal.jsx   # Configuration

### 4. Déploiement    ├── useNexusCredentials.js # Hook localStorage

    ├── useNexusMods.js        # Hook API

Suivre les instructions dans [DEPLOYMENT.md](./DEPLOYMENT.md)    └── useTheme.js            # Hook thème

```

---

**Localisation** : README.md lignes 115-196

##  Actions Après Déploiement

#### Services & API
-  Backend local (server.mjs - port 4000)

```bash
# Terminal 1: Start backend
npm run server

# Terminal 2: Start frontend
npm start

# Terminal 3: Run tests (optional)
npm test
```

### 2. Vérifier le Build

```bash
npm run build
# Should complete without errors
```

### 3. Validation Finale

**Le projet est prêt si tous les points sont cochés :**

- Architecture documentée : [README.md](./README.md)
- Déploiement documenté : [DEPLOYMENT.md](./DEPLOYMENT.md)
- Tests documentés : [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- Credentials documentés : [CREDENTIALS_CONFIG.md](./CREDENTIALS_CONFIG.md)
- Historique documenté : [CHANGELOG.md](./CHANGELOG.md)
- Guide IA : [.github/copilot-instructions.md](../.github/copilot-instructions.md)

---

## Documentation

### Statut des Fichiers

| Document | Rôle | Dernière MàJ |
|----------|------|--------------|
| README.md | Documentation principale + pitch | 21 Jan 2026 |
| CHANGELOG.md | Historique des versions (source unique) | 21 Jan 2026 |
| DEPLOYMENT.md | Guide déploiement Vercel | 21 Jan 2026 |
| TESTING_GUIDE.md | Tests manuels + credentials test | 21 Jan 2026 |
| CREDENTIALS_CONFIG.md | Configuration avancée credentials | 7 Nov 2025 |
| SUMMARY.md | Vue d'ensemble utilisateur | 21 Jan 2026 |
| ADDING_GAME_CATEGORIES.md | Ajout catégories jeux | 30 Déc 2025 |
| PRE_DEPLOYMENT_CHECK.md | Checklist (ce fichier) | 21 Jan 2026 |
| .github/copilot-instructions.md | Guide agents IA | 21 Jan 2026 |

### Cohérence Vérifiée

- Version actuelle : **3.3.0 (21 Janvier 2026)**
- Terminologie uniforme : credentials, localStorage, headers `X-Nexus-*`, serverless functions
- Endpoints API identiques dans tout le projet
- Scripts npm cohérents

---

## Recommandations Finales

### Avant le Déploiement

1. Lancer tous les tests locaux
2. Exécuter `npm run build` sans erreur
3. Vérifier que `.env` n'est pas commité
4. Vérifier la synchronisation dev/prod (7 blocs critiques)
5. Commiter tous les changements

### Après le Déploiement

1. Tester le modal de configuration au premier lancement
2. Entrer les credentials de test (voir TESTING_GUIDE.md)
3. Vérifier la navigation entre les pages
4. Tester la persistance (F5)
5. Vérifier les logs Vercel en cas d'erreur

---

## Conclusion

**Le projet est PRÊT pour le déploiement sur Vercel !**

Tous les éléments sont présents et synchronisés :
- Code dev/prod synchronisé (version 3.3.0)
- Documentation complète et dédupliquée
- Tests manuels documentés avec credentials publics
- Architecture claire avec guide pour agents IA

**Prochaine étape** : Suivre [DEPLOYMENT.md](./DEPLOYMENT.md) pour déployer !


