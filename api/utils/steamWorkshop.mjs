/**
 * Le jeu a-t-il un Steam Workshop ?
 *
 * Lu dans `categories` de `appdetails`, que le point d'acces de jeu recupere
 * deja : la categorie 30 est « Steam Workshop ». Aucun appel supplementaire,
 * aucune cle API.
 *
 * Trois valeurs, jamais deux : `null` quand Steam n'a pas renvoye de
 * categories. Une absence de donnee n'est pas un « non ».
 */
const CATEGORIE_WORKSHOP = 30;

export function aUnWorkshop(categories) {
  if (!Array.isArray(categories)) return null;
  return categories.some((c) => Number(c?.id) === CATEGORIE_WORKSHOP);
}

/**
 * Nombre d'ID acceptes par appel. La collection Stellaris en compte 144 :
 * un appel par mod depasserait la limite de debit, un seul appel par mod
 * et par rafraichissement aussi. Steam accepte une liste, on en profite.
 */
export const WORKSHOP_MAX_IDS = 50;

/**
 * Valide une liste d'ID Workshop venue de l'URL (« 123,456 » ou « 123 »).
 *
 * Un ID Workshop est un entier 64 bits : on le garde en chaine (un Number
 * perdrait les derniers chiffres) et on refuse tout ce qui n'est pas
 * strictement numerique, AVANT tout appel a Steam.
 *
 * @returns {string[]|null} les ID dedoublonnes, ou null si l'entree est invalide
 */
export function lireIdsWorkshop(brut) {
  if (typeof brut !== "string" || brut.length === 0) return null;
  const ids = [...new Set(brut.split(",").map((s) => s.trim()))];
  if (ids.length === 0 || ids.length > WORKSHOP_MAX_IDS) return null;
  if (!ids.every((id) => /^\d{1,20}$/.test(id))) return null;
  return ids;
}

const enMs = (s) => {
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n * 1000 : null;
};

/**
 * Reduit une entree de `GetPublishedFileDetails` aux champs utiles.
 *
 * `result` vaut 1 quand l'objet existe ; tout autre code (9 : introuvable,
 * objet prive ou retire) donne `resolu: false`, jamais une fiche vide qui
 * ressemblerait a un mod sans date.
 */
export function normaliserDetailWorkshop(d) {
  const id = String(d?.publishedfileid ?? "");
  if (!d || Number(d.result) !== 1) {
    return { id, resolu: false, erreur: "introuvable" };
  }
  return {
    id,
    resolu: true,
    titre: d.title || `Mod Workshop ${id}`,
    creeLe: enMs(d.time_created),
    majLe: enMs(d.time_updated),
    taille: Number(d.file_size) || null,
    appId: Number(d.consumer_app_id || d.creator_app_id) || null,
    abonnes: Number.isFinite(Number(d.subscriptions)) ? Number(d.subscriptions) : null,
    auteur: d.creator ? String(d.creator) : null,
    image: typeof d.preview_url === "string" && d.preview_url.startsWith("https://") ? d.preview_url : null,
  };
}
