/**
 * Serverless function pour récupérer les infos Steam d'un jeu
 * Endpoint: GET /api/steam/game/:appId
 * 
 * Utilise l'API publique de Steam (steamapi.xpaw.me) pour obtenir
 * les véritables Build IDs et dates de mise à jour.
 */

import { enforceRateLimit, LIMITS } from "../../utils/rateLimit.mjs";

const CACHE = new Map();
const TTL = 2 * 60 * 60_000; // 2 hours
const PRUNE_THRESHOLD = 500;
const now = () => Date.now();

const cacheGet = (k) => {
  const e = CACHE.get(k);
  if (!e || now() > e.exp) return null;
  return e.val;
};

/**
 * Valeur perimee, conservee volontairement.
 *
 * L'API Steam renvoie par intermittence des 403 sur les IP de sortie mutualisees
 * (environ une requete sur trois depuis Cloudflare, mesure le 2026-09-18, alors
 * qu'un appel direct depuis un poste passe). Plutot que de rendre une erreur
 * quand Steam refuse, on ressert la derniere valeur connue : un Build ID vieux
 * de quelques heures vaut infiniment mieux qu'un 500 pour l'utilisateur.
 *
 * L'entree n'est donc plus supprimee a l'expiration — d'ou la purge ci-dessous,
 * pour qu'une longue serie d'appId distincts ne fasse pas grossir la Map.
 */
const cacheGetStale = (k) => CACHE.get(k)?.val ?? null;

const cacheSet = (k, v, ttl) => {
  if (CACHE.size > PRUNE_THRESHOLD) {
    const cutoff = now() - TTL; // au-dela, meme perimee, la valeur n'a plus d'interet
    for (const [key, e] of CACHE) if (e.exp < cutoff) CACHE.delete(key);
  }
  CACHE.set(k, { val: v, exp: now() + ttl });
};

/**
 * `fetch` avec reessais sur les erreurs transitoires de Steam.
 *
 * 403 et 429 sont de la limitation de debit cote Steam, 5xx de l'indisponibilite :
 * dans les trois cas un nouvel essai a de bonnes chances de passer. Les autres
 * codes (404 notamment) sont definitifs et rendus tels quels, sans attente.
 *
 * Les delais restent courts : le budget CPU d'un Worker est de 10 ms, mais
 * l'attente reseau n'est pas du CPU — c'est la latence percue par l'utilisateur
 * qui borne, pas la plateforme.
 */
const TRANSIENT = new Set([403, 429, 500, 502, 503, 504]);

async function fetchSteam(url, { tries = 3, delays = [120, 400] } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok || !TRANSIENT.has(r.status)) return r;
      last = new Error(`Steam API error: ${r.status}`);
    } catch (e) {
      last = e; // panne reseau : meme traitement qu'un 5xx
    }
    if (i < tries - 1) await new Promise((r) => setTimeout(r, delays[i] ?? 400));
  }
  throw last;
}

const DEBUG = process.env.NODE_ENV === 'development';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (enforceRateLimit(req, res, { scope: "steam", ...LIMITS.steam })) return;

  const { appId } = req.query;

  if (!appId || isNaN(appId)) {
    return res.status(400).json({ 
      success: false, 
      error: "Invalid Steam App ID" 
    });
  }

  // Donnees publiques indexees par appId seul : cacheables par le CDN Vercel.
  // Le cache memoire ci-dessous ne survit pas a un cold start, alors que
  // s-maxage fait servir les appels suivants par l'Edge sans reveiller la
  // fonction — donc sans invocation facturee.
  const setPublicCache = () =>
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=7200, stale-while-revalidate=86400"
    );

  const ck = `steam:${appId}`;
  const cached = cacheGet(ck);
  if (cached) {
    setPublicCache();
    return res.json(cached);
  }

  try {
    // 1. Steam Store API pour les infos de base
    const storeUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
    // Seul appel dont depend toute la reponse : c'est celui qui merite des
    // reessais. SteamCMD et les actualites, plus bas, sont deja facultatifs et
    // enveloppes dans leur propre try/catch.
    const storeRes = await fetchSteam(storeUrl);

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

    cacheSet(ck, result, TTL);
    setPublicCache();
    res.json(result);
  } catch (error) {
    console.error(`Error fetching Steam data for ${appId}:`, error);

    // Steam a refuse malgre les reessais. Si on a deja servi ce jeu, on ressert
    // la derniere valeur connue plutot qu'une erreur : les donnees changent au
    // rythme des patchs, quelques heures d'age sont sans consequence.
    const stale = cacheGetStale(ck);
    if (stale) {
      res.setHeader("X-Steam-Stale", "1");
      // Cache court : on veut retenter Steam bientot, sans marteler.
      res.setHeader("Cache-Control", "public, s-maxage=300");
      return res.json(stale);
    }

    // Aucune valeur de repli. 503 et non 500 : le service amont est
    // indisponible, l'application n'est pas en faute — et un 503 dit au client
    // que reessayer a un sens, ce qu'un 500 ne dit pas.
    res.setHeader("Retry-After", "60");
    res.setHeader("Cache-Control", "public, s-maxage=30");
    return res.status(503).json({
      success: false,
      error: error.message || "Steam est temporairement indisponible",
      retryAfter: 60,
    });
  }
}
