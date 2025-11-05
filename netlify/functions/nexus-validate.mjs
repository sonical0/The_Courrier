// netlify/functions/nexus-validate.mjs
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
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const key = (process.env.NEXUS_API_KEY || "").trim();
  if (!key) {
    return {
      statusCode: 500,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing NEXUS_API_KEY environment variable" }),
    };
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
    return {
      statusCode: 200,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message || String(error) }),
    };
  }
};
