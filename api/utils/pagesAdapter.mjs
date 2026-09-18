/**
 * Adaptateur Vercel -> Cloudflare Pages Functions.
 *
 * POURQUOI un adaptateur plutot qu'une reecriture :
 * les cinq handlers de api/ sont ecrits au format Node/Vercel
 * `handler(req, res)`. Le runtime Workers, lui, attend
 * `onRequest({ request, env })` et un objet `Response` en retour.
 * Plutot que de maintenir deux versions de chaque handler — qui
 * divergeraient au premier correctif — on garde api/ comme source
 * unique et on lui presente ici un faux couple (req, res).
 *
 * Consequence : un correctif sur api/nexus/tracked.mjs profite
 * simultanement a Vercel, au serveur local (server.mjs) et a Cloudflare.
 *
 * CE QUI N'EST PAS EMULE, volontairement :
 * - le streaming de reponse (aucun handler n'en fait) ;
 * - req.body (aucun handler ne lit de corps : untrack passe par l'URL) ;
 * - res.write() incremental (seuls .json() et .end() sont utilises).
 * Si un futur handler en a besoin, l'ajouter ici, pas dans le handler.
 */

/**
 * Construit un faux `req` Node a partir d'une Request Workers.
 *
 * L'IP client : sur Cloudflare elle arrive dans `CF-Connecting-IP`, pas
 * dans `x-forwarded-for`. On la recopie sous les deux noms pour que
 * `clientKey()` de rateLimit.mjs fonctionne sans modification.
 */
function buildReq(request, params) {
  const url = new URL(request.url);

  const headers = Object.create(null);
  for (const [k, v] of request.headers) headers[k.toLowerCase()] = v;

  const cfIp = request.headers.get("CF-Connecting-IP");
  if (cfIp && !headers["x-forwarded-for"]) headers["x-forwarded-for"] = cfIp;

  const query = Object.create(null);
  for (const [k, v] of url.searchParams) query[k] = v;

  // Segments dynamiques de la route. Vercel les place dans `req.query`
  // (`/api/steam/game/489830` -> req.query.appId), Cloudflare Pages les passe
  // separement dans `context.params`. On les fusionne pour que les handlers
  // restent inchanges. Ils l'emportent sur la query string, comme chez Vercel.
  // Une route attrape-tout ([[path]]) donne un tableau : on le rejoint.
  for (const [k, v] of Object.entries(params || {})) {
    query[k] = Array.isArray(v) ? v.join("/") : v;
  }

  return {
    method: request.method,
    headers,
    query,
    // Les handlers qui relisent l'URL attendent un chemin relatif, comme Node.
    url: url.pathname + url.search,
    socket: { remoteAddress: cfIp || "unknown" },
  };
}

/**
 * Construit un faux `res` Node qui accumule statut et en-tetes, puis
 * resout `done` avec une vraie Response au premier .json()/.end()/.send().
 */
function buildRes(resolve) {
  const headers = new Headers();
  let statusCode = 200;
  let settled = false;

  const finish = (body, contentType) => {
    if (settled) return res; // un handler qui repond deux fois : on ignore le second
    settled = true;
    if (contentType && !headers.has("Content-Type")) {
      headers.set("Content-Type", contentType);
    }
    resolve(new Response(body, { status: statusCode, headers }));
    return res;
  };

  const res = {
    setHeader(name, value) {
      headers.set(name, String(value));
      return res;
    },
    getHeader(name) {
      return headers.get(name);
    },
    removeHeader(name) {
      headers.delete(name);
      return res;
    },
    status(code) {
      statusCode = code;
      return res;
    },
    json(payload) {
      return finish(JSON.stringify(payload), "application/json; charset=utf-8");
    },
    send(payload) {
      if (payload === undefined || payload === null) return finish(null);
      if (typeof payload === "object") return res.json(payload);
      return finish(String(payload), "text/plain; charset=utf-8");
    },
    end(payload) {
      return finish(payload ?? null);
    },
    get headersSent() {
      return settled;
    },
  };

  return res;
}

/**
 * Enveloppe un handler Vercel en Pages Function.
 *
 * @param {(req: object, res: object) => unknown} handler
 * @returns {(context: { request: Request }) => Promise<Response>}
 */
export function toPagesFunction(handler) {
  return async function onRequest({ request, params }) {
    let resolve;
    const done = new Promise((r) => {
      resolve = r;
    });

    const req = buildReq(request, params);
    const res = buildRes(resolve);

    try {
      // On attend soit la resolution via res.*, soit la fin du handler.
      // Le premier des deux gagne : un handler qui rend la main sans avoir
      // repondu produit un 500 explicite plutot qu'une requete suspendue.
      const ran = Promise.resolve(handler(req, res)).then(() => {
        if (!res.headersSent) {
          resolve(
            new Response(
              JSON.stringify({ error: "Handler terminated without a response" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            )
          );
        }
      });

      await Promise.race([done, ran]);
      return await done;
    } catch (error) {
      if (res.headersSent) return await done;
      return new Response(
        JSON.stringify({ error: error?.message || String(error) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  };
}
