# The Courrier — guide pour agents IA

SPA React 19 qui suit les mises à jour de mods Nexus Mods et les versions de jeux Steam.
Aucune base de données : l'état vit dans le navigateur ou dans le cache mémoire du serveur.
Les identifiants sont fournis par l'utilisateur et stockés chiffrés dans son `localStorage` —
ils ne sont jamais persistés côté serveur.

> Ce fichier décrivait une architecture Vercel jusqu'au 2026-09-19 et renvoyait à un
> `vercel.json` supprimé du dépôt. L'hébergement est **Cloudflare Workers** depuis le 2026-09-18.

## Architecture

### Front

- **Pages** : `src/pages/` — `DashboardPage`, `ActuUpdatePage`, `NexusModsPage`,
  `IncompatibilityPage`, plus `NotFoundPage` et `RouteErrorPage`.
- **Toute la logique est dans des hooks** `src/components/use*.js`, jamais dans le JSX :
  `useNexusMods` (appels API et normalisation), `useNexusCredentials` (multi-comptes chiffrés),
  `useDashboardStats`, `useSteamGames`, `useModTags`, `useLastVisit`, `useNotifications`,
  `useConfigBackup`, `useTheme`.
- **Composants** : uniquement de l'affichage.

### Back

- **Production** : `worker.mjs` (Cloudflare Workers) porte la table de routes `URLPattern`,
  le rate limiting et le cache Steam partagé. Il appelle les handlers de `api/` via
  `api/utils/workerAdapter.mjs`.
- **Développement** : `server.mjs` (Express, port 4000, `npm run server`).
- **Handlers** : `api/nexus/{tracked,untrack,validate}.mjs`, `api/steam/game/[appId].mjs`.
  Ils gardent la signature Node `handler(req, res)` — héritage conservé volontairement, parce
  que `server.mjs` s'en sert aussi. **Ne pas les « moderniser » en handlers Fetch.**
- **Authentification** : les handlers lisent `X-Nexus-Username` / `X-Nexus-ApiKey`, avec repli
  sur les variables d'environnement.

## Le piège principal : `server.mjs` réimplémente les routes

`server.mjs` **ne réutilise pas** `api/nexus/tracked.mjs` : il en redéfinit sa propre version
(≈150 lignes). Seuls les utilitaires sont partagés, via `api/utils/NexusUtils.mjs`
(`toEpoch`, `getCategoryName`, `withPool`, `sortVersionsSemantic`) et `api/utils/rateLimit.mjs`.

**Toute modification de la logique de `api/nexus/tracked.mjs` doit être reportée dans
`server.mjs`, et inversement.** Le 2026-09-19, un correctif n'a été appliqué qu'à la version de
production : le serveur de dev a continué pendant plusieurs heures à produire des données
différentes de la prod, sans que rien ne le signale.

Blocs à garder synchronisés :

1. `getGameInfo()` — et notamment son repli d'échec, qui ne doit **jamais** porter le slug
   comme nom (voir plus bas)
2. `nexusHeaders(username, apiKey)`
3. L'ordre des appels : infos de jeu **avant** l'enrichissement mod par mod
4. La fusion `gameName: m.gameName || infoJeu?.name || m.domain`
5. Les en-têtes de diagnostic `X-Nexus-Games-*`
6. Le tri sémantique des versions de changelog

Les catégories, elles, sont centralisées dans `src/data/nexus-categories.json` et ne demandent
aucune synchronisation.

## Règle apprise : un échec ne doit pas ressembler à une donnée

`getGameInfo()` retombait sur `{ id: null, name: domain }` quand l'API Nexus refusait. Le slug
étant une valeur *truthy* qui ressemble à un nom de jeu, l'interface affichait `cyberpunk2077`
et la requête répondait 200 : **la panne était indiscernable d'un succès**.

Le repli porte désormais `name: null`, `resolu: false` et une `raison`, et l'échec remonte au
navigateur via `X-Nexus-Games-Unresolved` / `X-Nexus-Games-Reason`, captés par le journal de
diagnostic (`src/components/diagnostics.js`).

**Généralisation à appliquer partout : une réponse 200 aux données dégradées coûte plus cher à
diagnostiquer qu'une erreur franche.** Un repli doit être marqué comme tel.

## Style d'interface : la couche de jetons `cr-*`

Depuis la refonte du 2026-09-19, tout passe par les jetons définis dans `src/index.css`
(`--cr-ground`, `--cr-surface`, `--cr-ink`, `--cr-muted`, `--cr-accent`, `--cr-ok` / `--cr-warn`
/ `--cr-crit`) et par des classes de composants (`cr-bouton`, `cr-etiquette`, `cr-mod`,
`cr-chiffre`, `cr-filtre`, `cr-jeu-icone`, `cr-depeche`, `cr-transition`…).

1. **Aucun `dark:`, aucun `pico-card`, aucune couleur Tailwind littérale** dans `src/pages/` ni
   `src/components/`. Le thème sombre redéfinit les jetons ; il ne double pas chaque règle.
2. **Aucun état porté par la seule couleur** : une étiquette contient un mot écrit. Pas d'emoji
   en guise d'icône — un lecteur d'écran ne les lit pas, une impression N&B les perd.
3. **14 px minimum pour le texte, 44 px pour toute cible tactile.**

Le thème a trois états — `systeme` (défaut), `light`, `dark` — dans `useTheme.js`.

## Tests

`npm test` — 120 tests, 13 suites, React Testing Library. À lancer **en entier** avant de
déclarer un travail terminé : un build qui compile ne dit rien des régressions.

Une assertion ne doit pas porter sur une classe de style. Pour vérifier un état, utiliser un
attribut (`data-etat`) ou un rôle, jamais `toHaveClass("text-green-700")`.

## Développement local

```bash
npm install
npm run server   # Express sur le port 4000
npm start        # React, proxy /api vers 4000
```

## Pièges connus

- React Router v7 : importer depuis `react-router-dom`.
- Rate limit Nexus : 100 requêtes/heure sur un compte gratuit — d'où l'importance de l'ordre
  des appels décrit plus haut.
- Steam limite les IP de sortie Cloudflare : ~1 requête sur 3 en 403. Traité par réessais,
  cache partagé et repli sur valeur périmée dans `worker.mjs`.
- Clés `localStorage` : `nexus_accounts` (chiffré AES-GCM), `courrier_mods_cache_<user>`
  (compressé lz-string), `theme`, `courrier_last_visit`, `courrier_diagnostics`.
- Identifiants de jeu : utiliser `domain` (chaîne) pour les appels API, `gameId` (nombre)
  uniquement pour l'URL des tuiles d'illustration.

## Documentation à tenir à jour

- **`CHANGELOG.md` à chaque changement de code**, entrée en tête, format
  `## Version X.Y.Z - Description (JJ Mois AAAA)`.
- `README.md` si le changement est visible par l'utilisateur.
- `DEPLOYMENT-cloudflare.md` pour tout ce qui touche à l'hébergement, au rate limiting ou aux
  en-têtes de diagnostic.
- `CREDENTIALS_CONFIG.md` pour la gestion des identifiants.
- `ADDING_GAME_CATEGORIES.md` pour le système de catégories.

Pas d'emoji dans les fichiers `.md`, les commentaires de code ni les messages de commit.
