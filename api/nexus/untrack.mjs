// api/nexus/untrack.mjs
import fetch from "node-fetch";

const nexusHeaders = () => {
  const appName = (process.env.NEXUS_APP_NAME || "demo-app").trim();
  const user = (process.env.NEXUS_USERNAME || "unknown").trim();
  const key = (process.env.NEXUS_API_KEY || "").trim();
  return {
    apikey: key,
    "Application-Name": appName,
    "User-Agent": `${appName} (${user})`,
    Accept: "application/json",
  };
};

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = (process.env.NEXUS_API_KEY || "").trim();
  if (!key) {
    return res.status(500).json({ error: "Missing NEXUS_API_KEY environment variable" });
  }

  // Parse query params: /api/nexus/untrack?domain=xxx&modId=yyy
  const { domain, modId } = req.query;

  if (!domain || !modId) {
    return res.status(400).json({ error: "Missing domain or modId parameters" });
  }

  try {
    const response = await fetch(
      `https://api.nexusmods.com/v1/user/tracked_mods.json?domain_name=${domain}`,
      {
        method: "DELETE",
        headers: {
          ...nexusHeaders(),
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
