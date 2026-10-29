import { useMemo, useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import useLastVisit from "../components/useLastVisit";
import EnhancedChangelog from "../components/EnhancedChangelog";
import SteamGameInfo from "../components/SteamGameInfo";

const PERIODES = [
  { valeur: 7, libelle: "7 jours" },
  { valeur: 15, libelle: "15 jours" },
  { valeur: 30, libelle: "30 jours" },
  { valeur: 365, libelle: "Année passée" },
];

export default function ActuUpdatePage() {
  const { getSteamInfo, loading, error, games, modsForGame, refresh } = useOutletContext();
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

  const tousLesMods = grouped.flatMap((g) => g.mods);
  const nbNouveaux = countNew(tousLesMods);

  const dateLisible = (updatedAt) => {
    if (!updatedAt) return null;
    // Les horodatages Nexus arrivent en secondes ou en millisecondes selon
    // l'endpoint : la longueur les distingue.
    const ms = Number(updatedAt) * (String(updatedAt).length > 10 ? 1 : 1000);
    return new Date(ms);
  };

  // La tuile de jeu est décorative : le nom du jeu reste écrit à côté.
  const masquerImage = (e) => { e.target.style.display = "none"; };

  if (loading) {
    return (
      <div className="cr-enveloppe py-10">
        <p style={{ color: "var(--cr-muted)" }}>Chargement des mises à jour…</p>
      </div>
    );
  }

  if (error) {
    const manqueIdentifiants = error.includes("credentials") || error.includes("401");
    return (
      <div className="cr-enveloppe py-10">
        <div className="cr-lecture cr-vide" style={{ color: "var(--cr-ink)" }}>
          <p className="mb-3">
            <span className={`cr-etiquette ${manqueIdentifiants ? "cr-etiquette-attention" : "cr-etiquette-critique"}`}>
              {manqueIdentifiants ? "Configuration requise" : "Erreur"}
            </span>
          </p>
          {manqueIdentifiants ? (
            <>
              <p className="mb-2">
                Vos identifiants Nexus Mods sont nécessaires pour afficher les mises à jour.
              </p>
              <p style={{ color: "var(--cr-muted)" }}>
                Ouvrez <strong>Config</strong> dans la barre de navigation pour les renseigner.
              </p>
            </>
          ) : (
            <p>{error}</p>
          )}
        </div>
      </div>
    );
  }

  if (!games.length) {
    return (
      <div className="cr-enveloppe py-10">
        <div className="cr-lecture">
          <h1 className="text-3xl mb-4" style={{ fontFamily: "var(--cr-display)" }}>
            Bienvenue sur The Courrier
          </h1>
          <p className="mb-4">
            The Courrier suit pour vous les mises à jour des mods Nexus Mods que vous avez marqués comme suivis.
          </p>
          <div className="cr-vide" style={{ color: "var(--cr-ink)" }}>
            <p className="mb-3" style={{ color: "var(--cr-muted)" }}>
              Pour voir vos mods apparaître ici :
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Rendez-vous sur{" "}
                <a href="https://www.nexusmods.com" target="_blank" rel="noreferrer" style={{ color: "var(--cr-accent)" }}>
                  Nexus Mods
                </a>
              </li>
              <li>Connectez-vous avec votre compte</li>
              <li>Activez le suivi (« Track ») sur les mods qui vous intéressent</li>
              <li>Revenez ici pour voir les mises à jour</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cr-enveloppe py-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl" style={{ fontFamily: "var(--cr-display)", letterSpacing: "-0.015em" }}>
            Mises à jour
          </h1>
          <p className="mt-1" style={{ color: "var(--cr-muted)" }}>{periodLabel()}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {nbNouveaux > 0 && (
            <button
              type="button"
              className="cr-bouton"
              onClick={() => markAllAsSeen(tousLesMods)}
            >
              Tout marquer comme lu ({nbNouveaux})
            </button>
          )}
          <button type="button" className="cr-bouton cr-bouton-principal" onClick={refresh}>
            Rafraîchir
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <div className="cr-chiffre">
          <dt>Mises à jour</dt>
          <dd>{tousLesMods.length}</dd>
          <div className="cr-precision">sur la période</div>
        </div>
        <div className="cr-chiffre">
          <dt>Non lues</dt>
          <dd>{nbNouveaux}</dd>
          <div className="cr-precision">depuis votre dernière visite</div>
        </div>
        <div className="cr-chiffre">
          <dt>Jeux concernés</dt>
          <dd>{grouped.length}</dd>
          <div className="cr-precision">sur {games.length} suivis</div>
        </div>
      </dl>

      {/* Les filtres passent au-dessus de la liste sur mobile et se rangent en
          colonne latérale dès qu'il y a la place. */}
      <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] items-start">
        <div className="grid gap-5">
          <div>
            <label htmlFor="cr-recherche" className="block mb-2 font-medium">
              Rechercher
            </label>
            <input
              id="cr-recherche"
              type="search"
              className="pico-input"
              placeholder="Nom ou auteur"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <fieldset>
            <legend className="mb-2 font-medium">Période</legend>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {PERIODES.map((p) => (
                <button
                  key={p.valeur}
                  type="button"
                  className="cr-filtre"
                  aria-pressed={period === p.valeur}
                  onClick={() => setPeriod(p.valeur)}
                >
                  {p.libelle}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="cr-jeu" className="block mb-2 font-medium">
              Filtrer par jeu
            </label>
            <select
              id="cr-jeu"
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
            <div>
              <label htmlFor="cr-categorie" className="block mb-2 font-medium">
                Catégorie
              </label>
              <select
                id="cr-categorie"
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

          <div>
            <label htmlFor="cr-tri" className="block mb-2 font-medium">
              Trier par
            </label>
            <select
              id="cr-tri"
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

        <div>
          {searchQuery && (
            <p className="mb-4" style={{ color: "var(--cr-muted)" }}>
              {tousLesMods.length} résultat{tousLesMods.length !== 1 ? "s" : ""} pour « {searchQuery} »
            </p>
          )}

          {!grouped.length && (
            <p className="cr-vide">Aucune mise à jour sur cette période.</p>
          )}

          {grouped.map(({ gameLabel, gameData, mods }) => (
            <section className="mb-10" key={gameLabel}>
              <div className="flex items-center gap-3 mb-1">
                {gameData?.gameId && (
                  <img
                    src={`https://staticdelivery.nexusmods.com/Images/games/4_3/tile_${gameData.gameId}.jpg`}
                    alt=""
                    aria-hidden="true"
                    className="cr-jeu-icone cr-jeu-icone-lg"
                    onError={masquerImage}
                  />
                )}
                <h2 className="text-2xl" style={{ fontFamily: "var(--cr-display)" }}>
                  {gameLabel}
                </h2>
                <span className="cr-mono text-sm" style={{ color: "var(--cr-muted)" }}>
                  {mods.length}
                </span>
              </div>

              {getSteamInfo && gameData?.domain && (() => {
                const steamInfo = getSteamInfo(gameData.domain);
                return steamInfo ? (
                  <div className="my-4">
                    <SteamGameInfo domain={gameData.domain} steamInfo={steamInfo} />
                  </div>
                ) : null;
              })()}

              <ul className="cr-lecture list-none p-0 m-0">
                {mods.map((m) => {
                  const nouveau = isNew(m.updatedAt, m.domain, m.id);
                  const date = dateLisible(m.updatedAt);
                  return (
                    <li className="cr-mod" key={`${m.domain}-${m.id}`}>
                      {m.picture ? (
                        <img src={m.picture} alt="" aria-hidden="true" className="cr-mod-vignette" onError={masquerImage} />
                      ) : (
                        <span className="cr-mod-vignette" aria-hidden="true" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-start gap-3 flex-wrap">
                          <h3 className="text-lg font-semibold m-0 flex-1 overflow-wrap-anywhere">
                            {m.name || `${m.domain}/${m.id}`}
                          </h3>
                          {nouveau && (
                            <>
                              <span className="cr-etiquette cr-etiquette-attention">Nouveau</span>
                              <button
                                type="button"
                                className="cr-bouton"
                                onClick={() => markAsSeen(m.domain, m.id)}
                              >
                                Marquer comme lu
                              </button>
                            </>
                          )}
                        </div>

                        <p className="cr-meta mt-1 mb-0">
                          <span>
                            par{" "}
                            {m.author ? (
                              <a
                                href={`https://next.nexusmods.com/profile/${encodeURIComponent(m.author)}${m.gameId ? `?gameId=${m.gameId}` : ''}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: "var(--cr-accent)" }}
                              >
                                {m.author}
                              </a>
                            ) : (
                              "auteur inconnu"
                            )}
                          </span>
                          {m.category && <span>{m.category}</span>}
                          {date && (
                            <time dateTime={date.toISOString()}>
                              {date.toLocaleString()}
                            </time>
                          )}
                          <span className="cr-mono">#{m.id}</span>
                        </p>

                        <p className="cr-meta mt-1 mb-0">
                          <span className="cr-visuellement-cache">Version</span>
                          {m.previousVersion && m.previousVersion !== m.version && (
                            <>
                              <span className="cr-mono" style={{ textDecoration: "line-through" }}>
                                {m.previousVersion}
                              </span>
                              <span aria-hidden="true">→</span>
                            </>
                          )}
                          <span className="cr-mono" style={{ color: "var(--cr-ink)", fontWeight: 600 }}>
                            {m.version || "inconnue"}
                          </span>
                        </p>

                        <div className="mt-2">
                          <EnhancedChangelog mod={m} maxLines={6} />
                        </div>

                        {m.url && (
                          <p className="mt-3 mb-0">
                            <a href={m.url} target="_blank" rel="noreferrer" className="cr-bouton">
                              Ouvrir sur Nexus
                            </a>
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
