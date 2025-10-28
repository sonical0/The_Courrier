// server.mjs
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());

// ---- Cache simple (60s) ----
const CACHE = new Map();
const TTL_MS = 60_000;
const cacheGet = (k) => {
  const e = CACHE.get(k);
  if (!e) return null;
  if (Date.now() > e.exp) {
    CACHE.delete(k);
    return null;
  }
  return e.val;
};
const cacheSet = (k, v) => CACHE.set(k, { val: v, exp: Date.now() + TTL_MS });

// ---- En-têtes Nexus ----
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

const ensureKey = (res) => {
  const key = (process.env.NEXUS_API_KEY || "").trim();
  if (!key) {
    res.status(500).json({ error: "Missing NEXUS_API_KEY in .env" });
    return false;
  }
  return true;
};

// ---- Routes API ----
app.get("/api/nexus/validate", async (_req, res) => {
  if (!ensureKey(res)) return;
  try {
    const r = await fetch("https://api.nexusmods.com/v1/users/validate.json", {
      headers: nexusHeaders(),
    });
    const text = await r.text();
    res.status(r.status).type("application/json").send(text);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get("/api/nexus/tracked", async (_req, res) => {
  if (!ensureKey(res)) return;
  const hit = cacheGet("tracked");
  if (hit) return res.json(hit);
  try {
    const r = await fetch("https://api.nexusmods.com/v1/user/tracked_mods.json", {
      headers: nexusHeaders(),
    });
    const text = await r.text();
    if (!r.ok) return res.status(r.status).send(text);
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).send("Invalid JSON from Nexus API");
    }
    cacheSet("tracked", data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ---- Service du build CRA (prod) ----
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientBuild = path.join(__dirname, "build");
app.use(express.static(clientBuild));
app.get("*", (_req, res) => {
  // laisse passer si on est en dev sans build
  try {
    res.sendFile(path.join(clientBuild, "index.html"));
  } catch {
    res.status(404).send("Not Found");
  }
});

// ---- Démarrage ----
const port = Number(process.env.PORT || 4000);
const masked = (process.env.NEXUS_API_KEY || "").trim().slice(0, 4).padEnd(12, "*");
app.listen(port, () => {
  console.log(`Proxy server listening on port ${port} — key:${masked}`);
});
