import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import useDashboardStats from "../components/useDashboardStats";
import useLastVisit from "../components/useLastVisit";
import useGameVersions from "../components/useGameVersions";

export default function DashboardPage() {
  const { loading, error, games, modsForGame, refresh } = useOutletContext();
  const { updateLastVisit } = useLastVisit();
  const stats = useDashboardStats(games, modsForGame);
  const { updatedGames, checkForUpdates, dismissUpdate, dismissAllUpdates } = useGameVersions();

  useEffect(() => {
    const timer = setTimeout(() => updateLastVisit(), 2000);
    return () => clearTimeout(timer);
  }, [updateLastVisit]);

  useEffect(() => {
    if (games && games.length > 0) {
      checkForUpdates(games);
    }
  }, [games, checkForUpdates]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">Chargement du tableau de bord…</p>
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
              👋 Bienvenue sur The Courrier !
            </h3>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              <strong>The Courrier</strong> vous permet de suivre facilement les mises à jour de vos mods Nexus Mods préférés.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                <strong>🎯 Pour voir vos mods apparaître ici :</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300 ml-2">
                <li>Rendez-vous sur <a href="https://www.nexusmods.com" target="_blank" rel="noreferrer" className="text-pico-primary hover:underline">Nexus Mods</a></li>
                <li>Connectez-vous avec votre compte</li>
                <li>Activez le suivi ("Track") sur les mods qui vous intéressent</li>
                <li>Revenez ici pour voir les mises à jour</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const StatCard = ({ title, value, subtitle, icon, color = "blue" }) => (
    <div className={`pico-card p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {icon && <span className="text-3xl opacity-50">{icon}</span>}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
          📊 Tableau de bord
        </h2>
        <button className="pico-btn-outline w-fit" onClick={refresh}>
          🔄 Rafraîchir
        </button>
      </div>

      {/* Game Version Updates Alert */}
      {updatedGames && updatedGames.length > 0 && (
        <section className="mb-8">
          <div className="pico-card p-6 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎮</span>
                <div>
                  <h3 className="text-xl font-bold text-orange-800 dark:text-orange-300">
                    Mise à jour de jeu détectée !
                  </h3>
                  <p className="text-sm text-orange-700 dark:text-orange-400">
                    {updatedGames.length} jeu{updatedGames.length > 1 ? 'x ont' : ' a'} reçu une mise à jour de version
                  </p>
                </div>
              </div>
              <button
                onClick={dismissAllUpdates}
                className="px-3 py-1 rounded bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 hover:bg-orange-300 dark:hover:bg-orange-700 transition-colors text-sm"
              >
                Tout masquer
              </button>
            </div>
            
            <div className="space-y-3">
              {updatedGames.map((game, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-orange-200 dark:border-orange-800"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {game.gameId && (
                      <img 
                        src={`https://staticdelivery.nexusmods.com/Images/games/4_3/tile_${game.gameId}.jpg`}
                        alt={game.gameName}
                        className="w-12 h-12 rounded object-cover border-2 border-orange-300 dark:border-orange-600"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 dark:text-white mb-1">
                        {game.gameName}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded line-through">
                          v{game.previousVersion}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className="px-2 py-0.5 bg-orange-500 text-white rounded font-medium">
                          v{game.currentVersion}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        ⚠️ Vérifiez la compatibilité de vos mods
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissUpdate(game.gameKey)}
                    className="ml-4 px-3 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm"
                  >
                    Masquer
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 rounded text-sm text-orange-800 dark:text-orange-300">
              💡 <strong>Conseil :</strong> Les mises à jour de jeux peuvent nécessiter des mises à jour de certains mods (SKSE, F4SE, etc.). 
              Vérifiez les mods essentiels de votre liste.
            </div>
          </div>
        </section>
      )}

      {/* Core Statistics */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Vue d'ensemble</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Mods suivis"
            value={stats.totalMods}
            icon="📦"
            color="blue"
          />
          <StatCard
            title="Jeux"
            value={stats.totalGames}
            icon="🎮"
            color="purple"
          />
          <StatCard
            title="Mises à jour (7 jours)"
            value={stats.updatesLast7Days}
            subtitle={`${stats.updatesLast30Days} sur 30 jours`}
            icon="🆕"
            color="green"
          />
          <StatCard
            title="Mods inactifs (1 an+)"
            value={stats.staleMods}
            subtitle={`${Math.round((stats.staleMods / stats.totalMods) * 100)}% du total`}
            icon="⏳"
            color="yellow"
          />
        </div>
      </section>

      {/* Games with Recent Updates */}
      {stats.gamesWithUpdates && stats.gamesWithUpdates.length > 0 && (
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
            🎮 Jeux avec mises à jour récentes (7 derniers jours)
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {stats.gamesWithUpdates.map((game, idx) => (
              <div key={idx} className="pico-card p-6 border-l-4 border-green-500">
                <div className="flex items-start gap-4 mb-4">
                  {game.gameId && (
                    <img 
                      src={`https://staticdelivery.nexusmods.com/Images/games/4_3/tile_${game.gameId}.jpg`}
                      alt={game.gameName}
                      className="w-16 h-16 rounded object-cover border-2 border-slate-300 dark:border-slate-600"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                      {game.gameName}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {game.updateCount} mise{game.updateCount > 1 ? 's' : ''} à jour
                      </span>
                      {' · '}
                      {game.totalMods} mod{game.totalMods > 1 ? 's' : ''} suivi{game.totalMods > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {game.recentMods.map((mod, modIdx) => (
                    <div 
                      key={modIdx}
                      className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                          {mod.name || `Mod ${mod.id}`}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(Number(mod.updatedAt) * 1000).toLocaleDateString()} · v{mod.version || '?'}
                        </p>
                      </div>
                      <a
                        href={mod.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-pico-primary hover:underline ml-2 flex-shrink-0"
                      >
                        Voir →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Activité récente</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Recent Mod */}
          {stats.mostRecentMod && (
            <div className="pico-card p-6">
              <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">
                ✨ Dernière mise à jour
              </h4>
              <div className="flex items-start gap-4">
                {stats.mostRecentMod.picture && (
                  <img
                    src={stats.mostRecentMod.picture}
                    alt={stats.mostRecentMod.name}
                    className="w-20 h-20 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-bold text-slate-800 dark:text-white mb-1">
                    {stats.mostRecentMod.name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    par {stats.mostRecentMod.author || "Auteur inconnu"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {new Date(Number(stats.mostRecentMod.updatedAt) * 1000).toLocaleString()}
                  </p>
                  <a
                    href={stats.mostRecentMod.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-pico-primary hover:underline mt-2 inline-block"
                  >
                    Voir sur Nexus →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Oldest Mod */}
          {stats.oldestMod && (
            <div className="pico-card p-6">
              <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">
                🕰️ Plus ancien
              </h4>
              <div className="flex items-start gap-4">
                {stats.oldestMod.picture && (
                  <img
                    src={stats.oldestMod.picture}
                    alt={stats.oldestMod.name}
                    className="w-20 h-20 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-bold text-slate-800 dark:text-white mb-1">
                    {stats.oldestMod.name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    par {stats.oldestMod.author || "Auteur inconnu"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Dernière maj: {new Date(Number(stats.oldestMod.updatedAt) * 1000).toLocaleDateString()}
                  </p>
                  <a
                    href={stats.oldestMod.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-pico-primary hover:underline mt-2 inline-block"
                  >
                    Voir sur Nexus →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Update Timeline */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
          📈 Activité des 4 dernières semaines
        </h3>
        <div className="pico-card p-6">
          <div className="space-y-3">
            {stats.timeline.map((week, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="text-sm text-slate-600 dark:text-slate-400 w-32 flex-shrink-0">
                  {week.label}
                </span>
                <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.max((week.count / stats.totalMods) * 100 * 5, week.count > 0 ? 5 : 0)}%`
                    }}
                  >
                    <span className="text-white text-xs font-bold">{week.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 text-center">
            Moyenne : {stats.avgDaysSinceUpdate} jours depuis la dernière mise à jour
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Game Distribution */}
        <section>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
            🎮 Distribution par jeu
          </h3>
          <div className="pico-card p-6">
            <div className="space-y-3">
              {stats.gameDistribution.map((game, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {game.name}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {game.count} mods ({game.percentage}%)
                    </span>
                  </div>
                  <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${game.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {stats.mostActiveGame && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  🏆 <strong>{stats.mostActiveGame.name}</strong> est votre jeu le plus suivi
                  avec <strong>{stats.mostActiveGame.count} mods</strong>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Top Categories */}
        <section>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
            📚 Catégories préférées
          </h3>
          <div className="pico-card p-6">
            {stats.topCategories.length > 0 ? (
              <div className="space-y-3">
                {stats.topCategories.map((cat, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {idx + 1}. {cat.category}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">
                      {cat.count} mods
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
                Aucune catégorie disponible
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Top Authors */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
          👤 Auteurs les plus suivis
        </h3>
        <div className="pico-card p-6">
          {stats.topAuthors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.topAuthors.map((author, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <span className="text-2xl font-bold text-slate-300 dark:text-slate-600">
                    #{idx + 1}
                  </span>
                  <div className="flex-1">
                    <a
                      href={`https://next.nexusmods.com/profile/${encodeURIComponent(author.author)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-bold text-pico-primary hover:underline block"
                    >
                      {author.author}
                    </a>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {author.count} mod{author.count > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
              Aucun auteur référencé
            </p>
          )}
        </div>
      </section>

      {/* Stale Mods Warning */}
      {stats.staleMods > 0 && (
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
            ⚠️ Mods nécessitant attention ({stats.staleMods})
          </h3>
          <div className="pico-card p-6 border-yellow-500 dark:border-yellow-600">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Ces mods n'ont pas été mis à jour depuis plus d'un an. Ils peuvent être abandonnés ou simplement stables.
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats.staleModsList.map((mod, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      {mod.name || `${mod.domain}/${mod.id}`}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Dernière maj: {new Date(Number(mod.updatedAt) * 1000).toLocaleDateString()}
                      {' · '}
                      il y a {Math.floor((Date.now() / 1000 - Number(mod.updatedAt)) / (365 * 24 * 3600))} an(s)
                    </p>
                  </div>
                  <a
                    href={mod.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-pico-primary hover:underline ml-4"
                  >
                    Voir →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
