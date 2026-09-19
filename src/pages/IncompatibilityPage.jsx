import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

/* Gravité : un seul endroit décide du mot, de l'étiquette et de la couleur du
   liseré. Le mot passe avant la teinte — un daltonien, une capture en noir et
   blanc ou un lecteur d'écran doivent distinguer un conflit probable d'une
   simple information. */
const GRAVITES = {
  high: { mot: "Conflit probable", etiquette: "cr-etiquette-critique", trait: "var(--cr-crit)", rang: 0 },
  medium: { mot: "Attention recommandée", etiquette: "cr-etiquette-attention", trait: "var(--cr-warn)", rang: 1 },
  low: { mot: "Information", etiquette: "cr-etiquette-neutre", trait: "var(--cr-line-strong)", rang: 2 },
};
const gravite = (severity) => GRAVITES[severity] || GRAVITES.low;

const listeDeConflits = (gc) =>
  [...gc.categoryConflicts, ...gc.authorConflicts, ...gc.outdatedVersions]
    .sort((a, b) => gravite(a.severity).rang - gravite(b.severity).rang);

function JeuIcone({ gameId, taille = "" }) {
  if (!gameId) return null;
  return (
    <img
      src={`https://staticdelivery.nexusmods.com/Images/games/4_3/tile_${gameId}.jpg`}
      alt=""
      aria-hidden="true"
      className={`cr-jeu-icone ${taille}`}
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  );
}

function LienMod({ mod }) {
  return (
    <a
      href={mod.url}
      target="_blank"
      rel="noreferrer"
      className="font-semibold underline-offset-2 hover:underline"
      style={{ color: "var(--cr-ink)" }}
    >
      {mod.name}
    </a>
  );
}

function Entete() {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold m-0" style={{ fontFamily: "var(--cr-display)" }}>
        Incompatibilités
      </h1>
      <p className="cr-lecture mt-2 mb-0" style={{ color: "var(--cr-muted)" }}>
        Analyse automatique des conflits potentiels entre les mods que vous suivez.
      </p>
    </header>
  );
}

export default function IncompatibilityPage() {
  const { loading, error, games, modsForGame } = useOutletContext();
  const [selectedGame, setSelectedGame] = useState("ALL");
  const [showDetails, setShowDetails] = useState({});

  // L'analyse porte sur TOUS les jeux même quand un filtre est actif : c'est ce
  // qui permet d'afficher un compte en face de chaque jeu dans le filtre.
  const conflicts = useMemo(() => {
    const result = [];

    for (const game of games) {
      const key = game.domain || game.gameId || game.name;
      const mods = modsForGame(key);

      // Vérifier les conflits de catégories (plusieurs mods dans des catégories qui devraient être uniques)
      const categoryConflicts = detectCategoryConflicts(mods, game);

      // Vérifier les conflits d'auteur (mods similaires du même auteur)
      const authorConflicts = detectAuthorConflicts(mods, game);

      // Vérifier les versions obsolètes
      const outdatedVersions = detectOutdatedVersions(mods, game);

      if (categoryConflicts.length > 0 || authorConflicts.length > 0 || outdatedVersions.length > 0) {
        result.push({
          game: game.name || game.domain,
          cle: key,
          gameData: game,
          categoryConflicts,
          authorConflicts,
          outdatedVersions,
        });
      }
    }

    return result;
  }, [games, modsForGame]);

  // Détecter les conflits de catégories potentiellement incompatibles
  function detectCategoryConflicts(mods, game) {
    const conflicts = [];
    const criticalCategories = [
      'Overhauls',
      'Combat',
      'Gameplay',
      'User Interface',
      'Visuals and Graphics',
      'ENB Preset',
      'Presets - ENB and ReShade',
      'ReShade Presets',
    ];

    const categorizedMods = {};

    mods.forEach(mod => {
      const category = mod.category || 'Uncategorized';
      if (criticalCategories.some(c => category.includes(c))) {
        if (!categorizedMods[category]) {
          categorizedMods[category] = [];
        }
        categorizedMods[category].push(mod);
      }
    });

    Object.entries(categorizedMods).forEach(([category, modsInCategory]) => {
      if (modsInCategory.length > 1) {
        conflicts.push({
          type: 'category',
          category,
          mods: modsInCategory,
          severity: 'medium',
          message: `${modsInCategory.length} mods dans la catégorie "${category}" peuvent entrer en conflit`,
        });
      }
    });

    return conflicts;
  }

  // Détecter les mods similaires du même auteur (probablement incompatibles entre eux)
  function detectAuthorConflicts(mods, game) {
    const conflicts = [];
    const authorMods = {};

    mods.forEach(mod => {
      const author = mod.author || 'Unknown';
      if (!authorMods[author]) {
        authorMods[author] = [];
      }
      authorMods[author].push(mod);
    });

    Object.entries(authorMods).forEach(([author, modsFromAuthor]) => {
      if (modsFromAuthor.length > 1) {
        // Vérifier si les noms sont similaires (possibles variantes)
        const names = modsFromAuthor.map(m => m.name.toLowerCase());
        const hasSimilarNames = names.some((name, i) =>
          names.slice(i + 1).some(otherName =>
            name.includes(otherName.substring(0, 10)) ||
            otherName.includes(name.substring(0, 10))
          )
        );

        if (hasSimilarNames) {
          conflicts.push({
            type: 'author',
            author,
            mods: modsFromAuthor,
            severity: 'high',
            message: `Plusieurs variantes de mods du même auteur (${author}) détectées`,
          });
        }
      }
    });

    return conflicts;
  }

  // Détecter les versions très anciennes (possibles incompatibilités avec des mods récents)
  function detectOutdatedVersions(mods, game) {
    const conflicts = [];
    const now = Math.floor(Date.now() / 1000);
    const sixMonthsAgo = now - (6 * 30 * 24 * 3600);
    const oneYearAgo = now - (365 * 24 * 3600);

    const veryOldMods = mods.filter(m => {
      const updatedAt = Number(m.updatedAt || 0);
      return updatedAt > 0 && updatedAt < oneYearAgo;
    });

    const recentMods = mods.filter(m => {
      const updatedAt = Number(m.updatedAt || 0);
      return updatedAt >= sixMonthsAgo;
    });

    if (veryOldMods.length > 0 && recentMods.length > 0) {
      conflicts.push({
        type: 'version',
        oldMods: veryOldMods,
        recentMods: recentMods,
        severity: 'low',
        message: `${veryOldMods.length} mod(s) ancien(s) (>1 an) avec ${recentMods.length} mod(s) récent(s) (<6 mois)`,
      });
    }

    return conflicts;
  }

  const toggleDetails = (gameIndex, conflictIndex) => {
    const key = `${gameIndex}-${conflictIndex}`;
    setShowDetails(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const conflitsVisibles = selectedGame === "ALL"
    ? conflicts
    : conflicts.filter(c => c.cle === selectedGame);

  const comptes = { high: 0, medium: 0, low: 0 };
  for (const gc of conflitsVisibles) {
    for (const c of listeDeConflits(gc)) comptes[c.severity] = (comptes[c.severity] || 0) + 1;
  }

  const comptePourJeu = (cle) => {
    const gc = conflicts.find(c => c.cle === cle);
    return gc ? listeDeConflits(gc).length : 0;
  };

  if (loading) {
    return (
      <div className="cr-enveloppe py-8">
        <Entete />
        <p style={{ color: "var(--cr-muted)" }}>Analyse en cours…</p>
      </div>
    );
  }

  if (error) {
    const configRequise = error.includes("credentials") || error.includes("401");
    return (
      <div className="cr-enveloppe py-8">
        <Entete />
        <section
          className="cr-depeche cr-lecture"
          aria-labelledby="cr-erreur-titre"
          style={configRequise ? undefined : {
            background: "var(--cr-crit-soft)",
            borderColor: "var(--cr-crit)",
            borderInlineStartColor: "var(--cr-crit)",
          }}
        >
          <p className="cr-depeche-marqueur m-0" style={configRequise ? undefined : { color: "var(--cr-crit)" }}>
            {configRequise ? "À faire" : "Erreur"}
          </p>
          <div>
            <h2 id="cr-erreur-titre" className="text-xl font-semibold m-0">
              {configRequise ? "Configuration requise" : "L'analyse n'a pas pu aboutir"}
            </h2>
            {configRequise ? (
              <p className="mt-2 mb-0">
                Renseignez vos identifiants Nexus Mods pour utiliser cette page : le bouton{" "}
                <strong>Config</strong> se trouve dans la barre de navigation.
              </p>
            ) : (
              <p className="mt-2 mb-0">{error}</p>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (!games.length) {
    return (
      <div className="cr-enveloppe py-8">
        <Entete />
        <section className="cr-vide cr-lecture">
          <h2 className="text-xl font-semibold m-0" style={{ color: "var(--cr-ink)" }}>
            Aucun mod suivi pour l'instant
          </h2>
          <p className="mt-2">
            L'analyse a besoin d'une liste de mods pour chercher des conflits. Deux étapes :
          </p>
          <ol className="list-decimal ml-5 space-y-1 m-0">
            <li>activez le suivi sur vos mods favoris depuis Nexus Mods ;</li>
            <li>revenez ici, l'analyse se lance toute seule.</li>
          </ol>
        </section>
      </div>
    );
  }

  return (
    <div className="cr-enveloppe py-8">
      <Entete />

      {/* Les chiffres d'abord : ils disent en un coup d'œil s'il y a lieu de
          s'inquiéter, avant d'avoir lu un seul conflit. */}
      <dl className="grid gap-3 sm:grid-cols-3 m-0 mb-8">
        <div className="cr-chiffre">
          <dt>Conflits probables</dt>
          <dd style={{ color: comptes.high ? "var(--cr-crit)" : undefined }}>{comptes.high}</dd>
          <div className="cr-precision">à examiner en priorité</div>
        </div>
        <div className="cr-chiffre">
          <dt>Points d'attention</dt>
          <dd style={{ color: comptes.medium ? "var(--cr-warn)" : undefined }}>{comptes.medium}</dd>
          <div className="cr-precision">à vérifier si un problème survient</div>
        </div>
        <div className="cr-chiffre">
          <dt>Informations</dt>
          <dd>{comptes.low}</dd>
          <div className="cr-precision">sans gravité connue</div>
        </div>
      </dl>

      <section className="mb-8" aria-labelledby="cr-filtre-titre">
        <h2 id="cr-filtre-titre" className="text-lg font-semibold mt-0 mb-3">Filtrer par jeu</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            className="cr-filtre"
            aria-pressed={selectedGame === "ALL"}
            onClick={() => setSelectedGame("ALL")}
          >
            <span>Tous les jeux</span>
            <span className="cr-compte">
              {conflicts.reduce((n, gc) => n + listeDeConflits(gc).length, 0)}
              <span className="cr-visuellement-cache"> conflits</span>
            </span>
          </button>
          {games.map((g) => {
            const cle = g.domain || g.gameId || g.name;
            return (
              <button
                key={g.key}
                type="button"
                className="cr-filtre"
                aria-pressed={selectedGame === cle}
                onClick={() => setSelectedGame(cle)}
              >
                <JeuIcone gameId={g.gameId} taille="cr-jeu-icone-sm" />
                <span className="truncate">{g.name}</span>
                <span className="cr-compte">
                  {comptePourJeu(cle)}
                  <span className="cr-visuellement-cache"> conflits</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {conflitsVisibles.length === 0 ? (
        <section className="cr-vide cr-lecture">
          <p className="cr-etiquette cr-etiquette-ok m-0">Aucun conflit détecté</p>
          <p className="mt-3" style={{ color: "var(--cr-ink)" }}>
            Les mods {selectedGame === "ALL" ? "que vous suivez" : "de ce jeu"} ne présentent aucun
            signe de conflit : pas de doublon dans une catégorie sensible, pas de variantes d'un même
            auteur, pas d'écart de fraîcheur inquiétant. Rien à faire de votre côté.
          </p>
          <p className="mt-3 mb-0">
            L'analyse reste automatique et ne lit pas les pages de mods. En cas de crash inexpliqué,
            la section « Incompatibilities » sur Nexus Mods reste la référence.
          </p>
        </section>
      ) : (
        <div className="space-y-10">
          {conflitsVisibles.map((gameConflict, gameIndex) => (
            <section key={gameConflict.cle || gameIndex} aria-labelledby={`cr-jeu-${gameIndex}`}>
              <div className="flex items-center gap-3 pb-3 mb-4 border-b" style={{ borderColor: "var(--cr-line)" }}>
                <JeuIcone gameId={gameConflict.gameData?.gameId} taille="cr-jeu-icone-lg" />
                <h2
                  id={`cr-jeu-${gameIndex}`}
                  className="text-2xl font-semibold m-0"
                  style={{ fontFamily: "var(--cr-display)" }}
                >
                  {gameConflict.game}
                </h2>
              </div>

              <div className="space-y-4">
                {listeDeConflits(gameConflict).map((conflict, conflictIndex) => {
                  const key = `${gameIndex}-${conflictIndex}`;
                  const isOpen = Boolean(showDetails[key]);
                  const g = gravite(conflict.severity);

                  return (
                    <article
                      key={conflictIndex}
                      className="p-4 sm:p-5"
                      style={{
                        background: "var(--cr-surface)",
                        border: "1px solid var(--cr-line)",
                        borderInlineStartWidth: "5px",
                        borderInlineStartColor: g.trait,
                        borderRadius: "var(--cr-radius)",
                      }}
                    >
                      {/* Mobile d'abord : l'étiquette et le bouton s'empilent au lieu
                          de se comprimer sur une seule ligne. */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <p className={`cr-etiquette ${g.etiquette} m-0`}>{g.mot}</p>
                          <p className="cr-lecture mt-2 mb-0">{conflict.message}</p>
                        </div>
                        <button
                          type="button"
                          className="cr-bouton self-start"
                          aria-expanded={isOpen}
                          aria-controls={`cr-detail-${key}`}
                          onClick={() => toggleDetails(gameIndex, conflictIndex)}
                        >
                          {isOpen ? "Masquer le détail" : "Afficher le détail"}
                        </button>
                      </div>

                      {isOpen && (
                        <div
                          id={`cr-detail-${key}`}
                          className="mt-4 pt-4 border-t"
                          style={{ borderColor: "var(--cr-line)" }}
                        >
                          {conflict.type === 'category' && (
                            <>
                              <h3 className="text-base font-semibold mt-0 mb-2">Mods concernés</h3>
                              <ul className="list-none p-0 m-0 space-y-2">
                                {conflict.mods.map((mod, idx) => (
                                  <li key={idx}>
                                    <LienMod mod={mod} />
                                    <span className="cr-meta">
                                      <span>par {mod.author}</span>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}

                          {conflict.type === 'author' && (
                            <>
                              <h3 className="text-base font-semibold mt-0 mb-2">Mods du même auteur</h3>
                              <ul className="list-none p-0 m-0 space-y-2">
                                {conflict.mods.map((mod, idx) => (
                                  <li key={idx}>
                                    <LienMod mod={mod} />
                                    <span className="cr-meta">
                                      <span className="cr-mono">v{mod.version}</span>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              <p className="cr-lecture mt-3 mb-0" style={{ color: "var(--cr-muted)" }}>
                                Vérifiez les descriptions : ces mods sont peut-être des alternatives
                                entre lesquelles il faut choisir, ou au contraire des compléments.
                              </p>
                            </>
                          )}

                          {conflict.type === 'version' && (
                            <>
                              <h3 className="text-base font-semibold mt-0 mb-2">
                                Mods anciens (plus d'un an)
                              </h3>
                              <ul className="list-none p-0 m-0 space-y-2">
                                {conflict.oldMods.slice(0, 5).map((mod, idx) => (
                                  <li key={idx}>
                                    <LienMod mod={mod} />
                                    <span className="cr-meta">
                                      <time dateTime={new Date(Number(mod.updatedAt) * 1000).toISOString()}>
                                        mis à jour le {new Date(Number(mod.updatedAt) * 1000).toLocaleDateString("fr-FR")}
                                      </time>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              {conflict.oldMods.length > 5 && (
                                <p className="mt-2 mb-0 text-sm" style={{ color: "var(--cr-muted)" }}>
                                  et {conflict.oldMods.length - 5} autre(s) non listé(s).
                                </p>
                              )}
                              <p className="cr-lecture mt-3 mb-0" style={{ color: "var(--cr-muted)" }}>
                                Un mod ancien peut viser une version du jeu que vous n'utilisez plus,
                                ou dépendre d'une bibliothèque que les mods récents ont remplacée.
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <section
        className="mt-12 pt-6 border-t"
        style={{ borderColor: "var(--cr-line)" }}
        aria-labelledby="cr-notes-titre"
      >
        <h2 id="cr-notes-titre" className="text-lg font-semibold mt-0 mb-3">
          Ce que cette analyse ne fait pas
        </h2>
        <ul className="cr-lecture list-disc ml-5 space-y-2 m-0" style={{ color: "var(--cr-muted)" }}>
          <li>Elle ne lit pas les pages de mods : les sections « Requirements » et « Incompatibilities » sur Nexus Mods restent à consulter.</li>
          <li>Elle ignore les patches de compatibilité, qui résolvent une partie des conflits signalés ici.</li>
          <li>Elle ne juge pas l'ordre de chargement, déterminant pour les mods de gameplay.</li>
          <li>Pour Skyrim et Fallout, LOOT reste l'outil de référence pour cet ordre de chargement.</li>
        </ul>
      </section>
    </div>
  );
}
