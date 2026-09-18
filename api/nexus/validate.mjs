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

/**
 * Champs relayes au navigateur.
 *
 * `/v1/users/validate.json` renvoie bien plus que ce dont l'interface a besoin :
 * elle n'affiche que `name` ("connecte en tant que ..."). Deux champs de la
 * reponse Nexus ne doivent jamais sortir d'ici :
 *
 * - `email` — adresse du compte. Sur le compte de demonstration publie dans le
 *   README, n'importe quel visiteur la recuperait en une requete.
 * - `key` — Nexus re-emet la cle API dans sa propre reponse. La relayer, c'est
 *   la renvoyer au navigateur alors qu'elle n'a aucune raison d'y revenir.
 *
 * LISTE BLANCHE et non liste noire : si Nexus ajoute demain un champ sensible,
 * il ne fuitera pas par defaut. Elargir cette liste est un choix explicite.
 */
const PUBLIC_FIELDS = ["user_id", "name", "profile_url", "is_premium", "is_supporter"];

const publicProfile = (data) =>
  Object.fromEntries(
    PUBLIC_FIELDS.filter((k) => data[k] !== undefined).map((k) => [k, data[k]])
  );

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Nexus-Username, X-Nexus-ApiKey");
  // Reponse liee a des credentials Nexus : aucun cache en amont.
  res.setHeader("Cache-Control", "private, no-store");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (enforceRateLimit(req, res, { scope: "nexus", ...LIMITS.nexus })) return;

  const username = req.headers["x-nexus-username"] || process.env.NEXUS_USERNAME;
  const apiKey = req.headers["x-nexus-apikey"] || process.env.NEXUS_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    return res.status(401).json({ error: "Missing Nexus API credentials. Please configure your username and API key." });
  }

  try {
    const response = await fetch("https://api.nexusmods.com/v1/users/validate.json", {
      headers: nexusHeaders(username, apiKey),
    });

    const text = await response.text();
    if (!response.ok) {
      // Le statut amont est propage tel quel : une cle invalide est une erreur
      // du client (401), pas une panne du serveur. Renvoyer 500 rendrait les
      // vraies pannes indiscernables d'une mauvaise saisie.
      const err = new Error(`HTTP ${response.status} — ${text || response.statusText}`);
      err.status = response.status;
      throw err;
    }

    const data = JSON.parse(text);
    return res.status(200).json(publicProfile(data));
  } catch (error) {
    const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 502;
    return res.status(status).json({ error: error.message || String(error) });
  }
}
