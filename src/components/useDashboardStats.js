import { useMemo } from "react";

export default function useDashboardStats(games, modsForGame) {
  return useMemo(() => {
    if (!games || games.length === 0) {
      return null;
    }

    // Collect all mods across all games
    const allMods = [];
    const modsByGame = new Map();
    const modsByAuthor = new Map();
    const modsByCategory = new Map();

    for (const game of games) {
      const key = game.domain || game.gameId || game.name;
      const gameMods = modsForGame(key);
      
      modsByGame.set(game.name || game.domain, gameMods);
      allMods.push(...gameMods);

      // Count by author
      for (const mod of gameMods) {
        if (mod.author) {
          modsByAuthor.set(mod.author, (modsByAuthor.get(mod.author) || 0) + 1);
        }
        if (mod.category) {
          modsByCategory.set(mod.category, (modsByCategory.get(mod.category) || 0) + 1);
        }
      }
    }

    const now = Math.floor(Date.now() / 1000);
    const oneYearAgo = now - (365 * 24 * 3600);
    const thirtyDaysAgo = now - (30 * 24 * 3600);
    const sevenDaysAgo = now - (7 * 24 * 3600);

    // Calculate statistics
    const totalMods = allMods.length;
    const totalGames = games.length;

    // Recent updates
    const updatesLast7Days = allMods.filter(m => Number(m.updatedAt || 0) >= sevenDaysAgo).length;
    const updatesLast30Days = allMods.filter(m => Number(m.updatedAt || 0) >= thirtyDaysAgo).length;

    // Stale mods (not updated in 1+ year)
    const staleMods = allMods.filter(m => Number(m.updatedAt || 0) < oneYearAgo);

    // Most recently updated mod
    const sortedByUpdate = [...allMods].sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
    const mostRecentMod = sortedByUpdate[0] || null;

    // Oldest mod (longest time since update)
    const oldestMod = sortedByUpdate[sortedByUpdate.length - 1] || null;

    // Game with most mods
    let mostActiveGame = null;
    let mostActiveGameCount = 0;
    let leastActiveGame = null;
    let leastActiveGameCount = Infinity;

    for (const [gameName, gameMods] of modsByGame.entries()) {
      if (gameMods.length > mostActiveGameCount) {
        mostActiveGameCount = gameMods.length;
        mostActiveGame = { name: gameName, count: gameMods.length };
      }
      if (gameMods.length < leastActiveGameCount) {
        leastActiveGameCount = gameMods.length;
        leastActiveGame = { name: gameName, count: gameMods.length };
      }
    }

    // Top authors (top 5)
    const topAuthors = Array.from(modsByAuthor.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([author, count]) => ({ author, count }));

    // Top categories (top 5)
    const topCategories = Array.from(modsByCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    // Game distribution
    const gameDistribution = Array.from(modsByGame.entries())
      .map(([gameName, gameMods]) => ({
        name: gameName,
        count: gameMods.length,
        percentage: totalMods > 0 ? Math.round((gameMods.length / totalMods) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate average days between updates (for mods with updates)
    let totalDaysSinceUpdate = 0;
    let modsWithUpdates = 0;
    for (const mod of allMods) {
      const updatedAt = Number(mod.updatedAt || 0);
      if (updatedAt > 0) {
        const daysSince = Math.floor((now - updatedAt) / (24 * 3600));
        totalDaysSinceUpdate += daysSince;
        modsWithUpdates++;
      }
    }
    const avgDaysSinceUpdate = modsWithUpdates > 0 ? Math.round(totalDaysSinceUpdate / modsWithUpdates) : 0;

    // Update timeline (last 30 days, grouped by week)
    const timeline = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = now - ((i + 1) * 7 * 24 * 3600);
      const weekEnd = now - (i * 7 * 24 * 3600);
      const weekMods = allMods.filter(m => {
        const updated = Number(m.updatedAt || 0);
        return updated >= weekStart && updated < weekEnd;
      });
      timeline.unshift({
        label: i === 0 ? "Cette semaine" : i === 1 ? "Semaine dernière" : `Il y a ${i + 1} semaines`,
        count: weekMods.length
      });
    }

    // Games with recent updates (last 7 days)
    const gamesWithUpdates = [];
    for (const game of games) {
      const key = game.domain || game.gameId || game.name;
      const gameMods = modsForGame(key);
      const recentMods = gameMods.filter(m => Number(m.updatedAt || 0) >= sevenDaysAgo);
      
      if (recentMods.length > 0) {
        // Find the most recent update for this game
        const mostRecentInGame = recentMods.sort((a, b) => 
          Number(b.updatedAt || 0) - Number(a.updatedAt || 0)
        )[0];
        
        gamesWithUpdates.push({
          gameId: game.gameId,
          gameName: game.name || game.domain,
          gameDomain: game.domain,
          updateCount: recentMods.length,
          totalMods: gameMods.length,
          mostRecentMod: mostRecentInGame,
          recentMods: recentMods.slice(0, 5) // Top 5 most recent
        });
      }
    }
    
    // Sort by most recent update
    gamesWithUpdates.sort((a, b) => 
      Number(b.mostRecentMod.updatedAt || 0) - Number(a.mostRecentMod.updatedAt || 0)
    );

    return {
      totalMods,
      totalGames,
      updatesLast7Days,
      updatesLast30Days,
      staleMods: staleMods.length,
      staleModsList: staleMods.slice(0, 10), // Top 10 oldest mods
      mostRecentMod,
      oldestMod,
      mostActiveGame,
      leastActiveGame,
      topAuthors,
      topCategories,
      gameDistribution,
      avgDaysSinceUpdate,
      timeline,
      gamesWithUpdates,
    };
  }, [games, modsForGame]);
}
