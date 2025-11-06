// src/components/useSteamDealsUnder15.js
import { useEffect, useState } from "react";

/* Tri popularité via Wilson (95%) sur avis Steam */
const USD_EUR_RATE =
  Number(process.env.REACT_APP_USD_EUR_RATE) > 0 ? Number(process.env.REACT_APP_USD_EUR_RATE) : 0.95;

function asEUR(usd) {
  const n = Number(usd);
  if (!Number.isFinite(n)) return null;
  const eur = n * USD_EUR_RATE;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(eur);
}

function steamImageCandidates(appId) {
  if (!appId) return [];
  const base = "https://cdn.cloudflare.steamstatic.com/steam/apps";
  return [
    `${base}/${appId}/capsule_616x353.jpg`,
    `${base}/${appId}/capsule_467x181.jpg`,
    `${base}/${appId}/header.jpg`,
    `${base}/${appId}/capsule_231x87.jpg`,
  ];
}

function wilsonLowerBound(p, n, z = 1.96) {
  if (!Number.isFinite(n) || n <= 0 || !Number.isFinite(p)) return 0;
  const phat = Math.max(0, Math.min(1, p));
  const denom = 1 + (z * z) / n;
  const centre = phat + (z * z) / (2 * n);
  const margin = z * Math.sqrt((phat * (1 - phat)) / n + (z * z) / (4 * n * n));
  return (centre - margin) / denom;
}

export default function useSteamDealsUnder15() {
  const [deals, setDeals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url = "https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=15&pageSize=60";
        const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const scored = (Array.isArray(json) ? json : []).map((d) => {
          const count = Number(d.steamRatingCount ?? 0);
          const percent = Number(d.steamRatingPercent ?? 0) / 100;
          const dealRating = Number(d.dealRating ?? 0);
          const score = wilsonLowerBound(percent, count, 1.96);
          return { raw: d, score, count, dealRating };
        });

        scored.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (b.count !== a.count) return b.count - a.count;
          return b.dealRating - a.dealRating;
        });

        const mapped = scored.map(({ raw }) => {
          const eur = raw.salePrice === "0.00" ? null : asEUR(raw.salePrice);
          const candidates = steamImageCandidates(raw.steamAppID);
          const cheapThumb = raw.thumb || null;

          return {
            id: raw.dealID,
            steamAppID: raw.steamAppID ?? null, // ← nécessaire pour router vers /steam/app/:appid
            title: raw.title,
            price: raw.salePrice === "0.00" ? "Gratuit" : eur ?? `${Number(raw.salePrice).toFixed(2)} $`,
            platform: "Steam",
            link: raw.steamAppID
              ? `https://store.steampowered.com/app/${raw.steamAppID}`
              : `https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(raw.dealID)}`,
            images: [...candidates, cheapThumb].filter(Boolean),
            steamRatingPercent: raw.steamRatingPercent ?? null,
            steamRatingCount: raw.steamRatingCount ?? null,
          };
        });

        setDeals(mapped);
      } catch (e) {
        setError(e.message || "Erreur");
        setDeals(null);
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  return { deals, loading, error };
}
