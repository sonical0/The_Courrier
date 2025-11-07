import { useMemo, useState } from "react";
import useNexusMods from "../components/useNexusMods";

function decodeEntities(str) {
  if (!str) return "";
  return str
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function htmlToPlainText(html) {
  if (!html) return "";
  const withBreaks = html.replace(/<br\s*\/?>/gi, "\n");
  const noTags = withBreaks.replace(/<[^>]+>/g, "");
  return decodeEntities(noTags);
}

function flattenChangeLines(changelogEntry, maxLines = 6) {
  const lines = [];
  if (!changelogEntry || !Array.isArray(changelogEntry.changes)) return lines;
  for (const raw of changelogEntry.changes) {
    const txt = htmlToPlainText(String(raw || ""));
    const parts = txt.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      lines.push(p);
      if (lines.length >= maxLines) return lines;
    }
  }
  return lines;
}

export default function ActuUpdatePage({ credentials }) {
  const { loading, error, games, modsForGame, refresh } = useNexusMods(credentials);
  const [period, setPeriod] = useState(7);

  const cutoff = Math.floor(Date.now() / 1000) - period * 24 * 3600;

  const grouped = useMemo(() => {
    const out = [];
    for (const g of games) {
      const key = g.domain || g.gameId || g.name;
      const mods = modsForGame(key).filter(
        (m) => Number(m.updatedAt || 0) >= cutoff
      );
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
  }, [games, modsForGame, cutoff]);

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
        <button 
          className="pico-btn-outline w-fit"
          onClick={refresh}
        >
          Rafraîchir
        </button>
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
                  <h5 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                    {m.name || `${m.domain}/${m.id}`}
                  </h5>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
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

                  {m.changelog && m.changelog.length > 0 && (
                    <div className="mb-4">
                      <small className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Changelog :
                      </small>
                      <div className="text-sm max-h-24 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                        {(() => {
                          const lines = flattenChangeLines(m.changelog[0], 6);
                          if (!lines.length)
                            return (
                              <p className="mb-0 text-slate-500 dark:text-slate-400 italic">
                                Aucun détail disponible
                              </p>
                            );
                          const hasMore = lines.length === 6 && (m.changelog[0].changes?.join("\n").length > lines.join("\n").length);
                          return (
                            <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                              {lines.map((ln, i) => (
                                <li key={i}>{ln}</li>
                              ))}
                              {hasMore && <li className="text-slate-500 dark:text-slate-400 italic">…</li>}
                            </ul>
                          );
                        })()}
                      </div>
                      {m.changelogUrl && (
                        <a
                          href={m.changelogUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-pico-primary hover:underline inline-block mt-1"
                        >
                          Voir le changelog complet →
                        </a>
                      )}
                    </div>
                  )}

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
