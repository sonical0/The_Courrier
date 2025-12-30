import { parseChangelog, compareVersions } from './ChangelogUtils';

/**
 * Composant pour afficher un changelog enrichi avec icônes et couleurs
 */
export default function EnhancedChangelog({ mod, maxLines = 6 }) {
  if (!mod.changelog || mod.changelog.length === 0) {
    return null;
  }

  const changelogLines = parseChangelog(mod.changelog[0], maxLines);
  const updateType = mod.previousVersion && mod.version 
    ? compareVersions(mod.version, mod.previousVersion)
    : null;

  if (changelogLines.length === 0) {
    return (
      <div className="mb-4">
        <small className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
          Changelog :
        </small>
        <div className="text-sm bg-slate-50 dark:bg-slate-900/50 p-3 rounded">
          <p className="text-slate-500 dark:text-slate-400 italic mb-0">
            Aucun détail disponible
          </p>
        </div>
      </div>
    );
  }

  const hasMore = changelogLines.length === maxLines && 
    (mod.changelog[0].changes?.join("\n").length > changelogLines.map(l => l.text).join("\n").length);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <small className="font-semibold text-slate-700 dark:text-slate-300">
          Changelog :
        </small>
        {updateType && updateType.type !== 'unknown' && (
          <span className={`text-xs font-bold px-2 py-1 rounded ${updateType.bg} ${updateType.color}`}>
            {updateType.label}
          </span>
        )}
      </div>
      
      <div className="text-sm max-h-32 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900/50 p-2 rounded space-y-1">
        {changelogLines.map((line, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 p-1.5 rounded ${line.bg}`}
          >
            <span className="text-base flex-shrink-0 mt-0.5" title={line.type}>
              {line.icon}
            </span>
            <span className={`${line.color} text-sm leading-relaxed flex-1 break-words overflow-wrap-anywhere whitespace-normal`}>
              {line.text}
            </span>
          </div>
        ))}
        {hasMore && (
          <div className="flex items-start gap-2 p-1.5">
            <span className="text-slate-400 dark:text-slate-600 text-sm italic">
              …
            </span>
          </div>
        )}
      </div>
      
      {mod.changelogUrl && (
        <a
          href={mod.changelogUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-pico-primary hover:underline inline-block mt-2"
        >
          Voir le changelog complet →
        </a>
      )}
    </div>
  );
}
