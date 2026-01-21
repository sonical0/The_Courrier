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

    // 2. SteamAPI (xpaw.me) pour les build IDs et dates réelles
    // Cette API publique parse les données de Steam
    let buildId = null;
    let lastUpdate = null;
    let version = null;

    try {
      const apiUrl = `https://api.steamcmd.net/v1/info/${appId}`;
      const apiRes = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'The-Courrier/1.0'
        }
      });
      
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        
        if (apiData.data && apiData.data[appId]) {
          const appInfo = apiData.data[appId];
          const depots = appInfo.depots;
          const branches = depots?.branches;
          
          // Utiliser la date de changement la plus récente disponible
          // 1. Essayer common.time_updated
          // 2. Sinon, utiliser branches.public.timeupdated
          if (appInfo.common && appInfo.common.time_updated) {
            const timestamp = parseInt(appInfo.common.time_updated);
            lastUpdate = timestamp > 9999999999 ? timestamp : timestamp * 1000;
          } else if (branches && branches.public && branches.public.timeupdated) {
            const timestamp = parseInt(branches.public.timeupdated);
            lastUpdate = timestamp > 9999999999 ? timestamp : timestamp * 1000;
          }
          
          // Build ID depuis la branche publique
          if (branches && branches.public) {
            buildId = branches.public.buildid || null;
            version = branches.public.description || null;
          }
        }
      }
    } catch (apiError) {
      console.warn(`SteamAPI fetch failed for ${appId}, using fallback:`, apiError.message);
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
