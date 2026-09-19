import { useMemo, useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import useLastVisit from "../components/useLastVisit";
import useModTags, { TAG_LABELS } from "../components/useModTags";
import EnhancedChangelog from "../components/EnhancedChangelog";
import SteamGameInfo from "../components/SteamGameInfo";

// Le statut d'un mod était porté par une couleur d'anneau autour de la carte :
// invisible pour qui ne distingue pas les teintes, et muet pour un lecteur
// d'écran. On le rend par une étiquette écrite ; la teinte ne fait que doubler
// le mot. « En pause » et « Archivé » restent neutres : ce ne sont pas des
// alertes, seulement des rangements.
const ETIQUETTE_PAR_STATUT = {
  installed: "cr-etiquette-ok",
  "to-install": "cr-etiquette-attention",
  paused: "cr-etiquette-neutre",
  archived: "cr-etiquette-neutre",
};

function EtiquetteStatut({ statut }) {
  if (!statut) return null;
  const variante = ETIQUETTE_PAR_STATUT[statut] || "cr-etiquette-neutre";
  return <span className={`cr-etiquette ${variante}`}>{TAG_LABELS[statut]}</span>;
}

// La tuile Nexus sert de repère de jeu quand le mod n'a pas d'illustration.
// Elle est décorative : le nom du jeu reste écrit à côté.
function IconeJeu({ gameId, className }) {
  if (!gameId) return <span className={className} aria-hidden="true" />;
  return (
    <img
      src={`https://staticdelivery.nexusmods.com/Images/games/4_3/tile_${gameId}.jpg`}
      alt=""
      aria-hidden="true"
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

export default function NexusModsPage() {
  const { getSteamInfo, loading, error, games, modsForGame, refresh, untrackMod } = useOutletContext();
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

  // Les compteurs des filtres de statut : ils portent le même ensemble que le
  // filtre lui-même, avant filtrage, pour que le nombre annoncé soit celui
  // qu'on obtiendra en cliquant.
  const comptesStatut = useMemo(() => {
    const compte = { ALL: modsBase.length, none: 0 };
    for (const value of Object.keys(TAG_LABELS)) compte[value] = 0;
    for (const m of modsBase) {
      const tag = getTag(m.domain, m.id);
      if (tag && compte[tag] !== undefined) compte[tag] += 1;
      else if (!tag) compte.none += 1;
    }
    return compte;
  }, [modsBase, getTag]);

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
      <div className="cr-enveloppe py-8">
        <p style={{ color: "var(--cr-muted)" }}>Chargement Nexus…</p>
      </div>
    );
  }

  if (error) {
    const identifiantsManquants = error.includes("credentials") || error.includes("401");
    return (
      <div className="cr-enveloppe py-8">
        <div
          className="cr-lecture"
          style={{
            background: identifiantsManquants ? "var(--cr-warn-soft)" : "var(--cr-crit-soft)",
            border: `1px solid ${identifiantsManquants ? "var(--cr-warn)" : "var(--cr-crit)"}`,
            borderRadius: "var(--cr-radius)",
            padding: "1.25rem",
          }}
        >
          {identifiantsManquants ? (
            <>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--cr-warn)" }}>
                Configuration requise
              </h2>
              <p className="mb-2">
                Vous devez configurer vos identifiants Nexus Mods pour utiliser cette fonctionnalité.
              </p>
              <p className="m-0" style={{ color: "var(--cr-muted)" }}>
                Ouvrez <strong>Config</strong> dans la barre de navigation pour les renseigner.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--cr-crit)" }}>
                Erreur
              </h2>
              <p className="m-0">{error}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!games.length) {
    return (
      <div className="cr-enveloppe py-8">
        <div className="cr-vide cr-lecture">Aucun mod suivi trouvé.</div>
      </div>
    );
  }

  const selectedGame =
    gameKey && gameKey !== "ALL"
      ? games.find((g) => (g.domain || g.gameId || g.name) === gameKey)
      : null;
  const steamInfo = selectedGame && getSteamInfo ? getSteamInfo(selectedGame.domain) : null;

  // Le filtre de statut est un petit ensemble fermé : des boutons le montrent
  // en entier, avec son compte, là où un menu déroulant le cachait.
  const filtresStatut = [
    { value: "ALL", label: "Tous les statuts" },
    ...Object.entries(TAG_LABELS).map(([value, label]) => ({ value, label })),
    { value: "none", label: "Sans statut" },
  ];

  return (
    <div className="cr-enveloppe py-8 pb-28">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold m-0" style={{ letterSpacing: "-0.02em" }}>
          Mods suivis
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {countNew(mods) > 0 && (
            <button type="button" className="cr-bouton" onClick={() => markAllAsSeen(mods)}>
              Tout marquer comme lu ({countNew(mods)})
            </button>
          )}
          <button type="button" className="cr-bouton" onClick={handleExport}>
            Exporter JSON
          </button>
          <button type="button" className="cr-bouton" onClick={refresh}>
            Rafraîchir
          </button>
        </div>
      </header>

      {/* Les filtres passent en rail latéral dès qu'il y a la place : sur cet
          écran ils sont nombreux, et les comprimer sur une ligne les rendait
          illisibles avant de les rendre inutilisables. */}
      <div className="lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-10 lg:items-start">
        <aside className="mb-8 lg:mb-0 lg:sticky lg:top-6 flex flex-col gap-6" aria-label="Filtres">
          <div>
            <label className="block font-semibold mb-2" htmlFor="recherche-mod">
              Rechercher
            </label>
            <input
              id="recherche-mod"
              type="search"
              className="pico-input"
              placeholder="Nom ou auteur"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-semibold mb-2" htmlFor="filtre-jeu">
              Jeu
            </label>
            <select
              id="filtre-jeu"
              className="pico-select"
              value={gameKey}
              onChange={(e) => setGameKey(e.target.value)}
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
              <label className="block font-semibold mb-2" htmlFor="filtre-categorie">
                Catégorie
              </label>
              <select
                id="filtre-categorie"
                className="pico-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="ALL">Toutes les catégories</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div data-testid="tag-filter">
            <h2 className="font-semibold mb-2">Statut</h2>
            <div className="flex flex-col gap-2">
              {filtresStatut.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className="cr-filtre"
                  aria-pressed={filterTag === value}
                  onClick={() => setFilterTag(value)}
                >
                  <span>{label}</span>
                  <span className="cr-compte">{comptesStatut[value] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2" htmlFor="tri-mods">
              Trier par
            </label>
            <select
              id="tri-mods"
              className="pico-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Date de mise à jour</option>
              <option value="name">Nom</option>
              <option value="author">Auteur</option>
            </select>
          </div>
        </aside>

        <section aria-label="Liste des mods">
          {steamInfo && (
            <div className="mb-6">
              <SteamGameInfo domain={selectedGame.domain} steamInfo={steamInfo} />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <p className="m-0" style={{ color: "var(--cr-muted)" }}>
              {mods.length} mod{mods.length !== 1 ? "s" : ""}
              {searchQuery ? ` pour « ${searchQuery} »` : ""}
            </p>
            {mods.length > 0 && (
              <button type="button" className="cr-bouton" onClick={toggleSelectAll}>
                {selectedMods.size === mods.length ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
            )}
          </div>

          {mods.length === 0 ? (
            <div className="cr-vide">Aucun mod ne correspond à ces filtres.</div>
          ) : (
            <ul className="list-none m-0 p-0">
              {mods.map((m) => {
                const selKey = `${m.domain}:${m.id}`;
                const isSelected = selectedMods.has(selKey);
                const currentTag = getTag(m.domain, m.id);
                const nouveau = isNew(m.updatedAt, m.domain, m.id);
                const dateMaj = m.updatedAt
                  ? new Date(
                      Number(m.updatedAt) * (String(m.updatedAt).length > 10 ? 1 : 1000)
                    )
                  : null;
                return (
                  <li
                    className="cr-mod"
                    key={`${m.domain}-${m.id}`}
                    data-testid={`mod-card-${m.id}`}
                    style={
                      isSelected
                        ? { background: "var(--cr-accent-soft)", borderRadius: "var(--cr-radius)" }
                        : undefined
                    }
                  >
                    {m.picture ? (
                      <img src={m.picture} alt="" aria-hidden="true" className="cr-mod-vignette" />
                    ) : (
                      <IconeJeu gameId={m.gameId} className="cr-jeu-icone cr-jeu-icone-lg" />
                    )}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start gap-x-3 gap-y-2 mb-1">
                        <h3 className="text-xl font-bold m-0 flex-1 min-w-0 overflow-wrap-anywhere">
                          {m.name || (
                            <span className="cr-mono">{`${m.domain}/${m.id}`}</span>
                          )}
                        </h3>
                        {nouveau && (
                          <span className="cr-etiquette cr-etiquette-attention">Nouveau</span>
                        )}
                        <EtiquetteStatut statut={currentTag} />
                      </div>

                      <p className="cr-meta m-0 mb-2">
                        <span>
                          par{" "}
                          {m.author ? (
                            <a
                              href={`https://next.nexusmods.com/profile/${encodeURIComponent(m.author)}${m.gameId ? `?gameId=${m.gameId}` : ""}`}
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
                        {m.gameName && <span>{m.gameName}</span>}
                        {m.category && <span>{m.category}</span>}
                        {dateMaj && (
                          <time dateTime={dateMaj.toISOString()}>{dateMaj.toLocaleString()}</time>
                        )}
                      </p>

                      {/* Le passage d'une version à l'autre est la donnée que
                          l'utilisateur vient chercher : elle se lit telle quelle
                          plutôt qu'en deux pastilles côte à côte. */}
                      <p className="cr-transition m-0 mb-2">
                        {m.previousVersion && m.previousVersion !== m.version && (
                          <>
                            <span className="cr-transition-avant">{m.previousVersion}</span>
                            <span aria-hidden="true" style={{ color: "var(--cr-muted)" }}>
                              →
                            </span>
                          </>
                        )}
                        <span className="cr-transition-apres">version {m.version || "?"}</span>
                      </p>

                      {m.summary && <p className="cr-lecture m-0 mb-2">{m.summary}</p>}

                      <EnhancedChangelog mod={m} maxLines={6} />

                      <div
                        className="flex flex-wrap gap-2 mt-3"
                        data-testid={`tag-buttons-${m.id}`}
                      >
                        {Object.entries(TAG_LABELS).map(([tagValue, tagLabel]) => {
                          const actif = currentTag === tagValue;
                          return (
                            <button
                              key={tagValue}
                              type="button"
                              className="cr-bouton"
                              aria-pressed={actif}
                              style={
                                actif
                                  ? {
                                      background: "var(--cr-accent-soft)",
                                      borderColor: "var(--cr-accent)",
                                      color: "var(--cr-accent)",
                                      fontWeight: 600,
                                    }
                                  : undefined
                              }
                              onClick={() => toggleTag(m.domain, m.id, tagValue)}
                            >
                              {tagLabel}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {m.url && (
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noreferrer"
                            className="cr-bouton cr-bouton-principal"
                          >
                            Ouvrir sur Nexus
                          </a>
                        )}
                        {nouveau && (
                          <button
                            type="button"
                            className="cr-bouton"
                            onClick={() => markAsSeen(m.domain, m.id)}
                          >
                            Marquer comme lu
                          </button>
                        )}
                        <button
                          type="button"
                          className="cr-bouton"
                          style={{ color: "var(--cr-crit)", borderColor: "var(--cr-crit)" }}
                          onClick={() => handleUntrack(m.domain, m.id, m.name)}
                          disabled={untracking === m.id}
                        >
                          {untracking === m.id ? "Suppression…" : "Ne plus suivre"}
                        </button>
                        <label className="cr-bouton cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(m.domain, m.id)}
                            className="w-5 h-5"
                            style={{ accentColor: "var(--cr-accent)" }}
                            /* Le nom du mod passe par aria-label plutôt que par
                               un span caché : dix cases « Sélectionner »
                               identiques sont inutilisables au lecteur d'écran,
                               mais dupliquer le nom dans le DOM le rendait
                               ambigu partout ailleurs. */
                            aria-label={`Sélectionner ${m.name || `${m.domain}/${m.id}`}`}
                          />
                          Sélectionner
                        </label>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Barre d'actions de sélection */}
      {selectedMods.size > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50"
          style={{
            background: "var(--cr-surface)",
            borderTop: "1px solid var(--cr-line-strong)",
          }}
        >
          <div className="cr-enveloppe py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="m-0 font-semibold">
              {selectedMods.size} mod{selectedMods.size > 1 ? "s" : ""} sélectionné
              {selectedMods.size > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="cr-bouton" onClick={toggleSelectAll}>
                {selectedMods.size === mods.length ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
              <button
                type="button"
                className="cr-bouton"
                onClick={() => setSelectedMods(new Set())}
              >
                Annuler
              </button>
              <button
                type="button"
                className="cr-bouton"
                style={{ color: "var(--cr-crit)", borderColor: "var(--cr-crit)" }}
                onClick={handleBatchUntrack}
                disabled={batchUntracking}
              >
                {batchUntracking
                  ? "Suppression…"
                  : `Retirer la sélection (${selectedMods.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
