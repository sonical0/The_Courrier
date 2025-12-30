import { useMemo, useState, useEffect } from "react";
import useNexusMods from "../components/useNexusMods";
import useLastVisit from "../components/useLastVisit";
import EnhancedChangelog from "../components/EnhancedChangelog";

export default function NexusModsPage({ credentials }) {
  const { loading, error, games, modsForGame, refresh, untrackMod } = useNexusMods(credentials);
  const { isNew, updateLastVisit } = useLastVisit();
  const [gameKey, setGameKey] = useState("ALL");
  const [untracking, setUntracking] = useState(null);
  const [sortBy, setSortBy] = useState("date");

  useEffect(() => {
    // Marquer comme visité après 2 secondes
    const timer = setTimeout(() => updateLastVisit(), 2000);
    return () => clearTimeout(timer);
  }, [updateLastVisit]);

  const mods = useMemo(() => {
    let result = [];
    if (!gameKey || gameKey === "ALL") {
      // Afficher tous les mods de tous les jeux
      for (const g of games) {
        const key = g.domain || g.gameId || g.name;
        result.push(...modsForGame(key));
      }
    } else {
      result = modsForGame(gameKey);
    }
    
    // Tri des mods
    if (sortBy === "name") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "author") {
      result.sort((a, b) => (a.author || "").localeCompare(b.author || ""));
    } else {
      // Par défaut : tri par date (plus récent en premier)
      result.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
    }
    
    return result;
  }, [gameKey, modsForGame, games, sortBy]);

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
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
        Liste des Mods
      </h2>
      
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
        <div className="flex-1 max-w-md">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Trier par
          </label>
          <select
            className="pico-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">📅 Date de mise à jour</option>
            <option value="name">🔤 Nom</option>
            <option value="author">👤 Auteur</option>
          </select>
        </div>
        <button className="pico-btn-outline w-fit" onClick={refresh}>
          Rafraîchir
        </button>
      </div>

      {mods.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mods.map((m) => (
            <div className="pico-card flex flex-col" key={`${m.domain}-${m.id}`}>
              {m.picture && (
                <img src={m.picture} alt={m.name} className="w-full h-40 object-cover flex-shrink-0" />
              )}
              <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-start gap-2 mb-2">
                  <h5 className="text-xl font-bold text-slate-800 dark:text-white flex-1">
                    {m.name || `${m.domain}/${m.id}`}
                  </h5>
                  {isNew(m.updatedAt) && (
                    <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">🆕 NEW</span>
                  )}
                </div>

                {m.summary && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{m.summary}</p>
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
                  </span>
                </div>

                <EnhancedChangelog mod={m} maxLines={6} />

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
          ))}
          {!mods.length && (
            <p className="text-slate-500 dark:text-slate-400 col-span-full">
              Aucun mod pour ce jeu.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
