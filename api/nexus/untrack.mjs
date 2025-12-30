import fetch from "node-fetch";

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

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

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
      const text = await response.text();
      throw new Error(`HTTP ${response.status}${text ? " — " + text : ""}`);
    }

    return res.status(200).json({ success: true, message: "Mod retiré de la liste suivie" });
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
}
