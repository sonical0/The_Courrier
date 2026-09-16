import fetch from "node-fetch";
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
      throw new Error(`HTTP ${response.status} — ${text || response.statusText}`);
    }

    const data = JSON.parse(text);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
}
