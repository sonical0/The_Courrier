import { useMemo, useState } from "react";
import useNexusMods from "../components/useNexusMods";

// Utils d'affichage pour nettoyer les textes HTML des changelogs
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
  // remplace les <br> par des sauts de ligne, supprime le reste des balises
  const withBreaks = html.replace(/<br\s*\/?>/gi, "\n");
  const noTags = withBreaks.replace(/<[^>]+>/g, "");
  return decodeEntities(noTags);
}

function flattenChangeLines(changelogEntry, maxLines = 6) {
  // changelogEntry = { version, changes: string[] }
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

export default function BootstrapPage() {
  const { loading, error, games, modsForGame, refresh } = useNexusMods();
  const [period, setPeriod] = useState(7); // en jours

  const cutoff = Math.floor(Date.now() / 1000) - period * 24 * 3600;

  // Regroupe par jeu uniquement les mods mis à jour < 30 jours
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
          mods,
        });
      }
    }
    // Tri des jeux par actus les plus récentes
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

  if (loading) return <p className="text-center mt-5">Chargement…</p>;
  if (error) return <p className="text-center mt-5 text-danger">Erreur: {error}</p>;

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="m-0">Actualités des Mods · {periodLabel()}</h2>
        <button className="btn btn-outline-secondary" onClick={refresh}>
          Rafraîchir
        </button>
      </div>

      <div className="mb-4">
        <div className="btn-group" role="group" aria-label="Filtres de période">
          <button
            type="button"
            className={`btn ${period === 7 ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setPeriod(7)}
          >
            7 jours
          </button>
          <button
            type="button"
            className={`btn ${period === 15 ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setPeriod(15)}
          >
            15 jours
          </button>
          <button
            type="button"
            className={`btn ${period === 30 ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setPeriod(30)}
          >
            30 jours
          </button>
          <button
            type="button"
            className={`btn ${period === 365 ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setPeriod(365)}
          >
            Année passée
          </button>
        </div>
      </div>

      {!grouped.length && (
        <p className="text-muted">Aucune mise à jour récente trouvée.</p>
      )}

      {grouped.map(({ gameLabel, mods }) => (
        <section className="mb-4" key={gameLabel}>
          <h4 className="mb-3">{gameLabel}</h4>
          <div className="row g-3">
            {mods.map((m) => (
              <div className="col-12 col-md-6 col-lg-4" key={`${m.domain}-${m.id}`}>
                <div className="card h-100 shadow-sm">
                  {m.picture && (
                    <img
                      src={m.picture}
                      alt={m.name}
                      className="card-img-top"
                      style={{ objectFit: "cover", height: 160 }}
                    />
                  )}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title mb-1">{m.name || `${m.domain}/${m.id}`}</h5>
                    <div className="small text-muted mb-2">
                      par{" "}
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
                    </div>

                    <div className="mb-2">
                      {m.previousVersion && m.previousVersion !== m.version && (
                        <span className="badge bg-secondary me-1">
                          <s>{m.previousVersion}</s>
                        </span>
                      )}
                      <span className="badge bg-success">
                        Version {m.version || "?"}
                      </span>
                    </div>

                    <p className="small text-muted mb-2">
                      Mise à jour le{" "}
                      {m.updatedAt
                        ? new Date(
                            Number(m.updatedAt) *
                            (String(m.updatedAt).length > 10 ? 1 : 1000)
                          ).toLocaleString()
                        : "?"}
                    </p>

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

                    <div className="mt-auto d-flex justify-content-between align-items-center">
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`btn btn-sm btn-primary ${m.url ? "" : "disabled"}`}
                      >
                        Ouvrir sur Nexus
                      </a>
                      <span className="text-muted small">#{m.id}</span>
                    </div>
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
