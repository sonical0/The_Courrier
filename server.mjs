
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEBUG = process.env.NODE_ENV === 'development';

const app = express();
app.use(cors());
app.use(express.json());

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

const getCredentials = (req) => {
  const username = req.headers["x-nexus-username"] || process.env.NEXUS_USERNAME;
  const apiKey = req.headers["x-nexus-apikey"] || process.env.NEXUS_API_KEY;
  return { username, apiKey };
};

const ensureKey = (req, res) => {
  const { apiKey } = getCredentials(req);
  if (!apiKey || !apiKey.trim()) {
    res.status(401).json({ error: "Missing Nexus API credentials. Please configure your username and API key." });
    return false;
  }
  return true;
};

async function fetchJson(url, { headers }) {
  const r = await fetch(url, { headers });
  const txt = await r.text();
  if (!r.ok) {
    const msg = txt || r.statusText;
    console.error(`❌ Nexus API Error ${r.status}:`, url, msg.substring(0, 200));
    throw new Error(`HTTP ${r.status} — ${msg}`);
  }
  try {
    return JSON.parse(txt);
  } catch {
    throw new Error("Invalid JSON from Nexus API");
  }
}

const toEpoch = (v) => {
  if (!v) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (!Number.isNaN(n) && n > 0) return n;
    const d = Date.parse(v);
    if (!Number.isNaN(d)) return Math.floor(d / 1000);
  }
  return 0;
};

// Import des catégories depuis le fichier JSON centralisé
// Pour ajouter un nouveau jeu, voir ADDING_GAME_CATEGORIES.md
const categoriesPath = path.join(__dirname, 'src', 'data', 'nexus-categories.json');
const CATEGORIES_BY_GAME = JSON.parse(readFileSync(categoriesPath, 'utf-8'));

// Récupère le nom d'une catégorie par son ID et le jeu
function getCategoryName(domain, categoryId) {
  if (!categoryId) return null;
  const gameCategories = CATEGORIES_BY_GAME[domain];
  if (!gameCategories) return null;
  return gameCategories[categoryId] || null;
}

async function withPool(items, limit, fn) {
  const ret = [];
  let i = 0;
  const workers = Array(Math.min(limit, items.length))
    .fill(0)
    .map(async () => {
      while (i < items.length) {
        const idx = i++;
        ret[idx] = await fn(items[idx], idx);
      }
    });
  await Promise.all(workers);
  return ret;
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
    };
    cacheSet(ck, info, TTL.game);
    return info;
  } catch (error) {

    const fallback = {
      id: null,
      name: domain,
      domain: domain,
    };

    cacheSet(ck, fallback, 5 * 60_000);
    return fallback;
  }
}

app.get("/api/nexus/validate", async (req, res) => {
  if (!ensureKey(req, res)) return;
  const { username, apiKey } = getCredentials(req);
  try {
    const data = await fetchJson("https://api.nexusmods.com/v1/users/validate.json", {
      headers: nexusHeaders(username, apiKey),
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.post("/api/nexus/clear-cache", (req, res) => {
  CACHE.clear();
  if (DEBUG) console.log("🗑️ Cache vidé (Nexus + Steam)");
  res.json({ success: true, message: "Cache vidé avec succès" });
});

app.post("/api/steam/clear-cache", (req, res) => {
  // Clear only Steam cache entries
  let cleared = 0;
  for (const key of CACHE.keys()) {
    if (key.startsWith('steam:')) {
      CACHE.delete(key);
      cleared++;
    }
  }
  if (DEBUG) console.log(`🗑️ ${cleared} entrées Steam supprimées du cache`);
  res.json({ success: true, message: `${cleared} entrées Steam supprimées`, cleared });
});


app.get("/api/nexus/tracked", async (req, res) => {
  if (!ensureKey(req, res)) return;
  const { username, apiKey } = getCredentials(req);
  
  if (DEBUG) console.log('📥 Request received for tracked mods');

  const hit = cacheGet(kTracked(username));
  if (hit) {
    if (DEBUG) console.log('✅ Returning cached data');
    return res.json(hit);
  }

  if (DEBUG) console.log('🔄 Fetching fresh data from Nexus API');

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
        updatedAt:
          toEpoch(
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

    const enriched = await withPool(rows, 4, async (m) => {
      const ck = kMod(username, m.domain, m.id);
      const modCache = cacheGet(ck);
      if (modCache) return { ...m, ...modCache };

      if (DEBUG) console.log(`📦 Fetching details for mod: ${m.name} (${m.domain}/${m.id})`);

      try {
        const details = await fetchJson(
          `https://api.nexusmods.com/v1/games/${m.domain}/mods/${m.id}.json`,
          { headers: nexusHeaders(username, apiKey) }
        );
        
        if (DEBUG) console.log(`✅ Got details for mod ${m.id}: ${details.name}`);

        let changelog = [];
        let previousVersion = null;
        try {
          const changelogData = await fetchJson(
            `https://api.nexusmods.com/v1/games/${m.domain}/mods/${m.id}/changelogs.json`,
            { headers: nexusHeaders(username, apiKey) }
          );

          if (changelogData && typeof changelogData === 'object') {
            // Tri sémantique des versions (1.13 > 1.12 > 1.9)
            const versions = Object.keys(changelogData).sort((a, b) => {
              const aParts = a.split('.').map(Number);
              const bParts = b.split('.').map(Number);
              for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                const aNum = aParts[i] || 0;
                const bNum = bParts[i] || 0;
                if (aNum !== bNum) return bNum - aNum;
              }
              return 0;
            });
            
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

        // Récupérer le nom de la catégorie (système dynamique + fallback statique)
        const categoryName = await getCategoryName(m.domain, details.category_id);

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
      } catch (err) {
        console.error(`❌ Error fetching details for ${m.name}:`, err.message);
        return {
          ...m,
          url: m.url || `https://www.nexusmods.com/${m.domain}/mods/${m.id}`,
        };
      }
    });

    enriched.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));

    const uniqueDomains = [...new Set(enriched.map(m => m.domain).filter(Boolean))];
    const gamesInfo = await Promise.all(
      uniqueDomains.map(domain => getGameInfo(domain, username, apiKey))
    );
    const gamesMap = new Map(gamesInfo.map(g => [g.domain, g]));

    const enrichedWithGames = enriched.map(m => {
      const gameInfo = gamesMap.get(m.domain);
      return {
        ...m,
        gameId: m.gameId || gameInfo?.id,
        gameName: gameInfo?.name || m.gameName,
      };
    });

    cacheSet(kTracked(username), enrichedWithGames, TTL.tracked);
    res.json(enrichedWithGames);
  } catch (e) {
    console.error('❌ Error fetching tracked mods:', e);
    res.status(500).json({ error: String(e.message || e) });
  }
});


app.delete("/api/nexus/tracked/:domain/:modId", async (req, res) => {
  if (!ensureKey(req, res)) return;
  const { username, apiKey } = getCredentials(req);
  
  const { domain, modId } = req.params;
  
  try {
    const response = await fetch(
      `https://api.nexusmods.com/v1/user/tracked_mods.json?domain_name=${domain}`,
      {
        method: "DELETE",
        headers: {
          ...nexusHeaders(username, apiKey),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mod_id: parseInt(modId, 10) }),
      }
    );
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}${text ? " — " + text : ""}`);
    }

    CACHE.delete(kTracked(username));
    CACHE.delete(kMod(username, domain, modId));
    
    res.json({ success: true, message: "Mod retiré de la liste suivie" });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// Steam API proxy endpoint
app.get("/api/steam/game/:appId", async (req, res) => {
  const { appId } = req.params;

  if (!appId || isNaN(appId)) {
    return res.status(400).json({ 
      success: false, 
      error: "Invalid Steam App ID" 
    });
  }

  const ck = `steam:${appId}`;
  const cached = cacheGet(ck);
  if (cached) {
    return res.json(cached);
  }

  try {
    // 1. Steam Store API pour les infos de base
    const storeUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
    const storeRes = await fetch(storeUrl);
    
    if (!storeRes.ok) {
      throw new Error(`Steam Store API error: ${storeRes.status}`);
    }

    const storeData = await storeRes.json();
    
    if (!storeData[appId] || !storeData[appId].success) {
      return res.status(404).json({ 
        success: false, 
        error: "Game not found on Steam" 
      });
    }

    const gameData = storeData[appId].data;

    // 2. Steam Web API officielle pour données en temps réel
    let buildId = null;
    let lastUpdate = null;
    let version = null;
    const steamApiKey = process.env.STEAM_API_KEY;

    // Méthode 1: SteamCMD pour Build ID et date (source primaire)
    try {
      const cmdUrl = `https://api.steamcmd.net/v1/info/${appId}`;
      const cmdRes = await fetch(cmdUrl, {
        headers: {
          'User-Agent': 'The-Courrier/1.0'
        }
      });
      
      if (cmdRes.ok) {
        const cmdData = await cmdRes.json();
        
        if (cmdData.data && cmdData.data[appId]) {
          const appInfo = cmdData.data[appId];
          const branches = appInfo.depots?.branches;
          const depots = appInfo.depots?.depots;
          
          // Chercher la date la plus récente dans les manifests des dépôts
          let newestManifestTime = 0;
          if (depots && typeof depots === 'object') {
            for (const depotId in depots) {
              const depot = depots[depotId];
              if (depot?.manifests?.public?.gid) {
                // Essayer d'extraire un timestamp du manifest
                const manifestGid = depot.manifests.public.gid;
                // Les manifests peuvent avoir des timestamps dans leurs métadonnées
                if (depot.manifests.public.lastupdate) {
                  const ts = parseInt(depot.manifests.public.lastupdate);
                  if (ts > newestManifestTime) newestManifestTime = ts;
                }
              }
            }
          }
          
          if (DEBUG) {
            console.log(`🔍 RAW SteamCMD data for ${appId}:`, {
              hasBranches: !!branches,
              hasPublicBranch: !!branches?.public,
              timeupdated: branches?.public?.timeupdated,
              buildid: branches?.public?.buildid,
              common_time_updated: appInfo.common?.time_updated,
              newestManifestTime: newestManifestTime || 'none found'
            });
          }
          
          if (branches && branches.public) {
            buildId = branches.public.buildid || null;
            
            // Priorité 1: Plus récent entre manifest et branch timeupdated
            const branchTime = branches.public.timeupdated ? parseInt(branches.public.timeupdated) : 0;
            const manifestTime = newestManifestTime;
            
            const useTime = Math.max(branchTime, manifestTime);
            
            if (useTime > 0) {
              lastUpdate = useTime > 9999999999 ? useTime : useTime * 1000;
              if (DEBUG) console.log(`✅ Using ${useTime === branchTime ? 'branch' : 'manifest'} time: ${new Date(lastUpdate).toISOString()}`);
            }
            // Fallback: common.time_updated
            else if (appInfo.common && appInfo.common.time_updated) {
              const timestamp = parseInt(appInfo.common.time_updated);
              lastUpdate = timestamp > 9999999999 ? timestamp : timestamp * 1000;
              if (DEBUG) console.log(`✅ Using common.time_updated: ${new Date(lastUpdate).toISOString()}`);
            }
            
            if (!version && branches.public.description) {
              version = branches.public.description;
            }
          }
          
          if (DEBUG) {
            console.log(`✅ SteamCMD data for ${appId}:`, {
              buildId,
              version,
              lastUpdate,
              lastUpdateFormatted: lastUpdate ? new Date(lastUpdate).toISOString() : null,
            });
          }
        }
      }
    } catch (cmdError) {
      if (DEBUG) console.warn(`SteamCMD API failed for ${appId}:`, cmdError.message);
    }

    // Méthode 2: Steam News API comme source complémentaire (pas de remplacement si déjà trouvé)
    if (!lastUpdate) {
      try {
        const newsUrl = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${appId}&count=10&maxlength=300&format=json`;
        const newsRes = await fetch(newsUrl);
        
        if (newsRes.ok) {
          const newsData = await newsRes.json();
          if (newsData.appnews && newsData.appnews.newsitems && newsData.appnews.newsitems.length > 0) {
            // Prendre la date de la news la plus récente
            const latestNews = newsData.appnews.newsitems[0];
            if (latestNews && latestNews.date) {
              lastUpdate = latestNews.date * 1000;
              if (DEBUG) console.log(`📰 Using latest news date for ${appId}: ${new Date(lastUpdate).toISOString()}`);
            }
          }
        }
      } catch (newsError) {
        if (DEBUG) console.warn(`Steam News API failed for ${appId}:`, newsError.message);
      }
    }

    // Fallback: si on n'a pas pu obtenir les vraies infos
    if (!buildId || !lastUpdate) {
      const releaseDate = gameData.release_date?.date;
      lastUpdate = releaseDate ? new Date(releaseDate).getTime() : Date.now();
      buildId = `${lastUpdate}`;
    }

    const result = {
      success: true,
      appId: parseInt(appId),
      name: gameData.name,
      buildId: buildId,
      version: version || "Not available",
      lastUpdate: lastUpdate,
      releaseDate: gameData.release_date?.date || null,
      shortDescription: gameData.short_description || "",
      headerImage: gameData.header_image || null,
      developers: gameData.developers || [],
      publishers: gameData.publishers || [],
    };

    cacheSet(ck, result, 2 * 60 * 60_000); // 2 hours cache (réduit de 6h)
    res.json(result);
  } catch (error) {
    console.error(`Error fetching Steam data for ${appId}:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Internal server error" 
    });
  }
});

const clientBuild = path.join(__dirname, "build");
app.use(express.static(clientBuild));
app.get("*", (_req, res) => {
  try {
    res.sendFile(path.join(clientBuild, "index.html"));
  } catch {
    res.status(404).send("Not Found");
  }
});

const port = Number(process.env.PORT || 4000);
const masked = (process.env.NEXUS_API_KEY || "").trim().slice(0, 4).padEnd(12, "*");
app.listen(port, () => {
  console.log(`Proxy server listening on port ${port} — key:${masked}`);
});
