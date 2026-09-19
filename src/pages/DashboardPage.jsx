import { useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import useDashboardStats from "../components/useDashboardStats";
import useLastVisit from "../components/useLastVisit";

export default function DashboardPage() {
  const { loading, error, games, modsForGame, refresh, steamAlerts, dismissAlert, dismissAllAlerts } =
    useOutletContext();
  const { updateLastVisit } = useLastVisit();
  const stats = useDashboardStats(games, modsForGame);

  // Les alertes viennent de useSteamGames, qui compare les buildId Steam d'une
  // visite a l'autre. Le tableau de bord se contente de les presenter : on
  // retrouve l'identifiant de jeu Nexus depuis `games` pour la vignette, que
  // l'alerte Steam ne porte pas.
  const updatedGames = useMemo(
    () =>
      (steamAlerts || []).map((a) => ({
        id: a.id,
        gameKey: a.domain,
        gameName: a.gameName,
        gameId: (games || []).find((g) => g.domain === a.domain)?.gameId,
        // Le champ `version` de Steam vaut le plus souvent "Not available" :
        // c'est le buildId qui porte l'information de patch.
        previousVersion: a.oldBuildId || a.oldVersion,
        currentVersion: a.newBuildId || a.newVersion,
      })),
    [steamAlerts, games]
  );

  useEffect(() => {
    const timer = setTimeout(() => updateLastVisit(), 2000);
    return () => clearTimeout(timer);
  }, [updateLastVisit]);

  if (loading) {
    return (
      <div className="cr-enveloppe py-8">
        <p style={{ color: "var(--cr-muted)" }}>Chargement du tableau de bord…</p>
      </div>
    );
  }

  if (error) {
    if (error.includes("credentials") || error.includes("401")) {
      return (
        <div className="cr-enveloppe py-8 cr-lecture">
          <p className="m-0 mb-2">
            <span className="cr-etiquette cr-etiquette-attention">Configuration requise</span>
          </p>
          <h1 className="text-2xl font-semibold mb-2">Vos identifiants Nexus manquent</h1>
          <p className="mb-0">
            The Courrier lit votre liste de mods suivis via l’API Nexus Mods : sans nom d’utilisateur
            ni clé d’API, il n’a rien à afficher. Ouvrez <strong>Config</strong> dans l’en-tête pour
            les renseigner.
          </p>
        </div>
      );
    }
    return (
      <div className="cr-enveloppe py-8 cr-lecture">
        <p className="m-0 mb-2">
          <span className="cr-etiquette cr-etiquette-critique">Erreur</span>
        </p>
        <h1 className="text-2xl font-semibold mb-2">Le tableau de bord n’a pas pu être chargé</h1>
        <p className="mb-0" style={{ color: "var(--cr-muted)" }}>
          {error}
        </p>
      </div>
    );
  }

  if (!games.length) {
    return (
      <div className="cr-enveloppe py-8 cr-lecture">
        <h1 className="text-3xl font-semibold mb-2">Bienvenue sur The Courrier</h1>
        <p className="mb-6">
          The Courrier surveille les mods que vous suivez sur Nexus Mods et vous dit lesquels ont
          bougé — sans que vous ayez à rouvrir chaque page.
        </p>

        <h2 className="text-xl font-semibold mb-3">Pour voir vos mods apparaître ici</h2>
        <ol className="m-0 p-0 list-none flex flex-col">
          {[
            <>
              Rendez-vous sur{" "}
              <a href="https://www.nexusmods.com" target="_blank" rel="noreferrer" style={{ color: "var(--cr-accent)" }}>
                Nexus Mods
              </a>
            </>,
            "Connectez-vous avec votre compte",
            "Activez le suivi (« Track ») sur les mods qui vous intéressent",
            "Revenez ici : la liste se remplit toute seule",
          ].map((etape, idx) => (
            <li
              key={idx}
              className="flex items-baseline gap-3 py-3 border-b"
              style={{ borderColor: "var(--cr-line)" }}
            >
              <span className="cr-mono flex-shrink-0" style={{ color: "var(--cr-muted)" }} aria-hidden="true">
                {idx + 1}
              </span>
              <span>{etape}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Tuile de chiffre. L'emoji décoratif et le liseré coloré sont retirés :
  // ils signalaient une différence de nature entre les tuiles qui n'existait
  // pas. Le chiffre est l'information, il porte la hiérarchie.
  const StatCard = ({ title, value, subtitle }) => (
    <div className="cr-chiffre">
      <dt>{title}</dt>
      <dd>{value}</dd>
      {subtitle && <div className="cr-precision">{subtitle}</div>}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold" style={{ letterSpacing: "-0.02em" }}>
          Tableau de bord
        </h1>
        <button className="cr-bouton w-fit" onClick={refresh}>
          Rafraîchir
        </button>
      </div>

      {/* Dépêche : un patch de jeu casse souvent les mods, c'est
          l'information la plus urgente de l'écran. Une entrée par jeu, avec la
          transition de build lisible telle quelle — c'est la donnée propre à ce
          produit, elle mérite mieux qu'une phrase. */}
      {updatedGames && updatedGames.length > 0 && (
        <section className="mb-8 flex flex-col gap-3" aria-label="Mises à jour de jeu détectées">
          {updatedGames.map((game) => (
            <div key={game.id} className="cr-depeche">
              {game.gameId ? (
                <img
                  src={`https://staticdelivery.nexusmods.com/Images/games/4_3/tile_${game.gameId}.jpg`}
                  alt=""
                  aria-hidden="true"
                  className="cr-jeu-icone cr-jeu-icone-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="cr-jeu-icone cr-jeu-icone-lg" aria-hidden="true" />
              )}

              <div>
                <p className="m-0 mb-1">
                  <span className="cr-depeche-marqueur">Patch détecté</span>
                </p>
                <h2 className="text-lg m-0">{game.gameName} a été mis à jour</h2>

                <p className="cr-transition mt-1 mb-0">
                  <span className="cr-transition-avant">build {game.previousVersion}</span>
                  <span aria-hidden="true" style={{ color: "var(--cr-muted)" }}>
                    →
                  </span>
                  <span className="cr-transition-apres">build {game.currentVersion}</span>
                </p>

                {/* Le « pourquoi » plutôt qu'un simple avertissement : c'est ce
                    qui dit à l'utilisateur quoi faire de l'information. */}
                <p className="mt-2 mb-0">
                  Les mods dépendants d’un chargeur de scripts (SKSE, F4SE…) cessent
                  généralement de fonctionner après une mise à jour du moteur. Vérifiez vos
                  mods avant de relancer une partie.
                </p>
              </div>

              <div className="col-span-full flex flex-wrap gap-2">
                <button type="button" className="cr-bouton" onClick={() => dismissAlert(game.id)}>
                  Masquer
                </button>
                {updatedGames.length > 1 && (
                  <button type="button" className="cr-bouton" onClick={dismissAllAlerts}>
                    Tout masquer
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Chiffres clés. Une liste de définitions plutôt qu'une grille de
          <div> : chaque tuile est bien un couple libellé/valeur, et un lecteur
          d'écran l'annonce comme tel. La grille s'ajuste d'elle-même au nombre
          de tuiles qui tiennent, sans point de rupture à maintenir. */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Vue d'ensemble</h2>
        <dl className="grid gap-4 m-0" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <StatCard title="Mods suivis" value={stats.totalMods} subtitle={`sur ${stats.totalGames} jeux`} />
          <StatCard
            title="Mises à jour (7 jours)"
            value={stats.updatesLast7Days}
            subtitle={`${stats.updatesLast30Days} sur 30 jours`}
          />
          <StatCard
            title="Sans activité (1 an+)"
            value={stats.staleMods}
            subtitle={
              stats.totalMods
                ? `${Math.round((stats.staleMods / stats.totalMods) * 100)} % du total`
                : undefined
            }
          />
          <StatCard title="Jeux suivis" value={stats.totalGames} />
        </dl>
      </section>

      {/* Jeux bougés cette semaine. Le titre de mod était tronqué par
          `truncate` : un nom coupé au milieu ne permet pas de reconnaître le
          mod, alors que la place existe sur deux lignes. */}
      {stats.gamesWithUpdates && stats.gamesWithUpdates.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Mises à jour des 7 derniers jours</h2>

          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}
          >
            {stats.gamesWithUpdates.map((game) => (
              <article key={game.gameId ?? game.gameName}>
                <header className="flex items-center gap-3 mb-3">
                  {game.gameId ? (
                    <img
                      src={`https://staticdelivery.nexusmods.com/Images/games/4_3/tile_${game.gameId}.jpg`}
                      alt=""
                      aria-hidden="true"
                      className="cr-jeu-icone cr-jeu-icone-lg"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  ) : (
                    <span className="cr-jeu-icone cr-jeu-icone-lg" aria-hidden="true" />
                  )}
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold m-0 overflow-wrap-anywhere">
                      {game.gameName}
                    </h3>
                    <p className="cr-meta mt-1 mb-0">
                      <span>
                        {game.updateCount} mise{game.updateCount > 1 ? "s" : ""} à jour
                      </span>
                      <span>
                        sur {game.totalMods} mod{game.totalMods > 1 ? "s" : ""} suivi
                        {game.totalMods > 1 ? "s" : ""}
                      </span>
                    </p>
                  </div>
                </header>

                <ul className="m-0 p-0 list-none flex flex-col">
                  {game.recentMods.map((mod) => (
                    <li
                      key={mod.id}
                      className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 border-b"
                      style={{ borderColor: "var(--cr-line)" }}
                    >
                      <a
                        href={mod.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 font-semibold min-w-0 overflow-wrap-anywhere"
                        style={{ color: "var(--cr-ink)" }}
                      >
                        {mod.name || `Mod ${mod.id}`}
                      </a>
                      <span className="cr-meta m-0">
                        <time dateTime={new Date(Number(mod.updatedAt) * 1000).toISOString()}>
                          {new Date(Number(mod.updatedAt) * 1000).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </time>
                        {mod.version && <span className="cr-mono">v{mod.version}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Activité récente. Deux cartes côte à côte sont devenues une liste :
          ce sont deux mods, pas deux natures d'objet, et une liste se lit dans
          l'ordre au lieu de forcer un aller-retour du regard. L'étiquette dit
          ce que chaque entrée est — l'emoji décoratif ne le disait pas. */}
      <section className="mb-8 cr-lecture">
        <h2 className="text-xl font-semibold mb-2">Activité récente</h2>

        {stats.mostRecentMod && (
          <article className="cr-mod">
            {stats.mostRecentMod.picture ? (
              <img
                src={stats.mostRecentMod.picture}
                alt=""
                aria-hidden="true"
                className="cr-mod-vignette"
                loading="lazy"
              />
            ) : (
              <span className="cr-mod-vignette" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <h3 className="text-lg m-0 overflow-wrap-anywhere">
                <a
                  href={stats.mostRecentMod.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {stats.mostRecentMod.name}
                </a>
              </h3>
              <p className="cr-meta mt-1 mb-0">
                <span>par {stats.mostRecentMod.author || "auteur inconnu"}</span>
                <time dateTime={new Date(Number(stats.mostRecentMod.updatedAt) * 1000).toISOString()}>
                  {new Date(Number(stats.mostRecentMod.updatedAt) * 1000).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <span className="cr-etiquette cr-etiquette-ok">Le plus récent</span>
              </p>
            </div>
          </article>
        )}

        {stats.oldestMod && (
          <article className="cr-mod">
            {stats.oldestMod.picture ? (
              <img
                src={stats.oldestMod.picture}
                alt=""
                aria-hidden="true"
                className="cr-mod-vignette"
                loading="lazy"
              />
            ) : (
              <span className="cr-mod-vignette" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <h3 className="text-lg m-0 overflow-wrap-anywhere">
                <a
                  href={stats.oldestMod.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {stats.oldestMod.name}
                </a>
              </h3>
              <p className="cr-meta mt-1 mb-0">
                <span>par {stats.oldestMod.author || "auteur inconnu"}</span>
                <time dateTime={new Date(Number(stats.oldestMod.updatedAt) * 1000).toISOString()}>
                  {new Date(Number(stats.oldestMod.updatedAt) * 1000).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <span className="cr-etiquette cr-etiquette-attention">Le plus ancien</span>
              </p>
            </div>
          </article>
        )}

        {/* Le chiffre des mods dormants mérite d'être expliqué plutôt
            qu'affiché : beaucoup de mods sont simplement terminés. */}
        {stats.staleMods > 0 && (
          <p className="cr-vide mt-4 mb-0">
            <strong style={{ color: "var(--cr-ink)" }}>
              {stats.staleMods} de vos {stats.totalMods} mods n’ont rien reçu depuis plus d’un an.
            </strong>
            <br />
            Ce n’est pas forcément un problème — beaucoup de mods sont simplement terminés.
          </p>
        )}
      </section>

      {/* Activité hebdomadaire.

          L'ancienne barre était un dégradé bleu→violet dont la largeur valait
          `count / totalMods × 500` : un facteur 5 arbitraire qui faisait
          déborder l'échelle dès qu'une semaine dépassait 20 % du total, et une
          couleur qui variait sur sa longueur sans coder quoi que ce soit.

          Ici une seule échelle, celle de la semaine la plus chargée, et le
          chiffre écrit à côté de la barre plutôt que dedans — il reste lisible
          quand la barre est courte. */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-1">Activité des 4 dernières semaines</h2>
        <p className="mb-4" style={{ color: "var(--cr-muted)" }}>
          Nombre de vos mods mis à jour chaque semaine.
        </p>

        <dl className="m-0 flex flex-col gap-3">
          {stats.timeline.map((week) => {
            const maximum = Math.max(1, ...stats.timeline.map((s) => s.count));
            return (
              <div key={week.label} className="flex items-center gap-3">
                <dt className="flex-shrink-0 w-28 sm:w-36" style={{ color: "var(--cr-muted)" }}>
                  {week.label}
                </dt>
                <dd className="flex-1 flex items-center gap-3 m-0 min-w-0">
                  <div
                    className="flex-1 rounded overflow-hidden"
                    style={{ height: "14px", background: "var(--cr-surface-2)" }}
                  >
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${(week.count / maximum) * 100}%`,
                        background: "var(--cr-accent)",
                      }}
                    />
                  </div>
                  <span
                    className="cr-mono flex-shrink-0 text-right"
                    style={{ minWidth: "3ch", fontVariantNumeric: "tabular-nums" }}
                  >
                    {week.count}
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>

        <p className="mt-4 mb-0" style={{ color: "var(--cr-muted)" }}>
          En moyenne, vos mods ont reçu leur dernière mise à jour il y a{" "}
          <strong style={{ color: "var(--cr-ink)" }}>{stats.avgDaysSinceUpdate} jours</strong>.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Répartition par jeu. L'icône du jeu à la place d'une pastille : sur
            une liste de titres qui se ressemblent à l'écrit (trois Elder
            Scrolls, deux Fallout), la tuile Nexus est ce que l'œil reconnaît
            en premier. */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Répartition par jeu</h2>

          <dl className="m-0 flex flex-col gap-4">
            {stats.gameDistribution.map((game) => (
              <div key={game.name}>
                <div className="flex items-center gap-3">
                  {game.gameId ? (
                    <img
                      src={`https://staticdelivery.nexusmods.com/Images/games/4_3/tile_${game.gameId}.jpg`}
                      alt=""
                      aria-hidden="true"
                      className="cr-jeu-icone"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  ) : (
                    <span className="cr-jeu-icone" aria-hidden="true" />
                  )}
                  <dt className="flex-1 font-semibold min-w-0 overflow-wrap-anywhere">
                    {game.name}
                  </dt>
                  <dd
                    className="cr-mono m-0 flex-shrink-0"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {game.count}
                    <span style={{ color: "var(--cr-muted)" }}> · {game.percentage} %</span>
                  </dd>
                </div>
                <div
                  className="rounded overflow-hidden mt-2"
                  style={{ height: "8px", background: "var(--cr-surface-2)" }}
                >
                  <div
                    className="h-full rounded"
                    style={{ width: `${game.percentage}%`, background: "var(--cr-accent)" }}
                  />
                </div>
              </div>
            ))}
          </dl>

          {stats.mostActiveGame && (
            <p
              className="mt-4 mb-0 pt-4 border-t"
              style={{ borderColor: "var(--cr-line)", color: "var(--cr-muted)" }}
            >
              Votre jeu le plus suivi est{" "}
              <strong style={{ color: "var(--cr-ink)" }}>{stats.mostActiveGame.name}</strong>, avec{" "}
              <strong style={{ color: "var(--cr-ink)" }}>{stats.mostActiveGame.count} mods</strong>.
            </p>
          )}
        </section>

        {/* Catégories. Un classement : le rang porte une information, il reste.
            La pastille violette, elle, n'en portait aucune. */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Catégories les plus suivies</h2>

          {stats.topCategories.length > 0 ? (
            <ol className="m-0 p-0 list-none flex flex-col">
              {stats.topCategories.map((cat, idx) => (
                <li
                  key={cat.category}
                  className="flex items-baseline gap-3 py-3 border-b"
                  style={{ borderColor: "var(--cr-line)" }}
                >
                  <span
                    className="cr-mono flex-shrink-0"
                    style={{ color: "var(--cr-muted)", minWidth: "2ch" }}
                    aria-hidden="true"
                  >
                    {idx + 1}
                  </span>
                  <span className="flex-1 font-semibold min-w-0 overflow-wrap-anywhere">
                    {cat.category}
                  </span>
                  <span
                    className="cr-mono flex-shrink-0"
                    style={{ color: "var(--cr-muted)", fontVariantNumeric: "tabular-nums" }}
                  >
                    {cat.count} mod{cat.count > 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="cr-vide m-0">
              Aucune catégorie n’est renseignée sur les mods que vous suivez.
            </p>
          )}
        </section>
      </div>

      {/* Auteurs. Trois colonnes de cartes grises sont devenues un classement :
          ce sont cinq lignes de même nature, pas cinq objets distincts. */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Auteurs les plus suivis</h2>

        {stats.topAuthors.length > 0 ? (
          <ol className="m-0 p-0 list-none grid gap-x-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {stats.topAuthors.map((author, idx) => (
              <li
                key={author.author}
                className="flex items-baseline gap-3 py-3 border-b"
                style={{ borderColor: "var(--cr-line)" }}
              >
                <span
                  className="cr-mono flex-shrink-0"
                  style={{ color: "var(--cr-muted)", minWidth: "2ch" }}
                  aria-hidden="true"
                >
                  {idx + 1}
                </span>
                <a
                  href={`https://next.nexusmods.com/profile/${encodeURIComponent(author.author)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 font-semibold min-w-0 overflow-wrap-anywhere"
                  style={{ color: "var(--cr-accent)" }}
                >
                  {author.author}
                </a>
                <span
                  className="cr-mono flex-shrink-0"
                  style={{ color: "var(--cr-muted)", fontVariantNumeric: "tabular-nums" }}
                >
                  {author.count} mod{author.count > 1 ? "s" : ""}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="cr-vide m-0">
            Aucun auteur n’est renseigné sur les mods que vous suivez.
          </p>
        )}
      </section>

      {/* Mods dormants. Le titre disait « nécessitant attention » sous un
          triangle jaune, alors que le texte juste dessous expliquait que ces
          mods vont sans doute très bien. Le titre dit maintenant ce qui est
          mesuré — la date — et laisse l'utilisateur juger. */}
      {stats.staleMods > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-1">
            Sans mise à jour depuis plus d’un an ({stats.staleMods})
          </h2>
          <p className="cr-lecture mb-4" style={{ color: "var(--cr-muted)" }}>
            Un mod peut rester inchangé parce qu’il est terminé, ou parce qu’il est abandonné.
            La date seule ne permet pas de trancher.
          </p>

          <ul className="m-0 p-0 list-none flex flex-col">
            {stats.staleModsList.map((mod) => {
              const maj = new Date(Number(mod.updatedAt) * 1000);
              const ans = Math.floor(
                (Date.now() / 1000 - Number(mod.updatedAt)) / (365 * 24 * 3600)
              );
              return (
                <li
                  key={`${mod.domain}/${mod.id}`}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3 border-b"
                  style={{ borderColor: "var(--cr-line)" }}
                >
                  <span className="font-semibold flex-1 min-w-0 overflow-wrap-anywhere">
                    {mod.name || `${mod.domain}/${mod.id}`}
                  </span>
                  <span className="cr-meta m-0">
                    <time dateTime={maj.toISOString()}>
                      {maj.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                    <span>
                      il y a {ans} an{ans > 1 ? "s" : ""}
                    </span>
                  </span>
                  <a
                    href={mod.url}
                    target="_blank"
                    rel="noreferrer"
                    className="cr-bouton"
                    style={{ textDecoration: "none" }}
                  >
                    Ouvrir sur Nexus
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
