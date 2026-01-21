/**
 * Serverless function pour récupérer les infos Steam d'un jeu
 * Endpoint: GET /api/steam/game/:appId
 * 
 * Utilise l'API publique de Steam (steamapi.xpaw.me) pour obtenir
 * les véritables Build IDs et dates de mise à jour.
 */

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

    // Méthode 1: Steam News API pour détecter les vraies mises à jour
    try {
      const newsUrl = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${appId}&count=20&maxlength=300&format=json`;
      const newsRes = await fetch(newsUrl);
      
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        if (newsData.appnews && newsData.appnews.newsitems && newsData.appnews.newsitems.length > 0) {
          const updateNews = newsData.appnews.newsitems.find(item => {
            const isOfficial = item.feedname === 'steam_community_announcements';
            const title = item.title.toLowerCase();
            const contents = (item.contents || '').toLowerCase();
            
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
          }
        }
      }
    } catch (newsError) {
      console.warn(`Steam News API failed for ${appId}:`, newsError.message);
    }

    // Méthode 2: SteamCMD pour Build ID
    try {
      const cmdUrl = `https://api.steamcmd.net/v1/info/${appId}`;
      const cmdRes = await fetch(cmdUrl);
      
      if (cmdRes.ok) {
        const cmdData = await cmdRes.json();
        
        if (cmdData.data && cmdData.data[appId]) {
          const appInfo = cmdData.data[appId];
          const branches = appInfo.depots?.branches;
          
          if (branches && branches.public) {
            buildId = branches.public.buildid || null;
            
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

    res.json({
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
    });
  } catch (error) {
    console.error(`Error fetching Steam data for ${appId}:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Internal server error" 
    });
  }
}
