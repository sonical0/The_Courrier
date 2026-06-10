import { useMemo, useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import useNexusMods from "../components/useNexusMods";
import useLastVisit from "../components/useLastVisit";
import useModTags, { TAG_LABELS, TAG_COLORS } from "../components/useModTags";
import EnhancedChangelog from "../components/EnhancedChangelog";
import SteamGameInfo from "../components/SteamGameInfo";

export default function NexusModsPage() {
  const { credentials, getSteamInfo } = useOutletContext();
  const { loading, error, games, modsForGame, refresh, untrackMod } = useNexusMods(credentials);
  const { isNew, updateLastVisit, markAsSeen, markAllAsSeen, countNew } = useLastVisit();
  const { getTag, toggleTag } = useModTags();
  const [gameKey, setGameKey] = useState("ALL");
  const [untracking, setUntracking] = useState(null);
  const [sortBy, setSortBy] = useState("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterTag, setFilterTag] = useState("ALL");
  const [selectedMods, setSelectedMods] = useState(new Set());
  const [batchUntracking, setBatchUntracking] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => updateLastVisit(), 2000);
    return () => clearTimeout(timer);
  }, [updateLastVisit]);

  const modsBase = useMemo(() => {
    const result = [];
    if (!gameKey || gameKey === "ALL") {
      for (const g of games) {
        result.push(...modsForGame(g.domain || g.gameId || g.name));
      }
    } else {
      result.push(...modsForGame(gameKey));
    }
    return result;
  }, [gameKey, modsForGame, games]);

  const availableCategories = useMemo(() => {
    const cats = new Set(modsBase.map((m) => m.category).filter(Boolean));
    return [...cats].sort();
  }, [modsBase]);

  const mods = useMemo(() => {
    let result = [...modsBase];

    if (sortBy === "name") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "author") {
      result.sort((a, b) => (a.author || "").localeCompare(b.author || ""));
    } else {
      result.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
    }

    if (filterCategory !== "ALL") {
      result = result.filter((m) => m.category === filterCategory);
    }

    if (filterTag === "none") {
      result = result.filter((m) => !getTag(m.domain, m.id));
    } else if (filterTag !== "ALL") {
      result = result.filter((m) => getTag(m.domain, m.id) === filterTag);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          (m.name || "").toLowerCase().includes(q) ||
          (m.author || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [modsBase, sortBy, filterCategory, filterTag, searchQuery, getTag]);

  const handleUntrack = async (domain, modId, modName) => {
    if (!window.confirm(`Voulez-vous vraiment retirer "${modName}" de votre liste de mods suivis ?`)) {
      return;
    }
    setUntracking(modId);
    const result = await untrackMod(domain, modId);
    setUntracking(null);
    if (!result.success) {
      alert(`Erreur lors de la suppression : ${result.error}`);
    }
  };

  const toggleSelect = useCallback((domain, modId) => {
    const key = `${domain}:${modId}`;
    setSelectedMods((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const toggleSelectAll = () => {
    if (selectedMods.size === mods.length) {
      setSelectedMods(new Set());
    } else {
      setSelectedMods(new Set(mods.map((m) => `${m.domain}:${m.id}`)));
    }
  };

  const handleBatchUntrack = async () => {
    if (!window.confirm(`Retirer ${selectedMods.size} mod(s) de votre liste de suivi ?`)) return;
    setBatchUntracking(true);
    for (const key of selectedMods) {
      const [domain, modId] = key.split(":");
      await untrackMod(domain, modId);
    }
    setSelectedMods(new Set());
    setBatchUntracking(false);
  };

  const handleExport = () => {
    const allMods = games.flatMap((g) => modsForGame(g.domain || g.gameId || g.name));
    const data = allMods.map((m) => ({
      name: m.name,
      author: m.author,
      version: m.version,
      category: m.category || null,
      url: m.url,
      game: m.gameName || m.domain,
      updatedAt: m.updatedAt
        ? new Date(Number(m.updatedAt) * (String(m.updatedAt).length > 10 ? 1 : 1000)).toISOString()
        : null,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `the-courrier-mods-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">Chargement Nexus…</p>
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
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">Aucun mod suivi trouvé</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
          Liste des Mods
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {countNew(mods) > 0 && (
            <button
              className="pico-btn-outline text-sm"
              onClick={() => markAllAsSeen(mods)}
              title="Marquer tous les mods visibles comme lus"
            >
              Tout marquer comme lu ({countNew(mods)})
            </button>
          )}
          <button
            className="pico-btn-outline text-sm"
            onClick={handleExport}
            title="Exporter la liste complète en JSON"
          >
            Exporter JSON
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-4">
        <input
          type="text"
          className="pico-select w-full"
          placeholder="🔍 Rechercher par nom ou auteur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 gap-4">
        <div className="flex-1 max-w-md">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Jeu
          </label>
          <select
            className="pico-select"
            value={gameKey}
            onChange={(e) => setGameKey(e.target.value)}
          >
            <option value="ALL">🎮 Tous les jeux</option>
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
            Statut
          </label>
          <select
            className="pico-select"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            data-testid="tag-filter"
          >
            <option value="ALL">Tous les statuts</option>
            {Object.entries(TAG_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
            <option value="none">Sans statut</option>
          </select>
        </div>
        <div className="flex-1 max-w-md">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Trier par
          </label>
          <select
            className="pico-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Date de mise a jour</option>
            <option value="name">Nom</option>
            <option value="author">Auteur</option>
          </select>
        </div>
        <button className="pico-btn-outline w-fit" onClick={refresh}>
          Rafraichir
        </button>
      </div>

      {gameKey && gameKey !== "ALL" && getSteamInfo && (() => {
        const selectedGame = games.find(g => (g.domain || g.gameId || g.name) === gameKey);
        const steamInfo = selectedGame ? getSteamInfo(selectedGame.domain) : null;
        return steamInfo ? (
          <div className="mb-6">
            <SteamGameInfo domain={selectedGame.domain} steamInfo={steamInfo} />
          </div>
        ) : null;
      })()}

      {searchQuery && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {mods.length} résultat{mods.length !== 1 ? "s" : ""} pour « {searchQuery} »
        </p>
      )}

      {mods.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mods.map((m) => {
            const selKey = `${m.domain}:${m.id}`;
            const isSelected = selectedMods.has(selKey);
            const currentTag = getTag(m.domain, m.id);
            const tagColor = currentTag ? TAG_COLORS[currentTag] : null;
            return (
              <div
                className={`pico-card flex flex-col transition-all ${isSelected ? "ring-2 ring-pico-primary" : tagColor ? tagColor.border : ""}`}
                key={`${m.domain}-${m.id}`}
                data-testid={`mod-card-${m.id}`}
              >
                <label className="flex items-center gap-2 px-3 pt-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(m.domain, m.id)}
                    className="w-4 h-4 accent-pico-primary"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Sélectionner</span>
                </label>

                {m.picture && (
                  <img src={m.picture} alt={m.name} className="w-full h-40 object-cover flex-shrink-0" />
                )}
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-start gap-2 mb-2">
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

                  {m.summary && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{m.summary}</p>
                  )}

                  {m.category && (
                    <div className="mb-3">
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                        📚 {m.category}
                      </span>
                    </div>
                  )}

                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    {m.previousVersion && m.previousVersion !== m.version && (
                      <span className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-sm line-through">
                        {m.previousVersion}
                      </span>
                    )}
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-sm font-medium">
                      Version {m.version || "?"}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      · par{" "}
                      {m.author ? (
                        <a
                          href={`https://next.nexusmods.com/profile/${encodeURIComponent(m.author)}${m.gameId ? `?gameId=${m.gameId}` : ""}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-pico-primary hover:underline"
                        >
                          {m.author}
                        </a>
                      ) : (
                        "Auteur inconnu"
                      )}
                    </span>
                  </div>

                  <EnhancedChangelog mod={m} maxLines={6} />

                  <div className="mt-3 mb-2 flex flex-wrap gap-1" data-testid={`tag-buttons-${m.id}`}>
                    {Object.entries(TAG_LABELS).map(([tagValue, tagLabel]) => {
                      const isActive = currentTag === tagValue;
                      const colors = TAG_COLORS[tagValue];
                      return (
                        <button
                          key={tagValue}
                          className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                            isActive
                              ? colors.btn + " border-transparent"
                              : "bg-transparent text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-slate-400"
                          }`}
                          onClick={() => toggleTag(m.domain, m.id, tagValue)}
                          title={isActive ? `Retirer le statut "${tagLabel}"` : `Marquer comme "${tagLabel}"`}
                        >
                          {tagLabel}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-auto space-y-2">
                    <div className="flex justify-between items-center">
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`pico-btn-primary text-sm ${m.url ? "" : "opacity-50 pointer-events-none"}`}
                      >
                        Ouvrir sur Nexus
                      </a>
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs">
                        {m.updatedAt
                          ? new Date(
                              Number(m.updatedAt) *
                              (String(m.updatedAt).length > 10 ? 1 : 1000)
                            ).toLocaleString()
                          : "?"}
                      </span>
                    </div>
                    <button
                      className="w-full px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium disabled:opacity-50"
                      onClick={() => handleUntrack(m.domain, m.id, m.name)}
                      disabled={untracking === m.id}
                    >
                      {untracking === m.id ? "Suppression..." : "🗑️ Ne plus suivre"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {!mods.length && (
            <p className="text-slate-500 dark:text-slate-400 col-span-full">
              Aucun mod pour ce jeu.
            </p>
          )}
        </div>
      )}

      {/* Barre d'actions batch sticky */}
      {selectedMods.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg px-4 py-3">
          <div className="container mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {selectedMods.size} mod{selectedMods.size > 1 ? "s" : ""} sélectionné{selectedMods.size > 1 ? "s" : ""}
              </span>
              <button
                className="text-sm text-pico-primary hover:underline"
                onClick={toggleSelectAll}
              >
                {selectedMods.size === mods.length ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                className="pico-btn-outline text-sm"
                onClick={() => setSelectedMods(new Set())}
              >
                Annuler
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50"
                onClick={handleBatchUntrack}
                disabled={batchUntracking}
              >
                {batchUntracking ? "Suppression..." : `🗑️ Retirer la sélection (${selectedMods.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
