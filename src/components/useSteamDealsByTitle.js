import { useEffect, useState } from "react";

const API = "https://www.cheapshark.com/api/1.0";
const USD_EUR_RATE =
  Number(process.env.REACT_APP_USD_EUR_RATE) > 0 ? Number(process.env.REACT_APP_USD_EUR_RATE) : 0.95;

function eurValueFromUSD(usdStr) {
  const n = Number(usdStr);
  return Number.isFinite(n) ? n * USD_EUR_RATE : null;
}
function formatEUR(val) {
  if (!Number.isFinite(val)) return null;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(val);
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

export default function useSteamDealsByTitle(title) {
  const [deals, setDeals] = useState(null);   // null = pas lancé ; [] = aucun résultat
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = (title || "").trim();
    if (!q) { setDeals(null); setLoading(false); setError(null); return; }

    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // IMPORTANT: pas de onSale=1 -> récupère aussi les jeux non remisés
        const params = new URLSearchParams({
          storeID: "1",         // Steam
          pageSize: "60",
          title: q,
          // pas de onSale
        });
        const res = await fetch(`${API}/deals?${params.toString()}`, {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const mapped = (Array.isArray(json) ? json : []).map((d) => {
          // CheapShark renvoie toujours salePrice/normalPrice (USD).
          // Si pas en promo, salePrice ≈ normalPrice.
          const isFree = d.salePrice === "0.00";
          const eurVal = isFree ? 0 : eurValueFromUSD(d.salePrice);
          const priceLabel = isFree ? "Gratuit" : formatEUR(eurVal) ?? `${Number(d.salePrice).toFixed(2)} $`;

          const candidates = steamImageCandidates(d.steamAppID);
          const cheapThumb = d.thumb || null;
          const steamLink = d.steamAppID
            ? `https://store.steampowered.com/app/${d.steamAppID}`
            : `https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(d.dealID)}`;

          return {
            id: d.dealID,
            title: d.title,
            price: priceLabel,
            priceValueEUR: eurVal, // nombre en €
            platform: "Steam",
            link: steamLink,
            images: [...candidates, cheapThumb].filter(Boolean),
          };
        });

        setDeals(mapped); // [] => "aucun résultat"
      } catch (e) {
        setError(e.message || "Erreur");
        setDeals(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [title]);

  return { deals, loading, error };
}
