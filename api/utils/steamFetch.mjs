/**
 * `fetch` avec reessais sur les erreurs transitoires de Steam.
 *
 * 403 et 429 sont de la limitation de debit cote Steam, 5xx de l'indisponibilite :
 * dans les trois cas un nouvel essai a de bonnes chances de passer. Les autres
 * codes (404 notamment) sont definitifs et rendus tels quels, sans attente.
 *
 * Les delais restent courts : le budget CPU d'un Worker est de 10 ms, mais
 * l'attente reseau n'est pas du CPU — c'est la latence percue par l'utilisateur
 * qui borne, pas la plateforme.
 *
 * Partage entre les fiches de jeu et le Workshop depuis le 2026-10-29.
 */
const TRANSIENT = new Set([403, 429, 500, 502, 503, 504]);

export async function fetchSteam(url, init, { tries = 3, delays = [120, 400] } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, init);
      if (r.ok || !TRANSIENT.has(r.status)) return r;
      last = new Error(`Steam API error: ${r.status}`);
    } catch (e) {
      last = e; // panne reseau : meme traitement qu'un 5xx
    }
    if (i < tries - 1) await new Promise((r) => setTimeout(r, delays[i] ?? 400));
  }
  throw last;
}
