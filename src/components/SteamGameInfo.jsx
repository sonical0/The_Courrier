/**
 * Composant pour afficher les informations Steam d'un jeu
 */
export default function SteamGameInfo({ domain, steamInfo }) {
  if (!steamInfo) {
    return null;
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return "Inconnue";
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <svg 
          className="w-5 h-5 text-blue-600 dark:text-blue-400" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>
        <h6 className="text-sm font-bold text-blue-800 dark:text-blue-300">
          Infos Steam
        </h6>
        <span className="ml-auto text-[10px] text-blue-600 dark:text-blue-500 italic">
          (peut être obsolète)
        </span>
      </div>
      
      <div className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
        {steamInfo.buildId && (
          <div className="flex justify-between">
            <span className="font-medium">Build ID:</span>
            <span className="font-mono">{String(steamInfo.buildId).slice(0, 10)}...</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="font-medium">Dernière MAJ:</span>
          <span>{formatDate(steamInfo.lastUpdate)}</span>
        </div>
      </div>
      
      {steamInfo.appId && (
        <a
          href={`https://store.steampowered.com/app/${steamInfo.appId}`}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Voir sur Steam →
        </a>
      )}
    </div>
  );
}
