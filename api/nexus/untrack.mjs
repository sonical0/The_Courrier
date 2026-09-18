import { enforceRateLimit, LIMITS } from "../utils/rateLimit.mjs";

const nexusHeaders = (username, apiKey) => {
  const appName = (process.env.NEXUS_APP_NAME || "The Courrier").trim();
  const user = username || (process.env.NEXUS_USERNAME || "unknown").trim();
  const key = apiKey || (process.env.NEXUS_API_KEY || "").trim();
  return {
    apikey: key,
    "Application-Name": appName,
    "User-Agent": `${appName} (${user})`,
    Accept: "application/json",
  };
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Nexus-Username, X-Nexus-ApiKey");
  // Reponse liee a des credentials Nexus : aucun cache en amont.
  res.setHeader("Cache-Control", "private, no-store");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (enforceRateLimit(req, res, { scope: "nexus", ...LIMITS.nexus })) return;

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const username = req.headers["x-nexus-username"] || process.env.NEXUS_USERNAME;
  const apiKey = req.headers["x-nexus-apikey"] || process.env.NEXUS_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    return res.status(401).json({ error: "Missing Nexus API credentials. Please configure your username and API key." });
  }

  // Support both query params (?domain=X&modId=Y) and URL params from rewrite
  let { domain, modId } = req.query;
  
  // If not in query, try to extract from URL path (format: /api/nexus/tracked/DOMAIN/MODID)
  if (!domain || !modId) {
    const urlPath = req.url || '';
    const match = urlPath.match(/\/tracked\/([^/]+)\/([^/?]+)/);
    if (match) {
      domain = match[1];
      modId = match[2];
    }
  }

  if (!domain || !modId) {
    return res.status(400).json({ error: "Missing domain or modId parameters" });
  }

  try {
    const response = await fetch(
      `https://api.nexusmods.com/v1/user/tracked_mods.json?domain_name=${domain}`,
      {
        method: "DELETE",
        headers: {
          ...nexusHeaders(username, apiKey),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mod_id: parseInt(modId, 10) }),
      }
    );

    if (!response.ok) {
      // Statut amont propage : une cle invalide est une erreur du client (401),
      // pas une panne du serveur. Aligne sur validate.mjs et tracked.mjs, qui
      // rendaient deja des statuts differents pour la meme condition.
      const text = await response.text();
      const err = new Error(`HTTP ${response.status}${text ? " — " + text : ""}`);
      err.status = response.status;
      throw err;
    }

    return res.status(200).json({ success: true, message: "Mod retiré de la liste suivie" });
  } catch (error) {
    // 502 par defaut : si l'appel n'a meme pas abouti (panne reseau, DNS), le
    // service amont est injoignable — l'application n'est pas en faute.
    const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 502;
    return res.status(status).json({ error: error.message || String(error) });
  }
}
