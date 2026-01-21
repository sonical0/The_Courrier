/**
 * Composant pour afficher les alertes de mise à jour de jeux
 */
export default function GameUpdateAlert({ alerts, onDismiss, onDismissAll }) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-600 p-4 rounded-r-lg shadow-lg animate-slide-in"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-300 mb-1">
                Mise à jour du jeu détectée
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-2">
                <strong>{alert.gameName}</strong> a été mis à jour !
              </p>
              <div className="text-xs text-yellow-600 dark:text-yellow-500 space-y-1">
                <p>
                  Version: <span className="line-through">{alert.oldVersion}</span> →{" "}
                  <strong>{alert.newVersion}</strong>
                </p>
                <p>
                  Build ID: <span className="line-through">{alert.oldBuildId}</span> →{" "}
                  <strong>{alert.newBuildId}</strong>
                </p>
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2 italic">
                ⚡ Vérifiez la compatibilité de vos mods !
              </p>
            </div>
            <button
              onClick={() => onDismiss(alert.id)}
              className="flex-shrink-0 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 transition-colors"
              aria-label="Fermer l'alerte"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
      
      {alerts.length > 1 && (
        <button
          onClick={onDismissAll}
          className="w-full px-3 py-2 text-xs bg-yellow-100 dark:bg-yellow-900/40 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 text-yellow-800 dark:text-yellow-300 rounded-lg transition-colors font-medium"
        >
          Tout masquer ({alerts.length})
        </button>
      )}
    </div>
  );
}
