/**
 * Informations Steam d'un jeu : build en cours et date de la dernière mise à
 * jour du moteur. C'est ce qui permet de comprendre pourquoi un mod vient de
 * cesser de fonctionner.
 *
 * L'ancienne version tenait dans un encadré bleu avec des libellés à 10 px,
 * une pastille orange « ⚠️ Données possiblement obsolètes » et un Build ID
 * tronqué à dix caractères suivis de points de suspension — un identifiant
 * coupé ne sert à rien, c'est justement la valeur qu'on veut comparer.
 */
export default function SteamGameInfo({ domain, steamInfo }) {
  if (!steamInfo) {
    return null;
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return null;
    return new Date(timestamp);
  };

  const maj = formatDate(steamInfo.lastUpdate);

  return (
    <section
      className="mt-3 p-3"
      style={{
        background: "var(--cr-surface-2)",
        border: "1px solid var(--cr-line)",
        borderRadius: "var(--cr-radius)",
      }}
      aria-label="Informations Steam"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
        <h4 className="text-base font-semibold m-0">Version du jeu sur Steam</h4>
        <span className="cr-etiquette cr-etiquette-neutre">Indicatif</span>
      </div>

      <dl className="m-0 flex flex-col gap-1">
        {steamInfo.buildId && (
          <div className="flex flex-wrap justify-between gap-x-3">
            <dt style={{ color: "var(--cr-muted)" }}>Build</dt>
            <dd className="cr-mono m-0">{steamInfo.buildId}</dd>
          </div>
        )}
        <div className="flex flex-wrap justify-between gap-x-3">
          <dt style={{ color: "var(--cr-muted)" }}>Dernière mise à jour</dt>
          <dd className="m-0">
            {maj ? (
              <time dateTime={maj.toISOString()}>
                {maj.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            ) : (
              "inconnue"
            )}
          </dd>
        </div>
      </dl>

      <p className="mt-2 mb-0" style={{ color: "var(--cr-muted)" }}>
        Steam ne publie pas de date fiable par build : cette date peut avoir plusieurs jours de
        retard. SteamDB donne la valeur exacte.
      </p>

      {steamInfo.appId && (
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`https://store.steampowered.com/app/${steamInfo.appId}`}
            target="_blank"
            rel="noreferrer"
            className="cr-bouton"
            style={{ textDecoration: "none" }}
          >
            Voir sur Steam
          </a>
          <a
            href={`https://steamdb.info/app/${steamInfo.appId}/`}
            target="_blank"
            rel="noreferrer"
            className="cr-bouton"
            style={{ textDecoration: "none" }}
          >
            Dates précises sur SteamDB
          </a>
        </div>
      )}
    </section>
  );
}
