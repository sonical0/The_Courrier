
import { enforceRateLimit, LIMITS } from "../utils/rateLimit.mjs";
import { toEpoch, getCategoryName, withPool, sortVersionsSemantic } from "../utils/NexusUtils.mjs";

const CACHE = new Map();
const TTL = {
  tracked: 60_000,
  mod: 10 * 60_000,
  game: 24 * 60 * 60_000, // 24h pour les infos de jeux
};
const now = () => Date.now();
const kTracked = (username) => `tracked:${username}`;
const kMod = (username, domain, id) => `mod:${username}:${domain}:${id}`;
const kGame = (domain) => `game:${domain}`;

const cacheGet = (k) => {
  const e = CACHE.get(k);
  if (!e || now() > e.exp) {
    CACHE.delete(k);
    return null;
  }
  return e.val;
};
const cacheSet = (k, v, ttl) => CACHE.set(k, { val: v, exp: now() + ttl });

const nexusHeaders = (username, apiKey) => {
  const appName = (process.env.NEXUS_APP_NAME || "The Courrier").trim();
  const user = username || (process.env.NEXUS_USERNAME || "unknown").trim();
  const key = apiKey || (process.env.NEXUS_API_KEY || "").trim();
  return {
    apikey: key,
    "Application-Name": appName,
    "User-Agent": `${appName} (${user})`,
    Accept: "application/json",
  };
};

async function fetchJson(url, { headers }) {
  const r = await fetch(url, { headers });
  const txt = await r.text();
  if (!r.ok) {
    const msg = txt || r.statusText;
    const err = new Error(`HTTP ${r.status} — ${msg}`);
    err.status = r.status;
    throw err;
  }
  try {
    return JSON.parse(txt);
  } catch {
    throw new Error("Invalid JSON from Nexus API");
  }
}


async function getGameInfo(domain, username, apiKey) {
  const ck = kGame(domain);
  const cached = cacheGet(ck);
  if (cached) return cached;

  try {
    const gameInfo = await fetchJson(
      `https://api.nexusmods.com/v1/games/${domain}.json`,
      { headers: nexusHeaders(username, apiKey) }
    );
    const info = {
      id: gameInfo.id,
      name: gameInfo.name,
      domain: gameInfo.domain_name || domain,
      resolu: true,
    };
    cacheSet(ck, info, TTL.game);
    return info;
  } catch (error) {
    // Le repli portait `name: domain`, c'est-à-dire le slug — une valeur
    // truthy qui ressemble à un nom de jeu. Conséquence : l'échec se
    // déguisait en succès, écrasait au passage le vrai nom renvoyé par
    // l'endpoint des mods suivis (voir plus bas), et l'interface affichait
    // « cyberpunk2077 » sans que rien n'indique une panne.
    //
    // Désormais le nom reste NUL quand il n'a pas pu être résolu : c'est à
    // l'appelant de choisir un affichage de repli, en connaissance de cause.
    const echec = {
      id: null,
      name: null,
      domain: domain,
      resolu: false,
      raison: error?.status ? `HTTP ${error.status}` : error?.message || "inconnue",
    };

    // Échec mis en cache brièvement : assez pour ne pas marteler l'API amont
    // si elle nous limite, assez peu pour que le nom réapparaisse de lui-même
    // dès qu'elle redevient disponible.
    cacheSet(ck, echec, 5 * 60_000);
    return echec;
  }
}

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Nexus-Username, X-Nexus-ApiKey");
  // Sans cette ligne, un appel depuis une autre origine ne pourrait pas lire
  // les en-tetes de diagnostic — le navigateur les masque par defaut.
  res.setHeader("Access-Control-Expose-Headers", "X-Nexus-Games-Unresolved, X-Nexus-Games-Reason");
  // Reponse propre a un compte Nexus : jamais de cache partage en amont,
  // sinon la liste de mods d'un utilisateur serait servie a un autre.
  res.setHeader("Cache-Control", "private, no-store");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (enforceRateLimit(req, res, { scope: "nexus", ...LIMITS.nexus })) return;

  const username = req.headers["x-nexus-username"] || process.env.NEXUS_USERNAME;
  const apiKey = req.headers["x-nexus-apikey"] || process.env.NEXUS_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    return res.status(401).json({ error: "Missing Nexus API credentials. Please configure your username and API key." });
  }

  const hit = cacheGet(kTracked(username));
  if (hit) {
    return res.status(200).json(hit);
  }

  try {

    const tracked = await fetchJson(
      "https://api.nexusmods.com/v1/user/tracked_mods.json",
      { headers: nexusHeaders(username, apiKey) }
    );

    const rows = (Array.isArray(tracked) ? tracked : []).map((m) => {
      const id = m.mod_id ?? m.modId ?? m.id;
      const domain = m.domain_name ?? m.domain ?? m.game?.domain_name;
      return {
        id,
        domain,
        name: m.name ?? m.mod_name ?? m.title,
        version: m.version ?? m.mod_version,
        author: m.author ?? m.user?.name,
        picture: m.picture_url ?? m.thumbnail_url,
        updatedAt: toEpoch(
          m.updated_time ??
            m.updated_timestamp ??
            m.last_update ??
            m.last_updated ??
            m.uploaded_time
        ),
        url: m.url ?? m.mod_page_url,
        gameId: m.game_id ?? m.game?.id,
        gameName: m.game_name ?? m.game?.name,
      };
    }).filter((m) => m.id && m.domain);

    // Les infos de jeu sont demandées AVANT l'enrichissement mod par mod.
    //
    // Elles étaient réclamées en dernier, après un appel par mod suivi : sur un
    // compte qui en suit beaucoup, le quota horaire de l'API Nexus est déjà
    // consommé quand leur tour arrive, et ce sont elles qui échouent — quatre
    // requêtes qui coûtent peu mais qui nomment tous les jeux de l'interface.
    // Elles passent donc en premier, où elles sont quasi gratuites.
    const domainesUniques = [...new Set(rows.map((m) => m.domain).filter(Boolean))];
    const infosJeux = await Promise.all(
      domainesUniques.map((domain) => getGameInfo(domain, username, apiKey))
    );
    const jeuxParDomaine = new Map(infosJeux.map((g) => [g.domain, g]));
    const jeuxNonResolus = infosJeux.filter((g) => !g.resolu);

    const enriched = await withPool(rows, 4, async (m) => {
      const ck = kMod(username, m.domain, m.id);
      const modCache = cacheGet(ck);
      if (modCache) return { ...m, ...modCache };

      try {
        const details = await fetchJson(
          `https://api.nexusmods.com/v1/games/${m.domain}/mods/${m.id}.json`,
          { headers: nexusHeaders(username, apiKey) }
        );

        let changelog = [];
        let previousVersion = null;
        try {
          const changelogData = await fetchJson(
            `https://api.nexusmods.com/v1/games/${m.domain}/mods/${m.id}/changelogs.json`,
            { headers: nexusHeaders(username, apiKey) }
          );
          if (changelogData && typeof changelogData === 'object') {
            const versions = sortVersionsSemantic(Object.keys(changelogData));
            
            changelog = versions.slice(0, 3).map(version => ({
              version,
              changes: changelogData[version]
            }));
            if (versions.length > 1) {
              previousVersion = versions[1];
            }
          }
        } catch {

        }

        // Récupérer le nom de la catégorie
        const categoryName = getCategoryName(m.domain, details.category_id);

        const merged = {
          name: m.name || details.name || details.title,
          version: m.version || details.version || details.mod_version || details.latest_version,
          previousVersion: previousVersion,
          author: m.author || details.user?.name || details.uploader?.name,
          authorId: details.user?.member_id || details.uploader?.member_id || details.uploaded_by,
          category: categoryName,
          categoryId: details.category_id || null,
          picture:
            m.picture ||
            details.picture_url ||
            details.thumbnail_url ||
            details.content_preview_link ||
            null,
          updatedAt:
            m.updatedAt ||
            toEpoch(
              details.updated_timestamp ||
                details.last_updated ||
                details.latest_file_update ||
                details.created_time
            ),
          url:
            m.url ||
            details.url ||
            details.mod_page_url ||
            `https://www.nexusmods.com/${m.domain}/mods/${m.id}`,
          summary: details.summary || details.short_description || "",
          changelog: changelog,
          changelogUrl: `https://www.nexusmods.com/${m.domain}/mods/${m.id}?tab=logs`,
        };

        cacheSet(ck, merged, TTL.mod);
        return { ...m, ...merged };
      } catch {
        return {
          ...m,
          url: m.url || `https://www.nexusmods.com/${m.domain}/mods/${m.id}`,
        };
      }
    });

    enriched.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));

    const enrichedWithGames = enriched.map((m) => {
      const infoJeu = jeuxParDomaine.get(m.domain);
      return {
        ...m,
        gameId: m.gameId || infoJeu?.id,
        // L'ordre était inversé : l'info de jeu passait avant la donnée du mod,
        // donc un repli portant le slug écrasait un vrai nom. Le nom du mod
        // d'abord, l'info de jeu ensuite, le slug en dernier recours.
        gameName: m.gameName || infoJeu?.name || m.domain,
        // Permet au client de distinguer « ce jeu s'appelle vraiment comme ça »
        // de « on n'a pas pu récupérer son nom ».
        gameNameResolu: Boolean(m.gameName || infoJeu?.resolu),
      };
    });

    cacheSet(kTracked(username), enrichedWithGames, TTL.tracked);

    // Rendre l'échec visible depuis le navigateur : c'était l'angle mort. Le
    // journal de diagnostic ne trace que les appels navigateur → Worker, et
    // cette requête répond 200 même quand tous les noms de jeux manquent.
    if (jeuxNonResolus.length > 0) {
      res.setHeader(
        "X-Nexus-Games-Unresolved",
        `${jeuxNonResolus.length}/${domainesUniques.length}`
      );
      res.setHeader(
        "X-Nexus-Games-Reason",
        jeuxNonResolus.map((g) => `${g.domain}:${g.raison}`).join(", ").slice(0, 200)
      );
    }

    return res.status(200).json(enrichedWithGames);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || String(error) });
  }
}
