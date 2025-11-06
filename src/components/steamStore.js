// src/components/steamStore.js
import { getJsonResilient } from "./net";

export async function fetchSteamStoreDetails(appid) {
  if (!appid) throw new Error("appid manquant");
  const abs = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=french`;
  const rel = `/api/appdetails?appids=${appid}&l=french`; // nécessite "proxy": "https://store.steampowered.com"
  const prox = `https://api.allorigins.win/raw?url=${encodeURIComponent(abs)}`;

  const j = await getJsonResilient([rel, abs, prox], { timeoutMs: 8000 });
  const entry = j?.[appid];
  return entry?.success ? entry.data : null;
}
