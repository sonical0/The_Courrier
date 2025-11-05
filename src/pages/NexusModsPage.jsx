import { useMemo, useState } from "react";
import useNexusMods from "../components/useNexusMods";

// Helpers pour nettoyer et aplatir les changelogs (mêmes règles que BootstrapPage)
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

export default function NexusModsPage() {
  const { loading, error, games, modsForGame, refresh, untrackMod } = useNexusMods();
  const [gameKey, setGameKey] = useState("");
  const [untracking, setUntracking] = useState(null); // modId en cours de suppression

  const mods = useMemo(() => (gameKey ? modsForGame(gameKey) : []), [gameKey, modsForGame]);

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

  if (loading) return <p className="text-center mt-5">Chargement Nexus…</p>;
  if (error) return <p className="text-center mt-5 text-danger">Erreur: {error}</p>;
  if (!games.length) return <p className="text-center mt-5">Aucun mod suivi trouvé</p>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Mods Suivis par Jeu</h2>
      
      <div className="d-flex align-items-end justify-content-between mb-3">
        <div style={{ minWidth: 320 }}>
          <label className="form-label">Jeu</label>
          <select
            className="form-select"
            value={gameKey}
            onChange={(e) => setGameKey(e.target.value)}
          >
            <option value="">— Choisir un jeu —</option>
            {games.map((g) => (
              <option key={g.key} value={g.domain || g.gameId || g.name}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-outline-secondary" onClick={refresh}>Rafraîchir</button>
      </div>

      {gameKey && (
        <div className="row g-3">
          {mods.map((m) => (
            <div className="col-12 col-md-6 col-lg-4" key={`${m.domain}-${m.id}`}>
              <div className="card h-100 shadow-sm">
                {m.picture && (
                  <img src={m.picture} alt={m.name} className="card-img-top" />
                )}
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{m.name || `${m.domain}/${m.id}`}</h5>

                  {m.summary && (
                    <p className="card-text small text-muted mb-2">{m.summary}</p>
                  )}

                  <div className="mb-2 d-flex align-items-center gap-2 flex-wrap">
                    {m.previousVersion && m.previousVersion !== m.version && (
                      <span className="badge bg-secondary"><s>{m.previousVersion}</s></span>
                    )}
                    <span className="badge bg-success">Version {m.version || "?"}</span>
                    <span className="small text-muted">
                      · par{" "}
                      {m.author ? (
                        <a
                          href={`https://next.nexusmods.com/profile/${encodeURIComponent(m.author)}${m.gameId ? `?gameId=${m.gameId}` : ''}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-decoration-none text-primary"
                        >
                          {m.author}
                        </a>
                      ) : (
                        "Auteur inconnu"
                      )}
                    </span>
                  </div>

                  {m.changelog && m.changelog.length > 0 && (
                    <div className="mb-3">
                      <small className="fw-bold d-block mb-1">Changelog :</small>
                      <div className="small" style={{ maxHeight: "100px", overflowY: "auto" }}>
                        {(() => {
                          const lines = flattenChangeLines(m.changelog[0], 6);
                          if (!lines.length)
                            return (
                              <p className="mb-0 text-muted fst-italic">Aucun détail disponible</p>
                            );
                          const hasMore = lines.length === 6 && (m.changelog[0].changes?.join("\n").length > lines.join("\n").length);
                          return (
                            <ul className="mb-0 ps-3">
                              {lines.map((ln, i) => (
                                <li key={i}>{ln}</li>
                              ))}
                              {hasMore && <li className="text-muted fst-italic">…</li>}
                            </ul>
                          );
                        })()}
                      </div>
                      {m.changelogUrl && (
                        <a
                          href={m.changelogUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="small text-decoration-none"
                        >
                          Voir le changelog complet →
                        </a>
                      )}
                    </div>
                  )}

                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`btn btn-primary btn-sm ${m.url ? "" : "disabled"}`}
                      >
                        Ouvrir sur Nexus
                      </a>
                      <span className="badge bg-light text-dark">
                        {m.updatedAt
                          ? new Date(
                              Number(m.updatedAt) *
                              (String(m.updatedAt).length > 10 ? 1 : 1000)
                            ).toLocaleString()
                          : "?"}
                      </span>
                    </div>
                    <button
                      className="btn btn-outline-danger btn-sm w-100"
                      onClick={() => handleUntrack(m.domain, m.id, m.name)}
                      disabled={untracking === m.id}
                    >
                      {untracking === m.id ? "Suppression..." : "🗑️ Ne plus suivre"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!mods.length && <p>Aucun mod pour ce jeu.</p>}
        </div>
      )}
    </div>
  );
}
