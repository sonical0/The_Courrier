# Spec : alertes avec condition de fin et Steam Workshop

Statut : brouillon validé le 2026-10-27, aucune implémentation. Origine : audit Stellaris (`stellaris-audit`, `known.json`).

## Pourquoi

- **Qui** : une communauté ouverte de joueurs-moddeurs, sans contrôle d'accès (décidé le 2026-10-27), dont l'auteur, qui suit des mods sur Nexus et gère aussi une collection de 144 mods Steam Workshop (Stellaris). Chaque utilisateur a ses propres mods, alertes et load orders : tout reste dans son navigateur.
- **Comportement actuel** : `src/pages/IncompatibilityPage.jsx` recalcule les conflits à chaque ouverture (catégorie, auteur, âge) et ne mémorise rien. `src/components/useModTags.js` ne stocke qu'un tag par mod (`courrier_mod_tags`, clé `domaine:id`). Les mods ne viennent que de Nexus (`api/nexus/tracked.mjs`) ; aucune mention de Workshop dans `api/`, `src/`, `worker.mjs`, `server.mjs`. Steam ne sert qu'à la version du jeu (`api/steam/game/[appId].mjs`).
- **Comportement voulu** : une alerte « à faire » porte une condition de fin lisible et se ferme d'elle-même quand la condition devient vraie ; des mods Steam Workshop apparaissent dans les mêmes listes que ceux de Nexus, avec leur source.
- **Pourquoi maintenant** : l'audit Stellaris a montré que la valeur est dans les actions à faire avec condition de fin, et la collection Stellaris vit sur le Workshop.
- **Fait quand** : voir les critères d'acceptation en fin de document.

## Périmètre

Hors périmètre :
- lecture des fichiers de mods et conflits de fichiers (reste dans `stellaris-audit`) ;
- import d'une collection Workshop entière (lot 3 possible plus tard) ;
- création automatique d'alertes, autres plateformes (ModDB, CurseForge), SteamDB (pas d'API officielle) ;
- toute donnée personnelle côté serveur : la base du lot 0b ne contient que des métadonnées publiques de jeux et de mods ;
- téléchargement ou installation de mods.

Systèmes touchés : `src/components/useModTags.js`, `src/components/useConfigBackup.js` (`BACKUP_KEYS`), `src/pages/IncompatibilityPage.jsx`, `src/pages/DashboardPage.jsx`, `src/components/useSteamGames.js` (`NEXUS_TO_STEAM_MAP`, ligne 5), `api/steam/`, `worker.mjs` et `server.mjs`.

Ordre : lot 0, puis lot 0b (socle de données), puis lot 1, puis lot 2. Le Workshop vient avant les alertes : sans mods Steam, les conditions n'ont rien à évaluer sur Stellaris.

## Flux de branches

- `main` est stable ; on n'y travaille pas directement.
- Chaque fonctionnalité vit sur une branche `feat/<nom>`, créée depuis `dev` (le `:` n'est pas permis dans un nom de branche Git ; une branche `dev/<nom>` est impossible tant que `dev` existe).
- `feat/<nom>` est fusionnée dans `dev` quand elle est stable.
- Un correctif vit sur une branche `fix/<nom>`, créée depuis `dev`, fusionnée comme une `feat/<nom>`.
- `dev` est fusionnée dans `main` quand elle est stable après fusion de toutes les branches `feat/<nom>` et `fix/<nom>`.
- Toutes les fusions se font avec `git merge --no-ff origin/<branche>`, message « Fusion de <branche> dans <base> ». Au moindre conflit : `git merge --abort`, la branche sort de la fusion et on le signale, sans résoudre à la place de son auteur.
- Le push vers `dev` ou `main` est un fast-forward, jamais `--force`. Avant de pousser : `origin/<base>` n'a pas bougé, et `git log origin/<base>..HEAD` ne contient que les commits des branches fusionnées et les fusions.
- `main` déclenche la mise en production Cloudflare : le push vers `main` n'a lieu qu'après validation explicite de l'utilisateur.
- Ce fonctionnement reprend celui de l'intégrateur de la supervision Tandem (`SKILLS/supervision/integrateur.md`) : une file de branches prêtes, fusion `--no-ff` dans l'ordre, un seul check complet, une seule validation de l'utilisateur avant le push.
- Contrôles décidés le 2026-10-27 : vers `dev`, check rapide (`test:ci`) sans validation de l'utilisateur ; vers `main`, check complet (`test:ci` + `build`) puis une seule validation de l'utilisateur avant le push.
- L'implémentation des lots 0 à 2 se fait avec la supervision Tandem (`npm run supervision -- the-courrier`, base `dev`) : `worker.mjs` et `server.mjs`, fichiers communs du bloc `supervision:`, passent par l'intégrateur D.
- Ce flux est aussi noté dans `README.md` (section « Branches »).
- Avant de créer une branche `feat/<nom>`, vérifier que `dev` n'est pas derrière `main` (`git rev-list --count origin/dev..origin/main`). Le 2026-10-27, `dev` était 26 commits derrière et a été avancée par fast-forward.

## Lot 0 : quels jeux suivis ont un Workshop ?

`NEXUS_TO_STEAM_MAP` donne déjà l'App ID Steam des jeux suivis sur Nexus. Le point d'accès de jeu n'indique pas si le jeu a un Workshop : ajouter une détection (un test `GetPublishedFileDetails` ou une requête `QueryFiles` sur l'App ID, qui renvoie des éléments ou non).

Livrable : la liste des jeux suivis marquée « Workshop : oui / non / inconnu », affichée dans l'interface. Elle décide où proposer le suivi d'un mod Workshop. Un échec de détection donne « inconnu », jamais « non ».

## Lot 0b : socle de données (PostgreSQL sur le homelab)

Décidé le 2026-10-27 : une base **PostgreSQL hébergée sur le homelab** (annoncé réparé par l'utilisateur ; état à confirmer avant de commencer) garde les données publiques des jeux et des mods, par source, pour une meilleure récolte et un historique.

- **Sources, dans cet ordre** : Steam Workshop (`GetPublishedFileDetails`), Steam jeux (builds et versions, déjà lus par `api/steam/game`), puis Nexus, **seulement après lecture des conditions de l'API Nexus** et avec une source non personnelle : les données récupérées avec la clé d'un utilisateur ne sont ni stockées ni servies aux autres. SteamDB est exclu.
- **Schéma** : `source`, `jeu`, `mod` (identifiant par source, titre, catégorie, auteur), `version`, et une table d'événements de mise à jour **ajoutée au fil du temps, jamais écrasée** (sorties, builds, dates). Un identifiant de source et un horodatage de collecte sur chaque ligne.
- **Collecte** : un collecteur tourne sur le homelab (planifié) et écrit dans PostgreSQL.
- **Lecture par le Worker** (décidé le 2026-10-27) : le homelab publie des instantanés en lecture seule vers Cloudflare (KV ou R2, à choisir au démarrage du lot 0b selon la taille) par connexion sortante ; le Worker existant (`worker.mjs`, et `server.mjs` en local) lit ces instantanés. Aucun port ouvert, pas de domaine, pas d'accès SQL depuis le Worker. Si le homelab tombe, le Worker sert la dernière donnée, marquée périmée. Un échec de lecture ne ressemble jamais à une donnée : `resolu: false` et repli sur valeur périmée (`X-Steam-Stale: 1`).
- **Hors de la base** : alertes, load orders et mods suivis d'un utilisateur restent dans son navigateur.
- **Contraintes** : le homelab n'est joignable que par le LAN et Tailscale, jamais depuis un Worker directement ; aucun port ouvert sur Internet sans décision explicite. Sauvegarde de la base à prévoir (la sauvegarde du homelab est cassée depuis le 16/08, selon la mémoire du projet : à vérifier).
- **Critère d'acceptation** : après une collecte, une requête SQL donne la date de dernière mise à jour d'un mod Workshop et l'historique de ses versions ; un redémarrage du collecteur ne crée ni doublon ni trou.

## Lot 1 : Steam Workshop (MVP)

- **Point d'accès** `GET /api/steam/workshop/:id`, appuyé sur `ISteamRemoteStorage/GetPublishedFileDetails` (POST amont, sans clé API). Renvoie : titre, dates de création et de mise à jour, taille, App ID du jeu, abonnés, auteur.
- **Où** : `worker.mjs` **et** `server.mjs`, la même logique des deux côtés (voir `DEPLOYMENT-cloudflare.md` : `server.mjs` réimplémente les handlers). Dans la table `URLPattern`, l'ordre compte : la route la plus spécifique d'abord.
- **Échecs** : jamais une 200 aux données dégradées. `resolu: false` et un statut honnête ; sur 403 ou 429, reprise ×3, repli sur valeur périmée (`X-Steam-Stale: 1`), puis 503. Cache serveur de 10 minutes (comme `TTL.mod` de Nexus), partagé entre utilisateurs (Cache API de Cloudflare, comme pour les jeux).
- **Exposition publique** : le point d'accès est ouvert à tous, sans compte. L'ID est validé (entier strictement numérique, longueur bornée) avant tout appel amont ; limite de débit par IP via `enforceRateLimit` (`api/utils/rateLimit.mjs`), plus stricte que celle de Nexus ; aucun en-tête ni donnée de l'utilisateur transmis à Steam ; seuls les champs utiles sont renvoyés.
- **Quotas** : surveiller les requêtes Workers (quota gratuit) et le taux de 403 Steam après mise en ligne ; un taux qui monte est un signal pour agir, pas pour retenter plus.
- **Stockage** : localStorage, clé `courrier_workshop_mods`, une entrée par mod `{id, appId, titre, maj, note}`. Pas de compte Steam, donc rien côté serveur.
- **Interface** : champ « Ajouter un mod Workshop » (ID ou URL) ; étiquette de source (Nexus / Workshop) sur chaque mod des listes ; badge de mise à jour fondé sur la date de mise à jour et le `seen_mods` existant.
- **Sauvegarde** : ajouter les nouvelles clés à `BACKUP_KEYS` de `useConfigBackup.js`, sinon elles sont perdues à l'export/import.

## Lot 2 : alertes avec condition de fin

- **Modèle** : `{id, titre, creeLe, conditions: [...], etat}`. Saisie à la main pour le MVP.
- **Conditions du MVP** : `modPresent {mod}` (le mod est dans la liste suivie, éventuellement à la bonne version) ; `modBefore {mod, avant}` (`mod` se charge avant `avant` dans le load order enregistré). « Mis à jour depuis la date X » seulement si c'est simple. Une condition ne vérifie que ce que the-courrier sait vérifier : présence dans la liste et ordre saisi.
- **Load order** : saisi à la main (liste ordonnée par jeu, réordonnable) ou importé. Formats : JSON `{ "mods": [{id|nom}...] }` ou export d'Irony (`ModNames` + `ModIds`) ; TXT, une ligne par mod dans l'ordre. Les entrées non reconnues sont listées à l'import, jamais ignorées en silence.
- **Évaluation** : à l'affichage, sans traitement en arrière-plan. Trois états : **terminée**, **en cours**, **indéterminée**. L'indéterminé s'affiche quand une donnée manque ou que Steam a échoué ; jamais « terminée » par défaut. L'état « terminée » est conservé, pas réécrit à chaque évaluation.
- **Interface** : section « À faire », alertes triées par état, chacune avec sa condition en clair et la raison de son état. Respecter les jetons `cr-*` (voir README) : ni `dark:`, ni `pico-card`, ni couleur Tailwind littérale. Gravité : le mot passe avant la teinte (comme dans `IncompatibilityPage.jsx`).
- **Sauvegarde** : les clés `courrier_alertes` et `courrier_loadorder` entrent aussi dans `BACKUP_KEYS`.

## Échecs et retour arrière

- Plusieurs utilisateurs partagent les mêmes IP de sortie de Cloudflare : le risque de 403 Steam augmente avec l'audience. Le cache partagé et le repli sur valeur périmée sont donc obligatoires, pas optionnels.
- Aucune donnée personnelle côté serveur : alertes, load orders et mods Workshop restent dans le navigateur ; l'import d'un load order est analysé côté navigateur, sans envoi au serveur.
- `main` est la production d'autres utilisateurs : une régression les touche, d'où la validation avant chaque push sur `main`.
- Steam refuse déjà certaines IP de sortie de Cloudflare (~1 requête sur 3 en 403 observé). Reprises et repli sur valeur périmée sont à tester sur le nouveau point d'accès.
- Un échec d'évaluation donne « indéterminée », jamais « terminée ».
- Le stockage client n'est pas partagé entre appareils ni entre utilisateurs : l'export/import JSON existe ; partager un load order ou des alertes par lien demanderait un stockage serveur (KV ou D1), hors MVP.
- Retour arrière : nouvelles clés localStorage uniquement, aucune migration des clés existantes ; retirer la fonctionnalité ne touche pas aux données actuelles.
- Un load order saisi ne reflète pas forcément l'ordre réel du jeu : `modBefore` vaut ce que vaut la liste saisie.

## Critères d'acceptation

- Lot 0 : la liste « Workshop oui/non/inconnu » s'affiche pour tous les jeux suivis.
- Lot 1 : l'ID d'un mod Workshop collé s'affiche avec sa date de mise à jour réelle ; un échec amont ne se confond pas avec un succès (`resolu: false`, pas de 200 trompeuse).
- Lot 2 : une alerte `modPresent` passe à « terminée » d'elle-même après l'ajout du mod et survit à un rechargement ; l'import d'un load order JSON et TXT rend le même ordre que le fichier.
- Tests unitaires verts (120 aujourd'hui) pour l'évaluation des conditions, le normaliseur Workshop et l'import. Grep sans `dark:`, `pico-card` ni couleur Tailwind littérale dans les pages.

## Questions ouvertes

- KV ou R2 pour les instantanés publiés par le homelab : à trancher au lot 0b selon la taille des données.
- Fréquence de collecte et de publication des instantanés : à fixer avec les limites de l'API Steam.
- Conditions de l'API Nexus : que permettent-elles côté stockage et redistribution des données ?

- Le MVP produit est-il convenable avec un stockage client seul ? À juger après le lot 2 (décision du 2026-10-27 : par utilisateur, côté navigateur).
- Partage d'un load order ou d'une liste d'alertes entre utilisateurs : hors MVP, à reconsidérer selon l'usage.
- Import d'une collection Workshop entière : lot 3 ou pas ?
- Génération automatique d'alertes (par exemple à partir de `known.json` de `stellaris-audit`) : à reconsidérer une fois la saisie manuelle éprouvée.
