// src/components/net.js
export function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchWithTimeout(url, { timeoutMs = 8000, ...opts } = {}) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal, headers: { Accept: "application/json", ...(opts?.headers||{}) } });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * 3 tentatives : 0ms, 600ms, 1500ms (backoff), puis fallback URL suivant.
 * urls: tableau d’URL à essayer dans l’ordre (ex : [rel, abs, prox]).
 */
export async function getJsonResilient(urls, { timeoutMs = 8000, attempts = 3, backoffs = [0, 600, 1500], ...opts } = {}) {
  let lastErr = null;
  for (const url of urls) {
    for (let i = 0; i < attempts; i++) {
      try {
        if (backoffs[i]) await delay(backoffs[i]);
        const res = await fetchWithTimeout(url, { timeoutMs, ...opts });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // Certains proxys renvoient du texte JSON
        const text = await res.text();
        try { return JSON.parse(text); } catch { return text; }
      } catch (e) {
        lastErr = e;
      }
    }
  }
  throw lastErr || new Error("Network error");
}
