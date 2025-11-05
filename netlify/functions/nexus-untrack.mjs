// netlify/functions/nexus-untrack.mjs
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

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "DELETE") {
    return {
      statusCode: 405,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const key = (process.env.NEXUS_API_KEY || "").trim();
  if (!key) {
    return {
      statusCode: 500,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing NEXUS_API_KEY environment variable" }),
    };
  }

  // Parse path: /api/nexus/tracked/:domain/:modId
  const pathParts = event.path.split("/").filter(Boolean);
  const domain = pathParts[pathParts.length - 2];
  const modId = pathParts[pathParts.length - 1];

  if (!domain || !modId) {
    return {
      statusCode: 400,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing domain or modId" }),
    };
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

    return {
      statusCode: 200,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, message: "Mod retiré de la liste suivie" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message || String(error) }),
    };
  }
};
