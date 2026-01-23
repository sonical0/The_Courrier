import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "gameVersions";

export default function useGameVersions() {
  const [gameVersions, setGameVersions] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [updatedGames, setUpdatedGames] = useState([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameVersions));
    } catch (e) {
      console.error("Failed to save game versions:", e);
    }
  }, [gameVersions]);

  const checkForUpdates = useCallback((games) => {
    const updates = [];
    const newVersions = { ...gameVersions };

    for (const game of games) {
      const gameKey = game.domain || game.gameId || game.name;
      const currentVersion = game.version || game.gameVersion || null;
      
      if (!currentVersion) continue;

      const storedVersion = gameVersions[gameKey];

      if (storedVersion && storedVersion !== currentVersion) {
        // Version has changed!
        updates.push({
          gameKey,
          gameName: game.name || game.domain,
          gameId: game.gameId,
          gameDomain: game.domain,
          previousVersion: storedVersion,
          currentVersion: currentVersion,
          detectedAt: Date.now()
        });
      }

      // Update stored version
      newVersions[gameKey] = currentVersion;
    }

    if (Object.keys(newVersions).length !== Object.keys(gameVersions).length || 
        JSON.stringify(newVersions) !== JSON.stringify(gameVersions)) {
      setGameVersions(newVersions);
    }

    if (updates.length > 0) {
      setUpdatedGames(updates);
    }

    return updates;
  }, [gameVersions]);

  const dismissUpdate = useCallback((gameKey) => {
    setUpdatedGames(prev => prev.filter(g => g.gameKey !== gameKey));
  }, []);

  const dismissAllUpdates = useCallback(() => {
    setUpdatedGames([]);
  }, []);

  const clearHistory = useCallback(() => {
    setGameVersions({});
    setUpdatedGames([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    gameVersions,
    updatedGames,
    checkForUpdates,
    dismissUpdate,
    dismissAllUpdates,
    clearHistory
  };
}
