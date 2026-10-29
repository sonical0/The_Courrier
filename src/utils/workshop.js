import { NEXUS_TO_STEAM_MAP } from "../components/useSteamGames";

/**
 * Lit un ID de mod Workshop dans ce que l'utilisateur colle : l'ID seul, ou
 * une URL de la page du mod (steamcommunity.com/sharedfiles/filedetails/?id=…,
 * /workshop/filedetails/?id=…). L'ID est garde en chaine : c'est un entier
 * 64 bits, un Number en perdrait les derniers chiffres.
 *
 * @returns {string|null} l'ID, ou null si la saisie n'en contient pas
 */
export function extraireIdWorkshop(saisie) {
  const s = String(saisie ?? "").trim();
  if (/^\d{1,20}$/.test(s)) return s;
  try {
    const url = new URL(s);
    if (!/(^|\.)steamcommunity\.com$/.test(url.hostname)) return null;
    const id = url.searchParams.get("id");
    return id && /^\d{1,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

// App ID Steam → domaine Nexus, pour ranger un mod Workshop sous le meme jeu
// que les mods Nexus de ce jeu.
const STEAM_TO_NEXUS = Object.fromEntries(
  Object.entries(NEXUS_TO_STEAM_MAP)
    .filter(([, appId]) => appId)
    .map(([domaine, appId]) => [String(appId), domaine])
);

export const domainePourAppId = (appId) =>
  STEAM_TO_NEXUS[String(appId)] || (appId ? `steam-${appId}` : "steam-inconnu");

/**
 * Entree stockee → mod au format des listes (celui de useNexusMods), avec
 * `source: "workshop"`. Les listes, les tags, « Nouveau » et « vu » marchent
 * ainsi sans cas particulier : la cle `domaine:id` reste unique, un ID
 * Workshop (dix chiffres et plus) ne croise pas un ID Nexus.
 */
export function versMod(e) {
  const domain = domainePourAppId(e.appId);
  return {
    source: "workshop",
    id: e.id,
    name: e.titre,
    version: null,
    domain,
    gameId: null,
    gameName: e.jeu || undefined,
    gameNameResolu: Boolean(e.jeu),
    author: null,
    authorSteamId: e.auteur || null,
    category: null,
    categoryId: null,
    updatedAt: e.maj || null,
    url: `https://steamcommunity.com/sharedfiles/filedetails/?id=${e.id}`,
    picture: e.image || null,
    summary: e.note || "",
    previousVersion: null,
    changelog: [],
    changelogUrl: `https://steamcommunity.com/sharedfiles/filedetails/changelog/${e.id}`,
  };
}
