# Déploiement sur Cloudflare Workers

Portage depuis Vercel, branche `feat/cloudflare-pages`. Vercel n'est **pas** retiré : `api/` et `vercel.json` restent en place, Cloudflare passe par `worker.mjs`. Les deux plateformes peuvent coexister le temps de valider.

> **Workers, pas Pages.** Le portage a d'abord visé Pages, puis a basculé sur Workers le 2026-09-18. Motifs : le coût est identique (« requests for static assets on Workers are free, and Pages Functions invocations are charged at the same rate as Workers »), Workers a strictement plus de fonctionnalités (Durable Objects, Cron Triggers, observabilité), et Cloudflare publie un guide « Migrate from Pages to Workers » sans équivalent dans l'autre sens. Le seul élément Pages du portage était le routage par dossier `functions/` ; il est remplacé par une table de routes explicite dans `worker.mjs`.

## Pourquoi Cloudflare plutôt que Netlify

| | Cloudflare (gratuit) | Netlify (gratuit) |
|---|---|---|
| Requêtes | 100 000/jour | 300 crédits/mois, 2 crédits par 10k requêtes |
| Bande passante | illimitée | 20 crédits par Go |
| Déploiements | facturés en minutes de build, compteur distinct | **15 crédits par déploiement de production**, sur la même enveloppe |

Netlify facture déploiements, requêtes et bande passante sur une **enveloppe unique** — soit 20 déploiements mensuels au maximum si on ne fait rien d'autre. C'est la structure qui a mis le projet hors ligne chez Vercel de juin à septembre 2026. Cloudflare sépare les compteurs et ne facture pas la bande passante.

Second motif : Cloudflare Tunnel est déjà prévu pour le homelab. Quand la machine sera montée, l'origine se déplace derrière le tunnel sans retoucher au domaine ni refaire de migration.

## Architecture du portage

Les cinq handlers de `api/` sont écrits au format Vercel `handler(req, res)`. Le runtime Workers attend une `Response`. Plutôt que maintenir deux versions qui divergeraient au premier correctif, `api/utils/pagesAdapter.mjs` présente un faux couple `(req, res)` aux handlers existants.

`worker.mjs` porte la table de routes, en `URLPattern` — c'est ce qui remplace le routage par dossier de Pages :

```
/api/nexus/tracked                  ->  api/nexus/tracked.mjs
/api/nexus/untrack                  ->  api/nexus/untrack.mjs
/api/nexus/validate                 ->  api/nexus/validate.mjs
/api/nexus/tracked/:domain/:modId   ->  api/nexus/untrack.mjs
/api/steam/game/:appId              ->  api/steam/game/[appId].mjs
```

**Conséquence** : un correctif dans `api/` profite simultanément à Vercel, au serveur local (`server.mjs`) et à Cloudflare.

La quatrième route remplace la rewrite `vercel.json` qui transformait `/api/nexus/tracked/:domain/:modId` en `/api/nexus/untrack?domain=&modId=`. Les groupes nommés d'`URLPattern` jouent le rôle de `context.params` sur Pages : l'adaptateur les fusionne dans `req.query`, là où le handler les lit.

L'ordre de la table compte — le premier motif qui correspond gagne, donc `/api/nexus/tracked` doit précéder `/api/nexus/tracked/:domain/:modId`.

### Modifications du code partagé

| Fichier | Changement | Raison |
|---|---|---|
| `api/nexus/{tracked,untrack,validate}.mjs` | suppression de `import fetch from "node-fetch"` | `fetch` est global sur Workers **et** sur Node ≥ 18. `api/steam/game/[appId].mjs` s'en passait déjà. |
| `api/utils/NexusUtils.mjs` | `readFileSync` → `import ... with { type: "json" }` | Le runtime Workers n'a pas de système de fichiers. L'attribut est requis par Node 22 en ESM et compris par esbuild. |

`api/utils/rateLimit.mjs` est **inchangé** : il lit `process.env`, peuplé depuis les bindings du projet (voir ci-dessous), et `clientKey()` fonctionne car l'adaptateur recopie `CF-Connecting-IP` dans `x-forwarded-for`.

### Fichiers de configuration

- `worker.mjs` — point d'entrée et table de routes.
- `wrangler.toml` — `main`, assets, date de compatibilité, variables non secrètes.
- `public/_headers` — les trois en-têtes de sécurité de `vercel.json`. CRA recopie `public/` vers `build/`, et Workers lit `_headers` nativement depuis le dossier d'assets.

Le fallback SPA ne passe plus par un `_redirects` : il est assuré par `not_found_handling = "single-page-application"`.

**`run_worker_first = ["/api/*"]` n'est pas décoratif.** Les assets sont servis *avant* le Worker, et le fallback SPA s'applique aux requêtes de **navigation** (celles qui portent `Sec-Fetch-Mode: navigate`). Sans cette option, une URL d'API inconnue tapée dans la barre d'adresse renvoyait `index.html` en 200 au lieu d'un 404 JSON. Les appels `fetch()` de l'application n'étaient pas touchés — ils ne sont pas des navigations — mais un contrat d'API ne doit pas dépendre du mode de la requête.

## Mise en place

### 1. Créer le Worker

Tableau de bord Cloudflare → Compute (Workers) → Create → Import a repository → `sonical0/The_Courrier`.

| Réglage | Valeur |
|---|---|
| Branche de production | `main` (ou `feat/cloudflare-pages` pour un premier essai) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

Le reste (`main`, dossier d'assets, fallback SPA, `run_worker_first`) est lu depuis `wrangler.toml` — rien à ressaisir dans l'interface.

### 2. Poser les secrets

Settings → Variables and Secrets, type **Secret** :

- `NEXUS_API_KEY`
- `NEXUS_USERNAME`

Les variables non secrètes (`NEXUS_APP_NAME`, `RATE_LIMIT_NEXUS`, `RATE_LIMIT_STEAM`) sont déjà dans `wrangler.toml`. Elles restent surchargeables depuis le tableau de bord sans redéploiement de code.

Ces valeurs ne sont que des **replis** : le front envoie normalement les identifiants de l'utilisateur via `X-Nexus-Username` / `X-Nexus-ApiKey`.

### 3. Poser une règle de rate limiting — le vrai correctif

`api/utils/rateLimit.mjs` documente lui-même sa limite : le compteur vit en mémoire de processus, donc chaque isolate a le sien et un démarrage à froid repart de zéro. Il borne une boucle client emballée, mais ce n'est pas un quota.

Son en-tête conclut qu'*« il faut soit le rate limiting qui bloque AVANT l'invocation, soit un store partagé »*. C'est exactement ce que fait Cloudflare : Security → WAF → Rate limiting rules, sur `/api/*`, par IP. La règle s'applique à la périphérie, **avant** l'exécution du Worker — donc sans consommer de quota.

Le limiteur en mémoire reste en place comme seconde barrière ; il ne coûte rien.

### 4. Alerte de consommation — non négociable

Notifications → Usage-based billing / Workers. Ce qui a coûté trois mois d'indisponibilité, ce n'est pas le dépassement lui-même : c'est de l'avoir appris par deux mails en juin et d'avoir cru le site en ligne jusqu'en septembre.

## À vérifier au premier déploiement

- [ ] `GET /api/nexus/validate` avec en-têtes `X-Nexus-Username` / `X-Nexus-ApiKey` → 200
- [ ] `GET /api/nexus/tracked` → liste des mods suivis
- [ ] `DELETE /api/nexus/tracked/<domain>/<modId>` → 200 (route de remplacement de la rewrite)
- [ ] `GET /api/steam/game/<appId>` → infos Steam
- [ ] Une route inconnue du SPA (ex. `/nexus`) → `index.html`, pas un 404
- [ ] Une route API inconnue (`/api/inconnue`) → 404 JSON, **y compris tapée dans la barre d adresse**
- [ ] En-têtes `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` présents
- [ ] En-têtes `X-RateLimit-Limit` / `X-RateLimit-Remaining` présents sur `/api/*`
- [ ] Dépasser volontairement la limite → 429 avec `Retry-After`

## Validation faite le 2026-09-18

Déroulée sur `npx wrangler dev`, après `npm install` et `npm run build`. Rejouée intégralement après la bascule Pages -> Workers. **Tous les points de la liste ci-dessus passent.**

| Vérification | Résultat |
|---|---|
| `GET /api/nexus/validate` sans identifiants | 401 + message explicite |
| `OPTIONS /api/nexus/validate` | 204 sans corps |
| `GET /api/nexus/tracked` | 401 |
| `DELETE /api/nexus/tracked/<domain>/<modId>` | 401 — la route de remplacement est bien atteinte |
| `GET /api/steam/game/489830` | **200**, données Steam réelles, `Cache-Control: public, s-maxage=7200` préservé |
| `GET /api/steam/game/pasunnombre` | 400 |
| `GET /nexus` (route SPA inconnue, en navigation) | 200 + `index.html` |
| `GET /api/inconnue` en navigation | 404 JSON (grâce à `run_worker_first`) |
| `GET /manifest.json` | 200, servi en asset sans invoquer le Worker |
| `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` | présents (via `_headers`) |
| `X-RateLimit-Limit` / `X-RateLimit-Remaining` | présents, décomptent bien |
| Dépassement volontaire (31 appels) | 24 × 401 puis **429** avec `Retry-After: 35` |

Les scopes sont bien séparés : `nexus` plafonne à 30, `steam` à 60, chacun son compteur.

### Un bug trouvé et corrigé par ce test

`GET /api/steam/game/489830` répondait `400 Invalid Steam App ID`. Cause : le handler lit `const { appId } = req.query`, car **Vercel place les segments dynamiques de route dans `req.query`**, alors que **Cloudflare les passe séparément** (`context.params` sur Pages, groupes nommés d'`URLPattern` ici). L'adaptateur les ignorait.

Corrigé dans `pagesAdapter.mjs` : `context.params` est fusionné dans `req.query`, en l'emportant sur la query string comme le fait Vercel, et une route attrape-tout (`[[path]]`) voit son tableau joint par `/`.

La route `DELETE /api/nexus/tracked/:domain/:modId` masquait le problème : son handler retombe sur une extraction depuis le chemin quand la query est vide. Elle fonctionnait donc déjà — c'est le seul endroit où la panne n'aurait pas été visible.

### Tests de l'adaptateur

`api/utils/pagesAdapter.mjs` est couvert par 34 assertions (statuts, en-têtes, `req.query`, `req.url`, casse des en-têtes de requête, `CF-Connecting-IP`, 429, handler qui lève, handler qui ne répond pas, double réponse, `params`). Le fichier de test n'est pas versionné ; le recréer au besoin, il ne dépend ni de wrangler ni du build — Node 24 fournit `Request`/`Response` en global.

## Reproduire la validation

```bash
npm install
npm run build
npx wrangler dev                # lit wrangler.toml, sert build/ + worker.mjs
```

Puis dérouler la liste sur `http://127.0.0.1:8788`.
