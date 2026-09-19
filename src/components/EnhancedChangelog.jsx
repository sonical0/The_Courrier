import { parseChangelog, compareVersions } from './ChangelogUtils';

/**
 * Changelog d'un mod : les premières lignes du journal de version, classées.
 *
 * La version précédente donnait à chaque ligne un emoji, une couleur de texte
 * et un fond teinté — six teintes empilées dans un cadre de 128 px de haut.
 * L'emoji portait seul la catégorie, donc elle disparaissait au lecteur
 * d'écran et en noir et blanc, et le texte à 14 px sur fond coloré passait
 * sous le seuil de contraste.
 *
 * Ici la catégorie est un mot, posé devant la ligne.
 */

const MOT_PAR_TYPE = {
  added: 'Ajout',
  fixed: 'Correction',
  changed: 'Modification',
  removed: 'Suppression',
  improved: 'Amélioration',
  deprecated: 'Obsolète',
};

// Seule la version majeure justifie une alerte : c'est celle qui casse les
// dépendances. Les autres sont neutres — les colorer toutes revenait à n'en
// signaler aucune.
const ETIQUETTE_PAR_VERSION = {
  major: 'cr-etiquette-attention',
  minor: 'cr-etiquette-neutre',
  patch: 'cr-etiquette-neutre',
  unknown: 'cr-etiquette-neutre',
};

export default function EnhancedChangelog({ mod, maxLines = 6 }) {
  if (!mod.changelog || mod.changelog.length === 0) {
    return null;
  }

  const changelogLines = parseChangelog(mod.changelog[0], maxLines);
  const updateType =
    mod.previousVersion && mod.version
      ? compareVersions(mod.version, mod.previousVersion)
      : null;

  if (changelogLines.length === 0) {
    return (
      <div className="mb-4">
        <h4 className="text-base font-semibold m-0 mb-1">Changelog</h4>
        <p className="m-0" style={{ color: "var(--cr-muted)" }}>
          L’auteur n’a pas détaillé cette version.
        </p>
      </div>
    );
  }

  const hasMore =
    changelogLines.length === maxLines &&
    mod.changelog[0].changes?.join("\n").length >
      changelogLines.map((l) => l.text).join("\n").length;

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-2">
        <h4 className="text-base font-semibold m-0">Changelog</h4>
        {updateType && updateType.type !== 'unknown' && (
          <span
            className={`cr-etiquette ${ETIQUETTE_PAR_VERSION[updateType.type] || 'cr-etiquette-neutre'}`}
          >
            {updateType.label}
          </span>
        )}
      </div>

      <ul
        className="m-0 p-0 list-none flex flex-col gap-2 overflow-y-auto"
        style={{ maxHeight: "16rem" }}
      >
        {changelogLines.map((line, i) => (
          <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {MOT_PAR_TYPE[line.type] && (
              <span
                className="font-semibold flex-shrink-0"
                style={{ color: "var(--cr-muted)" }}
              >
                {MOT_PAR_TYPE[line.type]} —
              </span>
            )}
            <span className="flex-1 min-w-0 overflow-wrap-anywhere">{line.text}</span>
          </li>
        ))}
        {hasMore && (
          <li style={{ color: "var(--cr-muted)" }}>
            … la suite est sur la page du mod.
          </li>
        )}
      </ul>

      {mod.changelogUrl && (
        <a
          href={mod.changelogUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-2"
          style={{ color: "var(--cr-accent)" }}
        >
          Voir le changelog complet
        </a>
      )}
    </div>
  );
}
