import LZString from "lz-string";

export function setCompressed(key, data) {
  try {
    localStorage.setItem(key, LZString.compress(JSON.stringify(data)));
  } catch {}
}

export function getCompressed(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const dec = LZString.decompress(raw);
    // decompress retourne null sur entrée invalide, "" sur chaîne vide
    if (dec !== null && dec !== "") return JSON.parse(dec);
    // Fallback migration : données stockées en JSON brut
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
