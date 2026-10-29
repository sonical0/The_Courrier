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
