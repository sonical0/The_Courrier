
import fetch from "node-fetch";

const CACHE = new Map();
const TTL = {
  tracked: 60_000,
  mod: 10 * 60_000,
  game: 24 * 60 * 60_000, // 24h pour les infos de jeux
};
const now = () => Date.now();
const kTracked = "tracked";
const kMod = (domain, id) => `mod:${domain}:${id}`;
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

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Nexus-Username, X-Nexus-ApiKey");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const username = req.headers["x-nexus-username"] || process.env.NEXUS_USERNAME;
  const apiKey = req.headers["x-nexus-apikey"] || process.env.NEXUS_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    return res.status(401).json({ error: "Missing Nexus API credentials. Please configure your username and API key." });
  }

  const hit = cacheGet(kTracked);
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

    const enriched = await withPool(rows, 4, async (m) => {
      const ck = kMod(m.domain, m.id);
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

    cacheSet(kTracked, enrichedWithGames, TTL.tracked);

    return res.status(200).json(enrichedWithGames);
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
}
