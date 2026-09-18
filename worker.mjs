/**
 * Point d'entree Worker — remplace le routage par dossier de Pages Functions.
 *
 * Sur Pages, `functions/api/steam/game/[appId].js` suffisait : la plateforme
 * deduisait la route du chemin du fichier. Un Worker n'a qu'un point d'entree,
 * le routage est donc explicite ici.
 *
 * Tout le reste est inchange : les handlers de api/ restent au format Vercel
 * `handler(req, res)` et passent par api/utils/pagesAdapter.mjs. Un correctif
 * dans api/ profite simultanement a Vercel, a server.mjs et a Cloudflare.
 *
 * Les assets statiques (build/) sont servis par la plateforme AVANT d'atteindre
 * ce Worker — voir `[assets]` dans wrangler.toml. Il n'est donc invoque que
 * pour ce que les assets ne couvrent pas, et le fallback SPA est traite par
 * `not_found_handling`, pas ici.
 */
import { toPagesFunction } from "./api/utils/pagesAdapter.mjs";

import nexusTracked from "./api/nexus/tracked.mjs";
import nexusUntrack from "./api/nexus/untrack.mjs";
import nexusValidate from "./api/nexus/validate.mjs";
import steamGame from "./api/steam/game/[appId].mjs";

/**
 * Table de routage. L'ordre compte : la premiere entree qui correspond gagne,
 * donc les chemins litteraux passent avant les motifs a parametre.
 *
 * `pattern` suit la syntaxe URLPattern, disponible nativement sur Workers.
 */
const ROUTES = [
  { pattern: "/api/nexus/tracked", handler: nexusTracked },
  { pattern: "/api/nexus/untrack", handler: nexusUntrack },
  { pattern: "/api/nexus/validate", handler: nexusValidate },

  // Remplace la rewrite de vercel.json qui reecrivait cette route vers untrack.
  // Le handler lit domain/modId dans req.query, que l'adaptateur alimente
  // depuis les groupes nommes ci-dessous.
  { pattern: "/api/nexus/tracked/:domain/:modId", handler: nexusUntrack },

  { pattern: "/api/steam/game/:appId", handler: steamGame },
];

const COMPILED = ROUTES.map((r) => ({
  ...r,
  matcher: new URLPattern({ pathname: r.pattern }),
}));

/**
 * Premiere barriere de debit, adossee a l'infrastructure Cloudflare.
 *
 * api/utils/rateLimit.mjs reste en place derriere, mais son compteur vit dans
 * la memoire de l'isolate : il repart de zero a chaque cold start et chaque
 * isolate a le sien. Son propre en-tete le documente. Ici le compteur est
 * partage, donc c'est lui qui borne reellement une boucle client emballee —
 * la panne de juin 2026.
 *
 * Les deux limites sont volontairement identiques (30/min et 60/min) : si la
 * barriere distribuee laisse passer, la barriere memoire ne rejettera pas non
 * plus, et les en-tetes X-RateLimit-* des handlers restent coherents avec ce
 * que le client observe.
 *
 * @returns {Promise<Response|null>} une reponse 429 si la limite est atteinte
 */
async function enforceEdgeLimit(request, env, pathname) {
  const isNexus = pathname.startsWith("/api/nexus/");
  const limiter = isNexus ? env.RL_NEXUS : env.RL_STEAM;

  // Absent en `wrangler dev` sans binding, ou si la config n'est pas deployee :
  // on laisse passer plutot que de casser les routes. La barriere memoire reste.
  if (!limiter) return null;

  const scope = isNexus ? "nexus" : "steam";
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  const { success } = await limiter.limit({ key: `${scope}:${ip}` });
  if (success) return null;

  return new Response(
    JSON.stringify({
      success: false,
      error: "Too many requests",
      scope,
      retryAfter: 60,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Retry-After": "60",
        "Cache-Control": "private, no-store",
      },
    }
  );
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    for (const route of COMPILED) {
      const match = route.matcher.exec({ pathname: url.pathname });
      if (!match) continue;

      // Barriere de debit avant d'atteindre le handler — et donc avant tout
      // appel sortant vers Nexus ou Steam.
      const limited = await enforceEdgeLimit(request, env, url.pathname);
      if (limited) return limited;

      // Les groupes nommes d'URLPattern jouent le role de context.params sur
      // Pages : l'adaptateur les fusionne ensuite dans req.query, comme Vercel.
      const params = { ...match.pathname.groups };

      return toPagesFunction(route.handler)({ request, params, env, ctx });
    }

    // Aucune route API : ni les assets ni le fallback SPA n'ont pris la requete.
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  },
};
