/**
 * Fiches de mods Steam Workshop.
 * Endpoints : GET /api/steam/workshop/:id
 *             GET /api/steam/workshop?ids=123,456   (50 ID au plus)
 *
 * Appuye sur ISteamRemoteStorage/GetPublishedFileDetails : POST amont, sans
 * cle API, donnees publiques. La forme a liste existe parce qu'une collection
 * reelle compte plus de cent mods : un appel par mod depasserait la limite de
 * debit a chaque rafraichissement.
 *
 * Point d'acces ouvert a tous, sans compte (spec, lot 1) : les ID sont
 * valides avant tout appel amont, aucun en-tete de l'utilisateur n'est
 * transmis a Steam, seuls les champs utiles sont renvoyes.
 *
 * Jamais une 200 aux donnees degradees : un echec amont sans valeur de repli
 * donne une 503 `resolu: false` ; un mod introuvable donne une entree
 * `resolu: false`, pas une fiche vide.
 */

import { enforceRateLimit, LIMITS } from "../../utils/rateLimit.mjs";
import { fetchSteam } from "../../utils/steamFetch.mjs";
import { lireIdsWorkshop, normaliserDetailWorkshop } from "../../utils/steamWorkshop.mjs";

const AMONT = "https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/";

// Cache par ID, comme TTL.mod de Nexus : 10 minutes. L'entree n'est pas
// supprimee a l'expiration, elle sert de repli quand Steam refuse (voir
// api/steam/game/[appId].mjs pour la raison).
const CACHE = new Map();
const TTL = 10 * 60_000;
const PRUNE_THRESHOLD = 2000;

const frais = (id) => {
  const e = CACHE.get(id);
  return e && Date.now() < e.exp ? e.val : null;
};

const memoriser = (id, val) => {
  if (CACHE.size > PRUNE_THRESHOLD) {
    const limite = Date.now() - 24 * 60 * 60_000;
    for (const [k, e] of CACHE) if (e.exp < limite) CACHE.delete(k);
  }
  CACHE.set(id, { val, exp: Date.now() + TTL });
};

async function interrogerSteam(ids) {
  const corps = new URLSearchParams({ itemcount: String(ids.length) });
  ids.forEach((id, i) => corps.set(`publishedfileids[${i}]`, id));
  const r = await fetchSteam(AMONT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: corps.toString(),
  });
  if (!r.ok) throw new Error(`Steam Workshop API error: ${r.status}`);
  const json = await r.json();
  const details = json?.response?.publishedfiledetails;
  if (!Array.isArray(details)) throw new Error("Reponse Steam Workshop inattendue");
  return details.map(normaliserDetailWorkshop);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, resolu: false, error: "Method not allowed" });
  }

  if (enforceRateLimit(req, res, { scope: "workshop", ...LIMITS.workshop })) return;

  const ids = lireIdsWorkshop(req.query.id ?? req.query.ids);
  if (!ids) {
    return res.status(400).json({
      success: false,
      resolu: false,
      error: "ID Workshop invalide (entiers, 50 au plus, separes par des virgules)",
    });
  }

  const manquants = ids.filter((id) => !frais(id));
  let perime = false;

  if (manquants.length > 0) {
    try {
      const recus = await interrogerSteam(manquants);
      for (const m of recus) if (m.id) memoriser(m.id, m);
    } catch (error) {
      console.error("Steam Workshop:", error.message);
      // Repli sur valeur perimee, seulement si TOUS les manquants en ont une :
      // une reponse a trous ressemblerait a des mods introuvables.
      if (!manquants.every((id) => CACHE.has(id))) {
        res.setHeader("Retry-After", "60");
        res.setHeader("Cache-Control", "public, s-maxage=30");
        return res.status(503).json({
          success: false,
          resolu: false,
          error: "Steam est temporairement indisponible",
          retryAfter: 60,
        });
      }
      perime = true;
    }
  }

  // Un ID absent de la reponse de Steam n'est jamais invente : introuvable.
  const mods = ids.map((id) => CACHE.get(id)?.val ?? { id, resolu: false, erreur: "introuvable" });

  if (perime) {
    res.setHeader("X-Steam-Stale", "1");
    res.setHeader("Cache-Control", "public, s-maxage=300");
  } else {
    res.setHeader("Cache-Control", "public, s-maxage=600");
  }
  return res.json({ success: true, resolu: true, mods });
}
