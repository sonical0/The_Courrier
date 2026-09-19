/**
 * Alertes flottantes : un jeu suivi vient de changer de build.
 *
 * C'est l'information la plus urgente de l'application — un patch de moteur
 * casse les mods qui dépendent d'un chargeur de scripts. L'ancienne version la
 * rendait en jaune sur jaune, avec un texte à 12 px et un triangle emoji pour
 * seule mention de gravité ; le bouton de fermeture faisait 20 px, sous le
 * seuil tactile. Elle n'était par ailleurs annoncée par aucun rôle ARIA alors
 * qu'elle apparaît sans action de l'utilisateur.
 */
export default function GameUpdateAlert({ alerts, onDismiss, onDismissAll }) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-50 flex flex-col gap-2"
      style={{
        bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
        right: "1rem",
        left: "1rem",
        maxWidth: "28rem",
        marginLeft: "auto",
      }}
    >
      {alerts.map((alert) => (
        <article
          key={alert.id}
          className="p-4 animate-slide-in"
          style={{
            background: "var(--cr-surface)",
            borderLeft: "4px solid var(--cr-warn)",
            border: "1px solid var(--cr-line)",
            borderLeftWidth: "4px",
            borderLeftColor: "var(--cr-warn)",
            borderRadius: "var(--cr-radius)",
            boxShadow: "0 6px 24px rgba(0, 0, 0, 0.18)",
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="m-0 mb-1">
                <span className="cr-etiquette cr-etiquette-attention">Patch détecté</span>
              </p>
              <h3 className="text-base font-semibold m-0 overflow-wrap-anywhere">
                {alert.gameName} a été mis à jour
              </h3>

              <p className="cr-transition mt-2 mb-0">
                <span className="cr-transition-avant">{alert.oldVersion}</span>
                <span aria-hidden="true" style={{ color: "var(--cr-muted)" }}>
                  →
                </span>
                <span className="cr-transition-apres">{alert.newVersion}</span>
              </p>
              <p className="cr-transition mt-1 mb-0">
                <span className="cr-transition-avant">build {alert.oldBuildId}</span>
                <span aria-hidden="true" style={{ color: "var(--cr-muted)" }}>
                  →
                </span>
                <span className="cr-transition-apres">build {alert.newBuildId}</span>
              </p>

              <p className="mt-2 mb-0">
                Les mods dépendant d’un chargeur de scripts (SKSE, F4SE…) cessent généralement de
                fonctionner après une mise à jour du moteur.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(alert.id)}
              className="cr-bouton flex-shrink-0"
              aria-label={`Masquer l’alerte pour ${alert.gameName}`}
            >
              Masquer
            </button>
          </div>
        </article>
      ))}

      {alerts.length > 1 && (
        <button type="button" onClick={onDismissAll} className="cr-bouton w-full">
          Tout masquer ({alerts.length})
        </button>
      )}
    </div>
  );
}
