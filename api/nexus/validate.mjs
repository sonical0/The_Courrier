// api/nexus/validate.mjs
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
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const key = (process.env.NEXUS_API_KEY || "").trim();
  if (!key) {
    return res.status(500).json({ error: "Missing NEXUS_API_KEY environment variable" });
  }

  try {
    const response = await fetch("https://api.nexusmods.com/v1/users/validate.json", {
      headers: nexusHeaders(),
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
