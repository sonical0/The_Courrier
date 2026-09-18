// Import statique plutot que lecture disque : le runtime Workers n a pas de
// systeme de fichiers. L attribut with { type: "json" } est requis par Node 22
// en ESM et compris par esbuild, qui inline le JSON a la compilation — le meme
// fichier fonctionne donc sous Node (server.mjs, Vercel) et sur Cloudflare.
import CATEGORIES_BY_GAME from "../../src/data/nexus-categories.json" with { type: "json" };

export const toEpoch = (v) => {
  if (!v) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (!Number.isNaN(n) && n > 0) return n;
    const d = Date.parse(v);
    if (!Number.isNaN(d)) return Math.floor(d / 1000);
  }
  return 0;
};

export function getCategoryName(domain, categoryId) {
  if (!categoryId) return null;
  const gameCategories = CATEGORIES_BY_GAME[domain];
  if (!gameCategories) return null;
  return gameCategories[categoryId] || null;
}

export async function withPool(items, limit, fn) {
  const ret = [];
  let i = 0;
  const workers = Array(Math.min(limit, items.length))
    .fill(0)
    .map(async () => {
      while (i < items.length) {
        const idx = i++;
        ret[idx] = await fn(items[idx], idx);
      }
    });
  await Promise.all(workers);
  return ret;
}

export function sortVersionsSemantic(versions) {
  return [...versions].sort((a, b) => {
    const aParts = a.split(".").map(Number);
    const bParts = b.split(".").map(Number);
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aNum = aParts[i] || 0;
      const bNum = bParts[i] || 0;
      if (aNum !== bNum) return bNum - aNum;
    }
    return 0;
  });
}
