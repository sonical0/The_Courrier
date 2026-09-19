// Utilitaires pour parser et formater les changelogs

/**
 * Décode les entités HTML
 */
function decodeEntities(str) {
  if (!str) return "";
  return str
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

/**
 * Convertit le HTML en texte brut
 */
function htmlToPlainText(html) {
  if (!html) return "";
  const withBreaks = html.replace(/<br\s*\/?>/gi, "\n");
  const noTags = withBreaks.replace(/<[^>]+>/g, "");
  return decodeEntities(noTags);
}

// Ce module portait aussi la présentation : un emoji et deux chaînes de
// classes Tailwind par catégorie. Résultat, changer l'apparence obligeait à
// modifier de la logique de classification, et l'emoji était le seul porteur
// du sens — invisible pour un lecteur d'écran, muet en noir et blanc.
//
// Il ne renvoie plus qu'un `type`. C'est au composant de décider comment le
// montrer, et il le fait avec un mot écrit.
const CHANGELOG_PATTERNS = [
  { type: 'added', regex: /^[\s\-*•]*\s*(added|new|nouveau|ajout)/i },
  { type: 'fixed', regex: /^[\s\-*•]*\s*(fixed|fix|correction|corrigé|bug)/i },
  { type: 'changed', regex: /^[\s\-*•]*\s*(changed|change|modif|updated|update)/i },
  { type: 'removed', regex: /^[\s\-*•]*\s*(removed|remove|deleted|supprimé|suppression)/i },
  { type: 'improved', regex: /^[\s\-*•]*\s*(improved|improve|optimization|optimized|enhanced)/i },
  { type: 'deprecated', regex: /^[\s\-*•]*\s*(deprecated|obsolete)/i },
];

/**
 * Analyse une ligne de changelog et retourne sa catégorie.
 */
export function categorizeChangelogLine(line) {
  if (!line || typeof line !== 'string') {
    return { type: 'default', text: line || '' };
  }

  const trimmedLine = line.trim();

  for (const pattern of CHANGELOG_PATTERNS) {
    if (pattern.regex.test(trimmedLine)) {
      return { type: pattern.type, text: trimmedLine };
    }
  }

  return { type: 'default', text: trimmedLine };
}

/**
 * Compare deux versions et détermine le type de mise à jour
 */
export function compareVersions(currentVersion, previousVersion) {
  if (!currentVersion || !previousVersion) {
    return { type: 'unknown', label: 'Mise à jour' };
  }

  const parseVersion = (v) => {
    const parts = String(v).split('.').map(n => parseInt(n, 10) || 0);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
    };
  };

  const current = parseVersion(currentVersion);
  const previous = parseVersion(previousVersion);

  // Le libellé dit ce que l'utilisateur doit en retenir. Une version majeure
  // est celle qui casse le plus souvent les dépendances : elle mérite le seul
  // niveau d'alerte du lot.
  if (current.major > previous.major) {
    return { type: 'major', label: 'Version majeure' };
  }

  if (current.minor > previous.minor) {
    return { type: 'minor', label: 'Version mineure' };
  }

  if (current.patch > previous.patch) {
    return { type: 'patch', label: 'Correctif' };
  }

  return { type: 'unknown', label: 'Mise à jour' };
}

/**
 * Extrait et catégorise les lignes d'un changelog
 */
export function parseChangelog(changelogEntry, maxLines = 6) {
  const lines = [];
  if (!changelogEntry || !Array.isArray(changelogEntry.changes)) {
    return lines;
  }

  for (const raw of changelogEntry.changes) {
    // Convertir HTML en texte brut
    const txt = htmlToPlainText(String(raw || "")).trim();
    if (!txt) continue;
    
    // Split par lignes et nettoyer
    const parts = txt.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    
    for (const part of parts) {
      if (lines.length >= maxLines) return lines;
      lines.push(categorizeChangelogLine(part));
    }
  }

  return lines;
}
