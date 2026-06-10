import { useMemo, useState, useEffect } from "react";
import useNexusMods from "../components/useNexusMods";
import useLastVisit from "../components/useLastVisit";
import EnhancedChangelog from "../components/EnhancedChangelog";
import SteamGameInfo from "../components/SteamGameInfo";

export default function ActuUpdatePage({ credentials, getSteamInfo }) {
  const { loading, error, games, modsForGame, refresh } = useNexusMods(credentials);
  const { isNew, updateLastVisit, markAsSeen, markAllAsSeen, countNew } = useLastVisit();
  const [period, setPeriod] = useState(7);
  const [selectedGame, setSelectedGame] = useState("ALL");
  const [sortBy, setSortBy] = useState("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");

  useEffect(() => {
    // Marquer comme visité après 2 secondes
    const timer = setTimeout(() => updateLastVisit(), 2000);
    return () => clearTimeout(timer);
  }, [updateLastVisit]);

  const cutoff = Math.floor(Date.now() / 1000) - period * 24 * 3600;

  const grouped = useMemo(() => {
    const out = [];
    const gamesToShow = selectedGame === "ALL" ? games : games.filter(g => {
      const key = g.domain || g.gameId || g.name;
      return key === selectedGame;
    });


    for (const g of gamesToShow) {
      const key = g.domain || g.gameId || g.name;
      let mods = modsForGame(key).filter(
        (m) => Number(m.updatedAt || 0) >= cutoff
      );

      if (filterCategory !== "ALL") {
        mods = mods.filter((m) => m.category === filterCategory);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        mods = mods.filter(
          (m) =>
            (m.name || "").toLowerCase().includes(q) ||
            (m.author || "").toLowerCase().includes(q)
        );
      }

      if (sortBy === "name") {
        mods.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      } else if (sortBy === "author") {
        mods.sort((a, b) => (a.author || "").localeCompare(b.author || ""));
      } else {
        mods.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
      }

      if (mods.length) {
        out.push({
          gameLabel: g.name || g.domain || `Game ${g.gameId || ""}`.trim(),
          gameData: g,
          mods,
        });
      }
    }
    out.sort(
      (a, b) =>
        Number(b.mods[0]?.updatedAt || 0) - Number(a.mods[0]?.updatedAt || 0)
    );
    return out;
  }, [games, modsForGame, cutoff, selectedGame, sortBy, searchQuery, filterCategory]);

  const availableCategories = useMemo(() => {
    const gamesToShow =
      selectedGame === "ALL"
        ? games
        : games.filter((g) => (g.domain || g.gameId || g.name) === selectedGame);
    const cats = new Set();
    for (const g of gamesToShow) {
      modsForGame(g.domain || g.gameId || g.name)
        .filter((m) => Number(m.updatedAt || 0) >= cutoff)
        .forEach((m) => { if (m.category) cats.add(m.category); });
    }
    return [...cats].sort();
  }, [games, modsForGame, cutoff, selectedGame]);

  const periodLabel = () => {
    if (period === 7) return "7 derniers jours";
    if (period === 15) return "15 derniers jours";
    if (period === 30) return "30 derniers jours";
    if (period === 365) return "année passée";
    return `${period} derniers jours`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">Chargement…</p>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
          Mise à jour · {periodLabel()}
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {countNew(grouped.flatMap((g) => g.mods)) > 0 && (
            <button
              className="pico-btn-outline text-sm"
              onClick={() => markAllAsSeen(grouped.flatMap((g) => g.mods))}
              title="Marquer tous les mods visibles comme lus"
            >
              Tout marquer comme lu ({countNew(grouped.flatMap((g) => g.mods))})
            </button>
          )}
          <button className="pico-btn-outline w-fit" onClick={refresh}>
            Rafraîchir
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          className="pico-select w-full"
          placeholder="🔍 Rechercher par nom ou auteur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {searchQuery && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {grouped.reduce((acc, g) => acc + g.mods.length, 0)} résultat{grouped.reduce((acc, g) => acc + g.mods.length, 0) !== 1 ? "s" : ""} pour « {searchQuery} »
        </p>
      )}

      <div className="mb-6 flex flex-col md:flex-row gap-4 flex-wrap">
        <div className="flex-1 max-w-md">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Filtrer par jeu
          </label>
          <select
            className="pico-select"
            value={selectedGame}
            onChange={(e) => { setSelectedGame(e.target.value); setFilterCategory("ALL"); }}
          >
            <option value="ALL">Tous les jeux</option>
            {games.map((g) => (
              <option key={g.key} value={g.domain || g.gameId || g.name}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        {availableCategories.length > 0 && (
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Catégorie
            </label>
            <select
              className="pico-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              data-testid="category-filter"
            >
              <option value="ALL">Toutes les catégories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex-1 max-w-md">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Trier par
          </label>
          <select
            className="pico-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Date de mise à jour</option>
            <option value="name">Nom</option>
            <option value="author">Auteur</option>
          </select>
        </div>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          type="button"
          className={period === 7 ? "pico-btn-primary" : "pico-btn-outline"}
          onClick={() => setPeriod(7)}
        >
          7 jours
        </button>
        <button
          type="button"
          className={period === 15 ? "pico-btn-primary" : "pico-btn-outline"}
          onClick={() => setPeriod(15)}
        >
          15 jours
        </button>
        <button
          type="button"
          className={period === 30 ? "pico-btn-primary" : "pico-btn-outline"}
          onClick={() => setPeriod(30)}
        >
          30 jours
        </button>
        <button
          type="button"
          className={period === 365 ? "pico-btn-primary" : "pico-btn-outline"}
          onClick={() => setPeriod(365)}
        >
          Année passée
        </button>
      </div>

      {!grouped.length && (
        <p className="text-slate-500 dark:text-slate-400">Aucune mise à jour récente trouvée.</p>
      )}

      {grouped.map(({ gameLabel, gameData, mods }) => (
        <section className="mb-8" key={gameLabel}>
          <div className="flex items-center gap-3 mb-4">
            <h4 className="text-2xl font-semibold text-slate-800 dark:text-white">
              {gameLabel}
            </h4>
            {gameData?.gameId && (
              <img 
                src={`https://staticdelivery.nexusmods.com/Images/games/4_3/tile_${gameData.gameId}.jpg`}
                alt={`${gameLabel} icon`}
                className="w-10 h-10 rounded object-cover border-2 border-slate-300 dark:border-slate-600"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
          </div>
          
          {/* Afficher les infos Steam pour le jeu */}
          {getSteamInfo && gameData?.domain && (() => {
            const steamInfo = getSteamInfo(gameData.domain);
            return steamInfo ? (
              <div className="mb-4">
                <SteamGameInfo domain={gameData.domain} steamInfo={steamInfo} />
              </div>
            ) : null;
          })()}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mods.map((m) => (
              <div className="pico-card flex flex-col" key={`${m.domain}-${m.id}`}>
                {m.picture && (
                  <img
                    src={m.picture}
                    alt={m.name}
                    className="w-full h-40 object-cover flex-shrink-0"
                  />
                )}
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-start gap-2 mb-1">
                    <h5 className="text-xl font-bold text-slate-800 dark:text-white flex-1">
                      {m.name || `${m.domain}/${m.id}`}
                    </h5>
                    {isNew(m.updatedAt, m.domain, m.id) && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">NEW</span>
                        <button
                          className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-full transition-colors"
                          onClick={() => markAsSeen(m.domain, m.id)}
                          title="Marquer comme lu"
                        >
                          Lu
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    par{" "}
                    {m.author ? (
                      <a
                        href={`https://next.nexusmods.com/profile/${encodeURIComponent(m.author)}${m.gameId ? `?gameId=${m.gameId}` : ''}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-pico-primary hover:underline"
                      >
                        {m.author}
                      </a>
                    ) : (
                      "Auteur inconnu"
                    )}
                    {m.category && (
                      <span className="ml-2">
                        · <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                          {m.category}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="mb-3 flex gap-2 flex-wrap">
                    {m.previousVersion && m.previousVersion !== m.version && (
                      <span className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-sm line-through">
                        {m.previousVersion}
                      </span>
                    )}
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-sm font-medium">
                      Version {m.version || "?"}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                    Mise à jour le{" "}
                    {m.updatedAt
                      ? new Date(
                          Number(m.updatedAt) *
                          (String(m.updatedAt).length > 10 ? 1 : 1000)
                        ).toLocaleString()
                      : "?"}
                  </p>

                  <EnhancedChangelog mod={m} maxLines={6} />

                  <div className="mt-auto flex justify-between items-center">
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`pico-btn-primary text-sm ${m.url ? "" : "opacity-50 pointer-events-none"}`}
                    >
                      Ouvrir sur Nexus
                    </a>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">
                      #{m.id}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
