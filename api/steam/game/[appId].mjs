/**
 * Serverless function pour récupérer les infos Steam d'un jeu
 * Endpoint: GET /api/steam/game/:appId
 * 
 * Utilise l'API publique de Steam (steamapi.xpaw.me) pour obtenir
 * les véritables Build IDs et dates de mise à jour.
 */

const CACHE = new Map();
const TTL = 2 * 60 * 60_000; // 2 hours
const now = () => Date.now();

const cacheGet = (k) => {
  const e = CACHE.get(k);
  if (!e || now() > e.exp) {
    CACHE.delete(k);
    return null;
  }
  return e.val;
};
const cacheSet = (k, v, ttl) => CACHE.set(k, { val: v, exp: now() + ttl });

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

  const { appId } = req.query;

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
    res.json(result);
  } catch (error) {
    console.error(`Error fetching Steam data for ${appId}:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Internal server error" 
    });
  }
}
