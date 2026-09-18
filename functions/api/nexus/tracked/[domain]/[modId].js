// Remplace la rewrite Vercel :
//   /api/nexus/tracked/:domain/:modId  ->  /api/nexus/untrack?domain=&modId=
// Le handler untrack sait deja extraire domain/modId du chemin, on lui passe
// donc la requete telle quelle.
import handler from "../../../../../api/nexus/untrack.mjs";
import { toPagesFunction } from "../../../../../api/utils/pagesAdapter.mjs";

export const onRequest = toPagesFunction(handler);
