import { useMemo, useState } from "react";
import useNexusMods from "../components/useNexusMods";

export default function NexusModsPage() {
  const { loading, error, games, modsForGame, refresh } = useNexusMods();
  const [gameKey, setGameKey] = useState("");

  const mods = useMemo(() => (gameKey ? modsForGame(gameKey) : []), [gameKey, modsForGame]);

  if (loading) return <p className="text-center mt-5">Chargement Nexus…</p>;
  if (error) return <p className="text-center mt-5 text-danger">Erreur: {error}</p>;
  if (!games.length) return <p className="text-center mt-5">Aucun mod suivi trouvé</p>;

  return (
    <div className="container mt-4">
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

                  <div className="small text-muted mb-2">
                    Version {m.version || "?"} · {m.author || "Auteur inconnu"}
                  </div>

                  <div className="mt-auto d-flex justify-content-between align-items-center">
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`btn btn-primary ${m.url ? "" : "disabled"}`}
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
