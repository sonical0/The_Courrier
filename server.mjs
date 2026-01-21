
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

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

// Mapping des catégories par jeu (domain -> { categoryId -> categoryName })
// Pour ajouter un nouveau jeu, voir ADDING_GAME_CATEGORIES.md
const CATEGORIES_BY_GAME = {
  skyrimspecialedition: {
    20: 'Skyrim Special Edition', 22: 'Buildings', 24: 'Gameplay', 25: 'Guilds/Factions',
    26: 'Body, Face, and Hair', 27: 'Items and Objects - Player', 28: 'Miscellaneous',
    29: 'Models and Textures', 33: 'NPC', 34: 'Races, Classes, and Birthsigns',
    35: 'Quests and Adventures', 36: 'Weapons and Armour', 39: 'Utilities', 40: 'Cheats and God items',
    42: 'User Interface', 43: 'Save Games', 51: 'Animation', 53: 'Cities, Towns, Villages, and Hamlets',
    54: 'Armour', 55: 'Weapons', 60: 'Clothing and Accessories', 62: 'Visuals and Graphics',
    65: 'Followers & Companions - Creatures', 67: 'Player homes', 73: 'Skills and Leveling',
    74: 'Environmental', 75: 'Magic - Spells & Enchantments', 76: 'Stealth', 77: 'Combat',
    78: 'Immersion', 79: 'Overhauls', 82: 'Modders Resources', 83: 'Creatures and Mounts',
    84: 'Patches', 85: 'Items and Objects - World', 88: 'Dungeons', 89: 'Locations - New',
    90: 'Locations - Vanilla', 92: 'Collectables, Treasure Hunts, and Puzzles',
    93: 'Magic - Gameplay', 94: 'Alchemy', 95: 'Bug Fixes', 96: 'Followers & Companions',
    97: 'Presets - ENB and ReShade', 100: 'Crafting', 103: 'Armour - Shields',
    104: 'Shouts', 108: 'VR', 110: 'Audio'
  },
  skyrim: {
    20: 'Skyrim', 22: 'Buildings', 24: 'Gameplay', 25: 'Guilds/Factions',
    26: 'Body, Face, and Hair', 27: 'Items and Objects - Player', 28: 'Miscellaneous',
    29: 'Models and Textures', 30: 'New Lands', 33: 'NPC', 34: 'Races, Classes, and Birthsigns',
    35: 'Quests and Adventures', 36: 'Weapons and Armour', 39: 'Utilities', 40: 'Cheats and God items',
    42: 'User Interface', 43: 'Save Games', 45: 'Videos and Trailers', 51: 'Animation',
    53: 'Cities, Towns, Villages, and Hamlets', 54: 'Armour', 55: 'Weapons', 58: 'Landscape Changes',
    60: 'Clothing', 61: 'Audio - SFX, Music, and Voice', 62: 'Visuals and Graphics',
    65: 'Followers and Companions - Creatures', 67: 'Player homes', 68: 'Castles, Palaces, Mansions, and Estates',
    69: 'Mercantiles (shops, stores, inns, taverns, etc)', 70: 'Forts, Ruins, and Abandoned Structures',
    73: 'Skills and Leveling', 74: 'Environmental', 75: 'Magic - Spells & Enchantments',
    76: 'Stealth', 77: 'Combat', 78: 'Immersion', 79: 'Overhauls', 82: 'Modders Resources and Tutorials',
    83: 'Creatures', 84: 'Patches', 85: 'Items and Objects - World', 88: 'Dungeons - New',
    89: 'Locations - New', 90: 'Locations - Vanilla', 91: 'Dungeons - Vanilla',
    92: 'Collectables, Treasure Hunts, and Puzzles', 93: 'Magic - Gameplay', 94: 'Alchemy',
    95: 'Bug Fixes', 96: 'Followers and Companions', 97: 'ENB Preset', 98: 'Books and Scrolls',
    99: 'NPC - Children', 100: 'Crafting', 101: 'Mounts', 102: 'Clothing - Jewelry',
    103: 'Armour - Shields', 104: 'Shouts', 114: 'Character Presets', 115: 'Audio', 116: 'Configuration'
  },
  baldursgate3: {
    1: 'Baldur\'s Gate 3', 2: 'Miscellaneous', 3: 'Character Customisation', 4: 'Visuals',
    5: 'Gameplay', 6: 'User Interface', 7: 'Utilities', 9: 'Audio', 10: 'Equipment',
    12: 'Classes', 13: 'Spells', 15: 'Races', 16: 'Dice', 17: 'Armor', 18: 'Animations',
    19: 'Quests', 20: 'Accessories', 21: 'Companions', 22: 'Weapons', 23: 'Clothing',
    24: 'Resources', 25: 'Maps', 26: 'Photo Mode'
  },
  cyberpunk2077: {
    1: 'Cyberpunk 2077', 2: 'Miscellaneous', 3: 'Armour and Clothing', 4: 'Audio',
    5: 'Characters', 6: 'Crafting', 7: 'Gameplay', 8: 'User Interface', 9: 'Utilities',
    10: 'Visuals and Graphics', 11: 'Weapons', 12: 'Modders Resources', 13: 'Appearance',
    14: 'Vehicles', 15: 'Animations', 16: 'Locations', 17: 'Scripts'
  },
  fallout4: {
    1: 'Fallout 4', 2: 'Miscellaneous', 3: 'Ammo', 4: 'Animation', 5: 'Armour', 6: 'Bug Fixes',
    7: 'Buildings', 8: 'Cheats and God items', 9: 'Clothing', 10: 'Collectibles, Treasure Hunts, and Puzzles',
    11: 'Companions', 12: 'Creatures', 13: 'ENB Presets', 14: 'Environment', 15: 'Gameplay',
    16: 'Factions', 17: 'Body, Face, and Hair', 18: 'Modders Resources and Tutorials',
    19: 'Models and Textures', 20: 'New Lands', 21: 'Locations - New', 22: 'NPC',
    23: 'NPC - Vendors', 24: 'Overhauls', 25: 'Patches', 26: 'Performance', 27: 'Perks',
    28: 'Player Homes', 29: 'Poses', 30: 'Quests and Adventures', 31: 'Radio', 32: 'Saved Games',
    33: 'Audio - SFX', 34: 'Audio - Music', 35: 'Audio - Misc', 36: 'Audio - Voice',
    37: 'User Interface', 38: 'Utilities', 39: 'Vehicles', 40: 'Visuals and Graphics',
    41: 'Weapons', 42: 'Weapons and Armour', 43: 'Items (Food, Drinks, Chems, etc)',
    44: 'Crafting - Equipment', 45: 'Crafting - Home/Settlement', 46: 'Skills and Leveling',
    47: 'Locations - Vanilla', 48: 'Player Settlement', 50: 'Crafting - Other',
    51: 'Immersion', 52: 'Pip-Boy', 53: 'Power Armour', 55: 'ReShade Presets',
    56: 'Weather and Lighting', 57: 'Tattoos', 58: 'Character Presets', 59: 'Videos and Trailers',
    61: 'Transfer Settlement Blueprints', 62: 'VR', 63: 'Sim Settlements', 68: 'Sim Settlements 2'
  }
};

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
  console.log("🗑️ Cache vidé");
  res.json({ success: true, message: "Cache vidé avec succès" });
});


app.get("/api/nexus/tracked", async (req, res) => {
  if (!ensureKey(req, res)) return;
  const { username, apiKey } = getCredentials(req);
  
  console.log('📥 Request received for tracked mods');

  const hit = cacheGet(kTracked(username));
  if (hit) {
    console.log('✅ Returning cached data');
    return res.json(hit);
  }

  console.log('🔄 Fetching fresh data from Nexus API');

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

      console.log(`📦 Fetching details for mod: ${m.name} (${m.domain}/${m.id})`);

      try {
        const details = await fetchJson(
          `https://api.nexusmods.com/v1/games/${m.domain}/mods/${m.id}.json`,
          { headers: nexusHeaders(username, apiKey) }
        );
        
        console.log(`✅ Got details for mod ${m.id}: ${details.name}`);

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

    // Méthode 1: Utiliser Steam Web API pour obtenir les vraies mises à jour du jeu
    try {
      // GetNewsForApp - Filtrer uniquement les annonces officielles de mise à jour
      const newsUrl = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${appId}&count=20&maxlength=300&format=json`;
      const newsRes = await fetch(newsUrl);
      
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        if (newsData.appnews && newsData.appnews.newsitems && newsData.appnews.newsitems.length > 0) {
          // Chercher uniquement les annonces de Steam (feedname: steam_community_announcements)
          // et qui mentionnent vraiment des mises à jour de jeu
          const updateNews = newsData.appnews.newsitems.find(item => {
            const isOfficial = item.feedname === 'steam_community_announcements';
            const title = item.title.toLowerCase();
            const contents = (item.contents || '').toLowerCase();
            
            // Mots-clés indiquant une vraie mise à jour de jeu
            const isGameUpdate = 
              title.includes('patch') && (title.includes('1.') || title.includes('2.') || title.includes('v1') || title.includes('v2')) ||
              contents.includes('changelog') ||
              contents.includes('bug fix') ||
              contents.includes('update is now live') ||
              contents.includes('version');
            
            return isOfficial && isGameUpdate;
          });
          
          if (updateNews && updateNews.date) {
            lastUpdate = updateNews.date * 1000;
            // Ne pas utiliser le titre comme version
            console.log(`📰 Found official update for ${appId} at ${new Date(lastUpdate).toISOString()}`);
          }
        }
      }
    } catch (newsError) {
      console.warn(`Steam News API failed for ${appId}:`, newsError.message);
    }

    // Méthode 2: SteamCMD pour Build ID (toujours nécessaire car Steam Web API ne l'expose pas)
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
          
          if (branches && branches.public) {
            buildId = branches.public.buildid || null;
            
            // Si on n'a pas trouvé de date via les news, utiliser SteamCMD comme fallback
            if (!lastUpdate) {
              if (appInfo.common && appInfo.common.time_updated) {
                const timestamp = parseInt(appInfo.common.time_updated);
                lastUpdate = timestamp > 9999999999 ? timestamp : timestamp * 1000;
              } else if (branches.public.timeupdated) {
                const timestamp = parseInt(branches.public.timeupdated);
                lastUpdate = timestamp > 9999999999 ? timestamp : timestamp * 1000;
              }
            }
            
            if (!version && branches.public.description) {
              version = branches.public.description;
            }
          }
          
          console.log(`✅ Combined Steam data for ${appId}:`, {
            buildId,
            version,
            lastUpdate,
            lastUpdateFormatted: lastUpdate ? new Date(lastUpdate).toISOString() : null,
            source: lastUpdate > (Date.now() - 365*24*60*60*1000) ? 'Steam News API (recent)' : 'SteamCMD (may be stale)'
          });
        }
      }
    } catch (cmdError) {
      console.warn(`SteamCMD API failed for ${appId}:`, cmdError.message);
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

    cacheSet(ck, result, 6 * 60 * 60_000); // 6 hours cache
    res.json(result);
  } catch (error) {
    console.error(`Error fetching Steam data for ${appId}:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Internal server error" 
    });
  }
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
