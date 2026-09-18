/**
 * Point d'entree Worker — remplace le routage par dossier de Pages Functions.
 *
 * Sur Pages, `functions/api/steam/game/[appId].js` suffisait : la plateforme
 * deduisait la route du chemin du fichier. Un Worker n'a qu'un point d'entree,
 * le routage est donc explicite ici.
 *
 * Les handlers de api/ gardent la signature `handler(req, res)` de Node et
 * passent par api/utils/workerAdapter.mjs. C'est un heritage de Vercel, conserve
 * parce que server.mjs (le serveur de developpement local) l'utilise : un
 * correctif dans api/ profite donc a la fois a Cloudflare et au local, sans
 * deux versions a maintenir. Vercel a ete supprime le 2026-09-18.
 *
 * Les assets statiques (build/) sont servis par la plateforme AVANT d'atteindre
 * ce Worker — voir `[assets]` dans wrangler.toml. Il n'est donc invoque que
 * pour ce que les assets ne couvrent pas, et le fallback SPA est traite par
 * `not_found_handling`, pas ici.
 */
import { toWorkerHandler } from "./api/utils/workerAdapter.mjs";

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

  // Reprend la rewrite que vercel.json portait avant sa suppression : cette
  // route est servie par le handler untrack. Celui-ci lit domain/modId dans
  // req.query, que l'adaptateur alimente depuis les groupes nommes du motif.
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

  // Binding absent : on laisse passer plutot que de casser les routes, la
  // barriere memoire reste derriere. Mais ce cas doit etre VISIBLE — sinon la
  // protection est silencieusement inactive, ce qui est pire que pas de
  // protection du tout (constate en production le 2026-09-18 : le code etait
  // deploye, le binding non, et rien ne le signalait).
  if (!limiter) return { absent: true };

  const scope = isNexus ? "nexus" : "steam";
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  const { success } = await limiter.limit({ key: `${scope}:${ip}` });
  if (success) return { absent: false };

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

/**
 * Cache partage des fiches Steam, avec repli sur valeur perimee.
 *
 * LE PROBLEME : Steam limite les IP de sortie de Cloudflare, mutualisees. Une
 * requete sur trois environ repartait en 403, y compris espacee de 8 s.
 * `api/steam/game/[appId].mjs` a bien un cache et des reessais, mais son cache
 * est un `Map` en memoire : propre a chaque isolate, perdu au demarrage a
 * froid. En pratique son repli perime ne se declenchait jamais.
 *
 * LA REPONSE : l'API Cache de Cloudflare. Elle survit aux isolates, donc :
 *  - une fiche deja servie n'appelle plus Steam pendant FRAIS_MS ;
 *  - si Steam refuse, on ressert la derniere valeur connue jusqu'a GARDE_S.
 *
 * PORTEE : le cache est propre a chaque centre de donnees Cloudflare, pas
 * global. Un cache reellement global demanderait Workers KV, donc un namespace
 * a creer et une ecriture facturee ; a reprendre si le taux d'echec reste
 * genant. Ici, un utilisateur frappe peu de centres, donc le gain est deja
 * l'essentiel.
 *
 * Volontairement limite a /api/steam/* : les routes Nexus portent des donnees
 * liees a des identifiants et sont marquees `private, no-store`.
 */
const STEAM_FRAIS_MS = 2 * 60 * 60_000; // en deca, on sert sans appeler Steam
const STEAM_GARDE_S = 24 * 60 * 60; // au-dela, l'entree n'a plus d'interet

/** Recopie une reponse en ajoutant des en-tetes (une Response est immuable). */
const avecEnTetes = (res, entetes) => {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(entetes)) out.headers.set(k, v);
  return out;
};

// Exportee pour etre testable : le chemin "repli sur valeur perimee" ne peut
// pas etre declenche a la demande depuis l'exterieur, puisqu'il suppose que
// Steam refuse pile au moment ou une entree perimee existe.
export async function steamAvecCache(request, params, env, ctx, handler) {
  // `caches` n'existe pas partout (dev local selon la configuration) : sans lui
  // on se contente du comportement d'origine plutot que d'echouer.
  if (typeof caches === "undefined" || !caches.default) return null;

  const cache = caches.default;
  const origine = new URL(request.url).origin;
  // Cle normalisee : la query string est ignoree, sinon un `?cb=123` de test
  // fragmenterait le cache et le rendrait inutile.
  const cle = new Request(`${origine}/api/steam/game/${params.appId}`, { method: "GET" });

  const hit = await cache.match(cle);
  const age = hit ? Date.now() - Number(hit.headers.get("X-Cached-At") || 0) : Infinity;

  if (hit && age < STEAM_FRAIS_MS) {
    return avecEnTetes(hit, { "X-Steam-Cache": "hit", "X-Steam-Age": String(Math.round(age / 1000)) });
  }

  const frais = await toWorkerHandler(handler)({ request, params, env, ctx });

  if (frais.status === 200) {
    const aStocker = avecEnTetes(frais.clone(), {
      "X-Cached-At": String(Date.now()),
      // Duree de conservation cote Cloudflare. La fraicheur, elle, est decidee
      // par X-Cached-At ci-dessus : c'est ce qui rend le repli perime possible.
      "Cache-Control": `public, s-maxage=${STEAM_GARDE_S}`,
    });
    ctx.waitUntil(cache.put(cle, aStocker));
    return avecEnTetes(frais, { "X-Steam-Cache": "miss" });
  }

  // Steam a refuse. Une fiche vieille de quelques heures vaut mieux qu'une
  // erreur : les donnees ne bougent qu'au rythme des patchs.
  if (hit) {
    return avecEnTetes(hit, {
      "X-Steam-Cache": "stale",
      "X-Steam-Stale": "1",
      "X-Steam-Age": String(Math.round(age / 1000)),
      "Cache-Control": "public, s-maxage=300", // retenter bientot, sans marteler
    });
  }

  return avecEnTetes(frais, { "X-Steam-Cache": "miss" });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    for (const route of COMPILED) {
      const match = route.matcher.exec({ pathname: url.pathname });
      if (!match) continue;

      // Barriere de debit avant d'atteindre le handler — et donc avant tout
      // appel sortant vers Nexus ou Steam.
      const verdict = await enforceEdgeLimit(request, env, url.pathname);
      if (verdict instanceof Response) return verdict;

      // Les groupes nommes d'URLPattern jouent le role de context.params sur
      // Pages : l'adaptateur les fusionne ensuite dans req.query, comme Vercel.
      const params = { ...match.pathname.groups };

      // Les fiches Steam passent par le cache partage ; tout le reste va
      // directement au handler.
      const cachable = request.method === "GET" && url.pathname.startsWith("/api/steam/game/");
      const response =
        (cachable && (await steamAvecCache(request, params, env, ctx, route.handler))) ||
        (await toWorkerHandler(route.handler)({ request, params, env, ctx }));

      // Etat de la barriere distribuee, lisible sans acces au tableau de bord.
      // "off" signale que le binding n'est pas attache au Worker deploye :
      // seule la barriere memoire protege, et elle ne suffit pas.
      const out = new Response(response.body, response);
      out.headers.set("X-Edge-RateLimit", verdict.absent ? "off" : "on");
      return out;
    }

    // Aucune route API : ni les assets ni le fallback SPA n'ont pris la requete.
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  },
};
