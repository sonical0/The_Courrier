# Déploiement sur Cloudflare Workers

Portage depuis Vercel, fusionné dans `main` le 2026-09-18.

> **Vercel a été supprimé le 2026-09-18.** Le projet `the_courrier` et tous ses déploiements ont été détruits une fois Cloudflare validé en production ; `thecourrier.vercel.app` renvoie désormais 404. Ce document décrit donc la **seule** plateforme d'hébergement du projet.
>
> `api/` reste la source unique des handlers — il sert à Cloudflare via `worker.mjs` **et** au serveur local `server.mjs`. Seul `vercel.json` est devenu une configuration morte : à supprimer, il n'est plus lu par personne.

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

Les cinq handlers de `api/` sont écrits au format Vercel `handler(req, res)`. Le runtime Workers attend une `Response`. Plutôt que maintenir deux versions qui divergeraient au premier correctif, `api/utils/workerAdapter.mjs` présente un faux couple `(req, res)` aux handlers existants.

`worker.mjs` porte la table de routes, en `URLPattern` — c'est ce qui remplace le routage par dossier de Pages :

```
/api/nexus/tracked                  ->  api/nexus/tracked.mjs
/api/nexus/untrack                  ->  api/nexus/untrack.mjs
/api/nexus/validate                 ->  api/nexus/validate.mjs
/api/nexus/tracked/:domain/:modId   ->  api/nexus/untrack.mjs
/api/steam/game/:appId              ->  api/steam/game/[appId].mjs
```

**Conséquence** : un correctif dans `api/` profite simultanément à Cloudflare et au serveur local (`server.mjs`). Le format `handler(req, res)` est un héritage de Vercel — il est conservé parce que `server.mjs` l'utilise, pas par compatibilité avec une plateforme qui n'existe plus.

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

### 3. Rate limiting — déjà en place dans le code

`api/utils/rateLimit.mjs` documente lui-même sa limite : le compteur vit en mémoire de processus, donc chaque isolate a le sien et un démarrage à froid repart de zéro. Il borne une boucle client emballée, mais ce n'est pas un quota. Son en-tête conclut qu'*« il faut soit le rate limiting qui bloque AVANT l'invocation, soit un store partagé »*.

> **Correction du 2026-09-18.** Une version antérieure de ce document recommandait une règle **WAF → Rate limiting rules**. C'est impossible ici : les règles WAF s'appliquent à une **zone**, c'est-à-dire un domaine géré par Cloudflare. Un sous-domaine `workers.dev` n'en est pas une.

La solution retenue est l'**API Rate Limiting de Workers** (`[[ratelimits]]` dans `wrangler.toml`, appelée depuis `worker.mjs`), adossée à la même infrastructure que les règles WAF mais exposée comme binding :

- compteur **partagé**, pas un `Map` par isolate — c'est lui qui borne réellement une boucle emballée ;
- deux namespaces distincts, `RL_NEXUS` (30/min) et `RL_STEAM` (60/min), alignés sur les limites existantes ;
- appliqué **avant** d'atteindre le handler, donc avant tout appel sortant vers Nexus ou Steam ;
- le limiteur en mémoire reste derrière, comme seconde barrière — il ne coûte rien et garde `server.mjs` inchangé.

**Ce qu'il ne fait pas** : il s'exécute *dans* le Worker, donc il ne supprime pas l'invocation, contrairement à une règle WAF qui bloque en amont. Pour cela il faudrait un domaine sur le compte — à reconsidérer quand le homelab passera derrière Cloudflare Tunnel, qui en suppose un de toute façon.

**Comportement vérifié en production le 2026-09-18** : 8 × 429 sur 120 requêtes soutenues, avec le corps et le `Retry-After` attendus. La documentation qualifie l'API de *permissive et éventuellement cohérente*, **volontairement pas un système de comptage exact** : les compteurs sont mis en cache sur la machine qui exécute le Worker et mis à jour en arrière-plan, et la limite est locale à chaque emplacement Cloudflare.

Conséquence pratique : **une rafale courte passe entièrement**. Un premier test de 40 requêtes n'a rien déclenché, ce qui m'a fait conclure à tort que la fonctionnalité était absente puis indisponible en plan gratuit. **Tester sur au moins une centaine de requêtes.** Cette imprécision est sans conséquence pour la menace réelle : la panne de juin était une boucle soutenue à 664 req/15 min, exactement ce que ce limiteur borne.

Les bindings de rate limiting **ne sont pas visibles dans le tableau de bord** — la documentation le précise. C'est la raison d'être de l'en-tête `X-Edge-RateLimit: on|off` posé sur chaque réponse `/api/*` : c'est le seul moyen simple de vérifier que la barrière est bien attachée au Worker déployé.

`period` n'accepte que **10 ou 60** secondes, et la limite s'applique **par emplacement Cloudflare**, pas globalement.

### 4. Alerte de consommation

> **Correction du 2026-09-18.** Il n'existe **aucune alerte d'usage Workers** dans les notifications de ce compte : la liste complète ne propose, côté consommation, que `Billing Budget Alert` et `Usage Based Billing`, toutes deux adossées à la dépense.

Posée : **Billing Budget Alert à 1 $**, vers `sanchez.alex1@icloud.com`. Elle ne surveille pas les 100 000 requêtes/jour — elle prévient dès que le compte commence à facturer quoi que ce soit.

**Et c'est suffisant, parce que le mode de défaillance de Vercel ne peut pas se reproduire ici.** Dépasser le palier gratuit chez Cloudflare renvoie des 429 ; le compte n'est ni suspendu ni mis en pause. Ce qui a coûté trois mois, ce n'était pas le dépassement : c'était la suspension du compte, sans canal de support et sans moyen d'agir depuis l'interface.

Pour surveiller la consommation réelle : `[observability] enabled = true` est actif dans `wrangler.toml`, les métriques sont dans le tableau de bord du Worker (onglet Metrics).

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

Corrigé dans `workerAdapter.mjs` : `context.params` est fusionné dans `req.query`, en l'emportant sur la query string comme le fait Vercel, et une route attrape-tout (`[[path]]`) voit son tableau joint par `/`.

La route `DELETE /api/nexus/tracked/:domain/:modId` masquait le problème : son handler retombe sur une extraction depuis le chemin quand la query est vide. Elle fonctionnait donc déjà — c'est le seul endroit où la panne n'aurait pas été visible.

### Tests de l'adaptateur

`api/utils/workerAdapter.mjs` est couvert par 34 assertions (statuts, en-têtes, `req.query`, `req.url`, casse des en-têtes de requête, `CF-Connecting-IP`, 429, handler qui lève, handler qui ne répond pas, double réponse, `params`). Le fichier de test n'est pas versionné ; le recréer au besoin, il ne dépend ni de wrangler ni du build — Node 24 fournit `Request`/`Response` en global.

## Reproduire la validation

```bash
npm install
npm run build
npx wrangler dev                # lit wrangler.toml, sert build/ + worker.mjs
```

Puis dérouler la liste sur `http://127.0.0.1:8788`.

---

## Steam : 403 sur les IP de sortie Cloudflare

Steam limite par IP, et les IP de sortie de Cloudflare sont mutualisées. Mesuré le 2026-09-18 : **une requête sur trois** repartait en `503 Steam API error: 403`, y compris avec 8 secondes entre les appels — ce n'est donc pas un effet du rythme de test.

Trois couches, posées dans cet ordre, de la moins efficace à la plus efficace :

| Couche | Où | Ce qu'elle apporte |
|---|---|---|
| Réessais ×3 (120 ms, 400 ms) | `api/steam/game/[appId].mjs` | Peu : les trois tentatives tapent la même IP en 500 ms |
| Cache mémoire + repli périmé | idem | **Rien en pratique** : `Map` par isolate, perdu au démarrage à froid |
| **Cache partagé + repli périmé** | `worker.mjs` | L'essentiel : Steam n'est plus appelé pendant 2 h par fiche |

**C'est la troisième qui règle le problème.** Après amorçage, 15 requêtes sur les cinq jeux du README passent toutes, servies par le cache (`X-Steam-Cache: hit`).

### En-têtes de diagnostic

- `X-Steam-Cache: hit | miss | stale` — d'où vient la réponse.
- `X-Steam-Age: <secondes>` — âge de l'entrée servie.
- `X-Steam-Stale: 1` — Steam a refusé, c'est la dernière valeur connue qui est servie.
- `X-Nexus-Games-Unresolved: <n>/<total>` — nombre de jeux dont le nom n'a pas pu être récupéré.
- `X-Nexus-Games-Reason: <domaine>:<raison>, …` — pourquoi, tronqué à 200 caractères.

Les deux derniers sont posés par `api/nexus/tracked.mjs` et exposés via
`Access-Control-Expose-Headers`. Ils sont enregistrés par le journal de diagnostic du navigateur,
donc présents dans l'export que l'utilisateur peut joindre à un rapport.

> [!] **Pourquoi ces deux-là existent.** Le 2026-09-19, l'interface a affiché `cyberpunk2077` et
> `fallout4` en minuscules, sans icône, à côté de « Baldur's Gate 3 ». Cause : `getGameInfo()`
> interroge `api.nexusmods.com/v1/games/<domain>.json` et, en cas d'échec, retombait sur
> `{ id: null, name: domain }`. Le slug étant une valeur *truthy* qui ressemble à un nom, **l'échec
> se déguisait en succès** : la requête `/api/nexus/tracked` répondait 200, rien n'était journalisé,
> et le seul symptôme était un nom qui avait l'air bizarre. Le repli ne porte plus de nom du tout
> (`name: null`, `resolu: false`) et l'échec remonte jusqu'au navigateur. **Une réponse 200 aux
> données dégradées est plus difficile à diagnostiquer qu'une erreur franche** — c'est ce que ces
> en-têtes corrigent.

### Ordre des appels à l'API Nexus

Les infos de jeu sont demandées **avant** l'enrichissement mod par mod, et non après.

Elles étaient réclamées en dernier, après un appel par mod suivi. Sur un compte qui suit beaucoup
de mods, le quota horaire Nexus est déjà largement consommé quand leur tour arrive — et ce sont
elles qui échouent, alors qu'elles ne coûtent que quelques requêtes et nomment tous les jeux de
l'interface. **Hypothèse non confirmée** faute de trace du statut renvoyé par Nexus au moment de
l'incident : c'est précisément ce que les en-têtes ci-dessus permettront de vérifier au prochain.

### Détails qui comptent

**La clé de cache ignore la query string.** Sans ça, un `?utm_source=…` ou un paramètre de cache-busting fragmenterait le cache et le rendrait inutile.

**Le cache vit dans `worker.mjs`, pas dans `api/`.** La mise en cache est propre à la plateforme ; `api/` doit rester utilisable par `server.mjs`. Même logique que pour l'adaptateur.

**Limité à `/api/steam/*`.** Les routes Nexus portent des données liées à des identifiants et sont marquées `private, no-store` : elles ne doivent pas être mises en cache.

**Le cache est propre à chaque centre de données Cloudflare**, pas global. Un cache réellement global demanderait Workers KV — un namespace à créer et des écritures facturées. À reprendre si le taux d'échec redevient gênant.
