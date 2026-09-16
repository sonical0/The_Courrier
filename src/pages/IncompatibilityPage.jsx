import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
export default function IncompatibilityPage() {
  const { loading, error, games, modsForGame } = useOutletContext();
  const [selectedGame, setSelectedGame] = useState("ALL");
  const [showDetails, setShowDetails] = useState({});

  // Analyser les mods pour détecter les incompatibilités potentielles
  const conflicts = useMemo(() => {
    const result = [];
    const gamesToCheck = selectedGame === "ALL" ? games : games.filter(g => {
      const key = g.domain || g.gameId || g.name;
      return key === selectedGame;
    });

    for (const game of gamesToCheck) {
      const key = game.domain || game.gameId || game.name;
      const mods = modsForGame(key);

      // Vérifier les conflits de catégories (plusieurs mods dans des catégories qui devraient être uniques)
      const categoryConflicts = detectCategoryConflicts(mods, game);
      
      // Vérifier les conflits d'auteur (mods similaires du même auteur)
      const authorConflicts = detectAuthorConflicts(mods, game);
      
      // Vérifier les versions obsolètes
      const outdatedVersions = detectOutdatedVersions(mods, game);

      if (categoryConflicts.length > 0 || authorConflicts.length > 0 || outdatedVersions.length > 0) {
        result.push({
          game: game.name || game.domain,
          gameData: game,
          categoryConflicts,
          authorConflicts,
          outdatedVersions,
        });
      }
    }

    return result;
  }, [games, modsForGame, selectedGame]);

  // Détecter les conflits de catégories potentiellement incompatibles
  function detectCategoryConflicts(mods, game) {
    const conflicts = [];
    const criticalCategories = [
      'Overhauls',
      'Combat',
      'Gameplay',
      'User Interface',
      'Visuals and Graphics',
      'ENB Preset',
      'Presets - ENB and ReShade',
      'ReShade Presets',
    ];

    const categorizedMods = {};
    
    mods.forEach(mod => {
      const category = mod.category || 'Uncategorized';
      if (criticalCategories.some(c => category.includes(c))) {
        if (!categorizedMods[category]) {
          categorizedMods[category] = [];
        }
        categorizedMods[category].push(mod);
      }
    });

    Object.entries(categorizedMods).forEach(([category, modsInCategory]) => {
      if (modsInCategory.length > 1) {
        conflicts.push({
          type: 'category',
          category,
          mods: modsInCategory,
          severity: 'medium',
          message: `${modsInCategory.length} mods dans la catégorie "${category}" peuvent entrer en conflit`,
        });
      }
    });

    return conflicts;
  }

  // Détecter les mods similaires du même auteur (probablement incompatibles entre eux)
  function detectAuthorConflicts(mods, game) {
    const conflicts = [];
    const authorMods = {};

    mods.forEach(mod => {
      const author = mod.author || 'Unknown';
      if (!authorMods[author]) {
        authorMods[author] = [];
      }
      authorMods[author].push(mod);
    });

    Object.entries(authorMods).forEach(([author, modsFromAuthor]) => {
      if (modsFromAuthor.length > 1) {
        // Vérifier si les noms sont similaires (possibles variantes)
        const names = modsFromAuthor.map(m => m.name.toLowerCase());
        const hasSimilarNames = names.some((name, i) => 
          names.slice(i + 1).some(otherName => 
            name.includes(otherName.substring(0, 10)) || 
            otherName.includes(name.substring(0, 10))
          )
        );

        if (hasSimilarNames) {
          conflicts.push({
            type: 'author',
            author,
            mods: modsFromAuthor,
            severity: 'high',
            message: `Plusieurs variantes de mods du même auteur (${author}) détectées`,
          });
        }
      }
    });

    return conflicts;
  }

  // Détecter les versions très anciennes (possibles incompatibilités avec des mods récents)
  function detectOutdatedVersions(mods, game) {
    const conflicts = [];
    const now = Math.floor(Date.now() / 1000);
    const sixMonthsAgo = now - (6 * 30 * 24 * 3600);
    const oneYearAgo = now - (365 * 24 * 3600);

    const veryOldMods = mods.filter(m => {
      const updatedAt = Number(m.updatedAt || 0);
      return updatedAt > 0 && updatedAt < oneYearAgo;
    });

    const recentMods = mods.filter(m => {
      const updatedAt = Number(m.updatedAt || 0);
      return updatedAt >= sixMonthsAgo;
    });

    if (veryOldMods.length > 0 && recentMods.length > 0) {
      conflicts.push({
        type: 'version',
        oldMods: veryOldMods,
        recentMods: recentMods,
        severity: 'low',
        message: `${veryOldMods.length} mod(s) ancien(s) (>1 an) avec ${recentMods.length} mod(s) récent(s) (<6 mois)`,
      });
    }

    return conflicts;
  }

  const toggleDetails = (gameIndex, conflictIndex) => {
    const key = `${gameIndex}-${conflictIndex}`;
    setShowDetails(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-500';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-500';
      case 'low': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-500';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 border-slate-500';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return 'ℹ️';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">Analyse en cours…</p>
      </div>
    );
  }

  if (error) {
    if (error.includes("credentials") || error.includes("401")) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="pico-card p-6 border-yellow-500 dark:border-yellow-600">
            <h4 className="text-xl font-bold text-yellow-800 dark:text-yellow-300 mb-2">
              ⚠️ Configuration requise
            </h4>
            <p className="text-slate-700 dark:text-slate-300 mb-3">
              Vous devez configurer vos identifiants Nexus Mods pour utiliser cette fonctionnalité.
            </p>
            <hr className="my-3 border-slate-200 dark:border-slate-700" />
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Cliquez sur le bouton <strong>⚙️ Config</strong> dans la barre de navigation pour configurer vos identifiants.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="pico-card p-6 border-red-500 dark:border-red-600">
          <h4 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">❌ Erreur</h4>
          <p className="text-slate-700 dark:text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!games.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="pico-card p-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
              🔍 Vérificateur d'Incompatibilités
            </h3>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              Cette page analyse vos mods suivis pour détecter d'éventuelles incompatibilités.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                <strong>🎯 Pour commencer :</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300 ml-2">
                <li>Activez le suivi sur vos mods favoris sur Nexus Mods</li>
                <li>Revenez ici pour voir l'analyse automatique</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          🔍 Vérificateur d'Incompatibilités
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Analyse automatique des conflits potentiels entre vos mods
        </p>
      </div>

      <div className="mb-6 max-w-md">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Filtrer par jeu
        </label>
        <select
          className="pico-select"
          value={selectedGame}
          onChange={(e) => setSelectedGame(e.target.value)}
        >
          <option value="ALL">🎮 Tous les jeux</option>
          {games.map((g) => (
            <option key={g.key} value={g.domain || g.gameId || g.name}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {conflicts.length === 0 ? (
        <div className="pico-card p-6 border-green-500 dark:border-green-600">
          <h4 className="text-xl font-bold text-green-800 dark:text-green-300 mb-2">
            ✅ Aucun conflit détecté
          </h4>
          <p className="text-slate-700 dark:text-slate-300">
            Vos mods semblent compatibles entre eux. Bonne partie !
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Note : Cette analyse est automatique et peut ne pas détecter tous les conflits possibles. 
            Consultez toujours les pages de mods pour les incompatibilités connues.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {conflicts.map((gameConflict, gameIndex) => (
            <div key={gameIndex} className="pico-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-2xl font-semibold text-slate-800 dark:text-white">
                  {gameConflict.game}
                </h3>
                {gameConflict.gameData?.gameId && (
                  <img 
                    src={`https://staticdelivery.nexusmods.com/Images/games/4_3/tile_${gameConflict.gameData.gameId}.jpg`}
                    alt={`${gameConflict.game} icon`}
                    className="w-10 h-10 rounded object-cover border-2 border-slate-300 dark:border-slate-600"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
              </div>

              <div className="space-y-4">
                {[...gameConflict.categoryConflicts, ...gameConflict.authorConflicts, ...gameConflict.outdatedVersions].map((conflict, conflictIndex) => {
                  const key = `${gameIndex}-${conflictIndex}`;
                  const isOpen = showDetails[key];

                  return (
                    <div key={conflictIndex} className={`border-2 rounded-lg p-4 ${getSeverityColor(conflict.severity)}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{getSeverityIcon(conflict.severity)}</span>
                            <h4 className="text-lg font-semibold">
                              {conflict.severity === 'high' ? 'Conflit probable' : 
                               conflict.severity === 'medium' ? 'Attention recommandée' : 
                               'Information'}
                            </h4>
                          </div>
                          <p className="text-sm mb-2">{conflict.message}</p>
                        </div>
                        <button
                          onClick={() => toggleDetails(gameIndex, conflictIndex)}
                          className="px-3 py-1 bg-white dark:bg-slate-800 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                        >
                          {isOpen ? '▼ Masquer' : '▶ Détails'}
                        </button>
                      </div>

                      {isOpen && (
                        <div className="mt-4 pt-4 border-t border-current/20">
                          {conflict.type === 'category' && (
                            <div>
                              <p className="text-sm font-medium mb-2">Mods concernés :</p>
                              <ul className="space-y-2">
                                {conflict.mods.map((mod, idx) => (
                                  <li key={idx} className="flex items-center gap-2 text-sm">
                                    <span className="w-2 h-2 bg-current rounded-full"></span>
                                    <a
                                      href={mod.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="hover:underline font-medium"
                                    >
                                      {mod.name}
                                    </a>
                                    <span className="text-xs opacity-75">par {mod.author}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {conflict.type === 'author' && (
                            <div>
                              <p className="text-sm font-medium mb-2">Mods du même auteur :</p>
                              <ul className="space-y-2">
                                {conflict.mods.map((mod, idx) => (
                                  <li key={idx} className="flex items-center gap-2 text-sm">
                                    <span className="w-2 h-2 bg-current rounded-full"></span>
                                    <a
                                      href={mod.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="hover:underline font-medium"
                                    >
                                      {mod.name}
                                    </a>
                                    <span className="text-xs opacity-75">v{mod.version}</span>
                                  </li>
                                ))}
                              </ul>
                              <p className="text-xs mt-2 opacity-75">
                                💡 Vérifiez les descriptions pour savoir si ces mods sont des alternatives ou complémentaires.
                              </p>
                            </div>
                          )}

                          {conflict.type === 'version' && (
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-medium mb-2">Mods anciens (&gt;1 an) :</p>
                                <ul className="space-y-1">
                                  {conflict.oldMods.slice(0, 5).map((mod, idx) => (
                                    <li key={idx} className="text-sm flex items-center gap-2">
                                      <span className="w-2 h-2 bg-current rounded-full"></span>
                                      <a href={mod.url} target="_blank" rel="noreferrer" className="hover:underline">
                                        {mod.name}
                                      </a>
                                      <span className="text-xs opacity-75">
                                        ({new Date(Number(mod.updatedAt) * 1000).toLocaleDateString()})
                                      </span>
                                    </li>
                                  ))}
                                  {conflict.oldMods.length > 5 && (
                                    <li className="text-xs opacity-75 ml-4">
                                      ...et {conflict.oldMods.length - 5} autre(s)
                                    </li>
                                  )}
                                </ul>
                              </div>
                              <p className="text-xs opacity-75">
                                💡 Les mods anciens peuvent être incompatibles avec les versions récentes du jeu ou d'autres mods.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 pico-card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h4 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-2">
          📝 Notes importantes
        </h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
          <li>Cette analyse est automatique et ne remplace pas la lecture des pages de mods</li>
          <li>Consultez toujours la section "Requirements" et "Incompatibilities" sur Nexus Mods</li>
          <li>Certains mods peuvent avoir des patches de compatibilité disponibles</li>
          <li>L'ordre de chargement (load order) est crucial pour certains types de mods</li>
          <li>Utilisez des outils comme LOOT (Skyrim/Fallout) pour gérer l'ordre de chargement</li>
        </ul>
      </div>
    </div>
  );
}
