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

const CHANGELOG_PATTERNS = [
  { type: 'added', regex: /^[\s\-*•]*\s*(added|new|nouveau|ajout)/i, icon: '✨', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
  { type: 'fixed', regex: /^[\s\-*•]*\s*(fixed|fix|correction|corrigé|bug)/i, icon: '🔧', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { type: 'changed', regex: /^[\s\-*•]*\s*(changed|change|modif|updated|update)/i, icon: '🔄', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { type: 'removed', regex: /^[\s\-*•]*\s*(removed|remove|deleted|supprimé|suppression)/i, icon: '🗑️', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  { type: 'improved', regex: /^[\s\-*•]*\s*(improved|improve|optimization|optimized|enhanced)/i, icon: '⚡', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { type: 'deprecated', regex: /^[\s\-*•]*\s*(deprecated|obsolete)/i, icon: '⚠️', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
];

/**
 * Analyse une ligne de changelog et retourne son type avec style
 */
export function categorizeChangelogLine(line) {
  if (!line || typeof line !== 'string') {
    return { type: 'default', icon: '•', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/50', text: line || '' };
  }

  const trimmedLine = line.trim();
  
  for (const pattern of CHANGELOG_PATTERNS) {
    if (pattern.regex.test(trimmedLine)) {
      return {
        type: pattern.type,
        icon: pattern.icon,
        color: pattern.color,
        bg: pattern.bg,
        text: trimmedLine,
      };
    }
  }

  return {
    type: 'default',
    icon: '•',
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    text: trimmedLine,
  };
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

  if (current.major > previous.major) {
    return { 
      type: 'major', 
      label: '🚀 Mise à jour MAJEURE',
      color: 'text-red-700 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30'
    };
  }

  if (current.minor > previous.minor) {
    return { 
      type: 'minor', 
      label: '⭐ Mise à jour mineure',
      color: 'text-orange-700 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/30'
    };
  }

  if (current.patch > previous.patch) {
    return { 
      type: 'patch', 
      label: '🔧 Correctif',
      color: 'text-blue-700 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30'
    };
  }

  return { 
    type: 'unknown', 
    label: 'Mise à jour',
    color: 'text-slate-700 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800/50'
  };
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
