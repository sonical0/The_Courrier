import { useEffect, useState, useCallback } from "react";

// Mapping Nexus Mods domain -> Steam App ID
// Source: https://store.steampowered.com/
const NEXUS_TO_STEAM_MAP = {
  skyrimspecialedition: 489830,
  skyrim: 72850,
  fallout4: 377160,
  fallout3: 22300,
  falloutnv: 22380,
  fallout76: 1151340,
  oblivion: 22330,
  morrowind: 22320,
  cyberpunk2077: 1091500,
  witcher3: 292030,
  witcher2: 20920,
  witcher: 20900,
  baldursgate3: 1086940,
  darksouls3: 374320,
  darksouls: 211420,
  eldenring: 1245620,
  stardewvalley: 413150,
  terraria: 105600,
  valheim: 892970,
  nomanssky: 275850,
  subnautica: 264710,
  minecraft: null, // Not on Steam (Java Edition)
  dragonage: 17450,
  dragonageinquisition: 1222690,
  masseffect: 17460,
  masseffect2: 24980,
  masseffect3: 1238020,
  starfield: 1716740,
};

// Clé de stockage localStorage
const STORAGE_KEY = "steamGameVersions";

/**
 * Hook pour gérer les versions Steam des jeux suivis sur Nexus Mods
 */
export default function useSteamGames(games = []) {
  const [steamData, setSteamData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Charger les versions stockées depuis localStorage
  const loadStoredVersions = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error("Erreur lors du chargement des versions Steam:", e);
      return {};
    }
  }, []);

  // Sauvegarder les versions dans localStorage
  const saveVersions = useCallback((versions) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
    } catch (e) {
      console.error("Erreur lors de la sauvegarde des versions Steam:", e);
    }
  }, []);

  // Récupérer les informations d'un jeu Steam
  const fetchSteamGameInfo = useCallback(async (appId) => {
    try {
      // Utiliser notre proxy API pour éviter les problèmes CORS
      const res = await fetch(`/api/steam/game/${appId}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      
      if (!data.success) {
        throw new Error("Steam API returned no data");
      }

      return {
        appId,
        name: data.name,
        buildId: data.buildId || null,
        lastUpdate: data.lastUpdate || Date.now(),
        version: data.version || "Unknown",
      };
    } catch (e) {
      console.error(`Erreur Steam API pour appId ${appId}:`, e);
      return null;
    }
  }, []);

  // Vérifier les mises à jour et générer des alertes
  const checkForUpdates = useCallback((newData, storedVersions) => {
    const newAlerts = [];
    
    Object.keys(newData).forEach((domain) => {
      const current = newData[domain];
      const stored = storedVersions[domain];
      
      if (stored && current && stored.buildId && current.buildId) {
        if (stored.buildId !== current.buildId) {
          newAlerts.push({
            id: `${domain}-${Date.now()}`,
            domain,
            gameName: current.name,
            oldVersion: stored.version,
            newVersion: current.version,
            oldBuildId: stored.buildId,
            newBuildId: current.buildId,
            timestamp: Date.now(),
          });
        }
      }
    });
    
    return newAlerts;
  }, []);

  // Supprimer une alerte
  const dismissAlert = useCallback((alertId) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  // Supprimer toutes les alertes
  const dismissAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Fetcher les données Steam pour tous les jeux
  const fetchAllSteamData = useCallback(async () => {
    if (!games || games.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const storedVersions = loadStoredVersions();
      const newData = {};
      
      // Filtrer les jeux qui ont un mapping Steam
      const gamesWithSteam = games.filter((g) => {
        const domain = g.domain || g.key;
        return domain && NEXUS_TO_STEAM_MAP[domain];
      });

      // Fetcher les infos Steam en parallèle (limité à 5 requêtes simultanées)
      const batchSize = 5;
      for (let i = 0; i < gamesWithSteam.length; i += batchSize) {
        const batch = gamesWithSteam.slice(i, i + batchSize);
        const promises = batch.map((g) => {
          const domain = g.domain || g.key;
          const appId = NEXUS_TO_STEAM_MAP[domain];
          return fetchSteamGameInfo(appId).then((info) => ({
            domain,
            info,
          }));
        });

        const results = await Promise.all(promises);
        results.forEach(({ domain, info }) => {
          if (info) {
            newData[domain] = info;
          }
        });
      }

      // Vérifier les mises à jour
      const newAlerts = checkForUpdates(newData, storedVersions);
      if (newAlerts.length > 0) {
        setAlerts((prev) => [...prev, ...newAlerts]);
      }

      // Sauvegarder les nouvelles données
      saveVersions(newData);
      setSteamData(newData);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [games, loadStoredVersions, saveVersions, fetchSteamGameInfo, checkForUpdates]);

  // Auto-fetch au montage et quand les jeux changent
  useEffect(() => {
    fetchAllSteamData();
  }, [fetchAllSteamData]);

  // Obtenir les infos Steam pour un domaine donné
  const getSteamInfo = useCallback(
    (domain) => {
      return steamData[domain] || null;
    },
    [steamData]
  );

  // Obtenir le Steam App ID pour un domaine
  const getSteamAppId = useCallback((domain) => {
    return NEXUS_TO_STEAM_MAP[domain] || null;
  }, []);

  return {
    steamData,
    loading,
    error,
    alerts,
    getSteamInfo,
    getSteamAppId,
    dismissAlert,
    dismissAllAlerts,
    refresh: fetchAllSteamData,
  };
}
