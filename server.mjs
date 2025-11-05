// server.mjs
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

// ---------- Cache ----------
const CACHE = new Map();
// TTL route validate court, mods plus long
const TTL = {
  tracked: 60_000,
  mod: 10 * 60_000,
};
const now = () => Date.now();
const kTracked = "tracked";
const kMod = (domain, id) => `mod:${domain}:${id}`;

const cacheGet = (k) => {
  const e = CACHE.get(k);
  if (!e || now() > e.exp) {
    CACHE.delete(k);
    return null;
  }
  return e.val;
};
const cacheSet = (k, v, ttl) => CACHE.set(k, { val: v, exp: now() + ttl });

// ---------- Nexus headers ----------
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

// ---------- Utils ----------
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

// Pool de promesses simple pour limiter la concurrence
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

// ---------- Routes ----------
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

/**
 * Enrichit les mods trackés avec les infos détaillées:
 * name, version, author, picture_url, updated_timestamp, url
 */
app.get("/api/nexus/tracked", async (req, res) => {
  if (!ensureKey(req, res)) return;
  const { username, apiKey } = getCredentials(req);

  // 1) cache global court pour la liste brute
  const hit = cacheGet(kTracked);
  if (hit) return res.json(hit);

  try {
    // 2) récup liste des mods suivis
    const tracked = await fetchJson(
      "https://api.nexusmods.com/v1/user/tracked_mods.json",
      { headers: nexusHeaders(username, apiKey) }
    );

    // 3) normalise id/domain et prépare la liste à enrichir
    const rows = (Array.isArray(tracked) ? tracked : []).map((m) => {
      const id = m.mod_id ?? m.modId ?? m.id;
      const domain = m.domain_name ?? m.domain ?? m.game?.domain_name;
      return {
        id,
        domain,
        // champs éventuellement déjà fournis par l’API tracked
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

    // 4) enrichissement par appel /games/{domain}/mods/{id} avec pool=4 + cache par mod
    const enriched = await withPool(rows, 4, async (m) => {
      const ck = kMod(m.domain, m.id);
      const modCache = cacheGet(ck);
      if (modCache) return { ...m, ...modCache };

      try {
        const details = await fetchJson(
          `https://api.nexusmods.com/v1/games/${m.domain}/mods/${m.id}.json`,
          { headers: nexusHeaders(username, apiKey) }
        );

        // Récupération du changelog
        let changelog = [];
        let previousVersion = null;
        try {
          const changelogData = await fetchJson(
            `https://api.nexusmods.com/v1/games/${m.domain}/mods/${m.id}/changelogs.json`,
            { headers: nexusHeaders(username, apiKey) }
          );
          // Prendre les 3 dernières versions du changelog
          if (changelogData && typeof changelogData === 'object') {
            const versions = Object.keys(changelogData).sort().reverse();
            changelog = versions.slice(0, 3).map(version => ({
              version,
              changes: changelogData[version]
            }));
            // La version précédente est la deuxième dans la liste
            if (versions.length > 1) {
              previousVersion = versions[1];
            }
          }
        } catch {
          // Changelog non disponible
        }

        const merged = {
          name: m.name || details.name || details.title,
          version: m.version || details.version || details.mod_version || details.latest_version,
          previousVersion: previousVersion,
          author: m.author || details.user?.name || details.uploader?.name,
          authorId: details.user?.member_id || details.uploader?.member_id || details.uploaded_by,
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
        // en cas d’échec d’enrichissement, on garde la base + URL reconstruite
        return {
          ...m,
          url: m.url || `https://www.nexusmods.com/${m.domain}/mods/${m.id}`,
        };
      }
    });

    // 5) tri par date décroissante
    enriched.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));

    // 6) cache 60s et renvoi
    cacheSet(kTracked, enriched, TTL.tracked);
    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

/**
 * Retire un mod de la liste des mods suivis
 */
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
    
    // Invalide le cache
    CACHE.delete(kTracked);
    CACHE.delete(kMod(domain, modId));
    
    res.json({ success: true, message: "Mod retiré de la liste suivie" });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// ---------- Static (prod) ----------
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

// ---------- Start ----------
const port = Number(process.env.PORT || 4000);
const masked = (process.env.NEXUS_API_KEY || "").trim().slice(0, 4).padEnd(12, "*");
app.listen(port, () => {
  console.log(`Proxy server listening on port ${port} — key:${masked}`);
});
