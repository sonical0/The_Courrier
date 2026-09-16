/**
 * Limiteur de debit par fenetre fixe, partage entre server.mjs et les
 * fonctions de api/.
 *
 * PORTEE REELLE — a lire avant de s'y fier :
 * le compteur vit dans la memoire du processus. Sur le serveur local
 * (server.mjs, long-running) la protection est complete. Sur Vercel chaque
 * instance a son propre compteur et un cold start repart de zero : la limite
 * effective est donc "limit x nombre d'instances tiedes". Cela borne une
 * boucle client emballee, ce qui est l'objectif, mais ce n'est pas un quota
 * exact. Pour un vrai quota il faut soit le rate limiting du Vercel Firewall
 * (qui bloque AVANT l'invocation, donc evite aussi le cout), soit un store
 * partage. Voir la section "Rate limiting" de DEPLOYMENT.md.
 */

const BUCKETS = new Map();

// Au-dela de cette taille on purge les fenetres expirees, pour qu'une longue
// serie d'IP distinctes ne fasse pas grossir la Map indefiniment.
const PRUNE_THRESHOLD = 5000;

function prune(now) {
  for (const [k, b] of BUCKETS) {
    if (now >= b.resetAt) BUCKETS.delete(k);
  }
}

/**
 * Consomme un jeton pour `key`.
 * @returns {{allowed: boolean, remaining: number, retryAfter: number, limit: number}}
 */
export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();

  if (BUCKETS.size > PRUNE_THRESHOLD) prune(now);

  const bucket = BUCKETS.get(key);

  if (!bucket || now >= bucket.resetAt) {
    BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0, limit };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      limit,
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfter: 0, limit };
}

/**
 * Identifie l'appelant. Derriere Vercel l'IP client est le premier element de
 * x-forwarded-for ; en local on retombe sur la socket.
 */
export function clientKey(req, scope) {
  const fwd = req.headers?.["x-forwarded-for"];
  const first = Array.isArray(fwd) ? fwd[0] : String(fwd || "").split(",")[0];
  const ip = first.trim() || req.socket?.remoteAddress || "unknown";
  return `${scope}:${ip}`;
}

/**
 * Applique la limite et, si elle est depassee, ecrit la reponse 429.
 * @returns {boolean} true si la requete doit etre rejetee
 */
export function enforceRateLimit(req, res, { scope, limit, windowMs }) {
  const verdict = rateLimit(clientKey(req, scope), { limit, windowMs });

  res.setHeader("X-RateLimit-Limit", String(verdict.limit));
  res.setHeader("X-RateLimit-Remaining", String(verdict.remaining));

  if (verdict.allowed) return false;

  res.setHeader("Retry-After", String(verdict.retryAfter));
  res.status(429).json({
    success: false,
    error: "Too many requests",
    scope,
    retryAfter: verdict.retryAfter,
  });
  return true;
}

// Limites par defaut, surchargeables sans redeploiement de code.
// Un client sain est tres en dessous : le cache navigateur des mods suivis
// dure 10 min et celui des versions Steam 2h.
export const LIMITS = {
  nexus: {
    limit: Number(process.env.RATE_LIMIT_NEXUS || 30),
    windowMs: 60_000,
  },
  steam: {
    limit: Number(process.env.RATE_LIMIT_STEAM || 60),
    windowMs: 60_000,
  },
};
