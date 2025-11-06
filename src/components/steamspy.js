// src/components/steamspy.js
import { getJsonResilient } from "./net";

export async function fetchSteamSpyApp(appid) {
  if (!appid) throw new Error("appid manquant");
  const abs = `https://steamspy.com/api.php?request=appdetails&appid=${appid}`;
  const rel = `/api.php?request=appdetails&appid=${appid}`; // fonctionne si "proxy": "https://steamspy.com" dans package.json
  const prox = `https://api.allorigins.win/raw?url=${encodeURIComponent(abs)}`;

  // 3 tentatives par URL, backoff court, timeout 8s
  const j = await getJsonResilient([rel, abs, prox], { timeoutMs: 8000 });
  return typeof j === "string" ? JSON.parse(j) : j;
}
