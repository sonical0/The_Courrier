// src/pages/GameDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchSteamSpyApp } from "../components/steamspy";
import { fetchSteamStoreDetails } from "../components/steamStore";

function toMinutesLabel(min) {
  const n = Number(min || 0);
  return `${n} min${n >= 60 ? ` (${(n / 60).toFixed(1)} h)` : ""}`;
}
function stripHtml(html) {
  if (!html) return "";
  const withBreaks = html.replace(/<br\s*\/?>/gi, "\n");
  const tmp = withBreaks.replace(/<[^>]+>/g, "");
  return tmp.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

// Conversion prix → EUR (fallback taux si non fourni)
const USD_EUR_RATE =
  Number(process.env.REACT_APP_USD_EUR_RATE) > 0 ? Number(process.env.REACT_APP_USD_EUR_RATE) : 0.95;
function fmtEUR(valueEUR) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(valueEUR);
}
function priceToEUR({ store, spy }) {
  // 1) Steam Store prioritaire
  const po = store?.price_overview;
  if (po && typeof po.final === "number") {
    if (po.currency === "EUR") return { priceText: fmtEUR(po.final / 100), discount: po.discount_percent || 0 };
    return { priceText: fmtEUR((po.final / 100) * USD_EUR_RATE), discount: po.discount_percent || 0 };
  }
  // 2) SteamSpy (USD cents)
  if (spy && typeof spy.price === "number" && spy.price > 0) {
    return { priceText: fmtEUR((spy.price / 100) * USD_EUR_RATE), discount: Number(spy.discount || 0) };
  }
  return { priceText: "—", discount: null };
}

export default function GameDetails() {
  const { appid } = useParams();
  const [spy, setSpy] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const steamPage = useMemo(
    () => (appid ? `https://store.steampowered.com/app/${appid}` : null),
    [appid]
  );
  const headerImg = useMemo(
    () => (appid ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg` : null),
    [appid]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [spyRes, storeRes] = await Promise.allSettled([
          fetchSteamSpyApp(appid, { signal: ctrl.signal }),
          fetchSteamStoreDetails(appid, { signal: ctrl.signal }),
        ]);

        setSpy(spyRes.status === "fulfilled" ? (spyRes.value || null) : null);
        setStore(storeRes.status === "fulfilled" ? (storeRes.value || null) : null);

        if (spyRes.status === "rejected" && storeRes.status === "rejected") {
          const msg =
            spyRes.reason?.message ||
            storeRes.reason?.message ||
            "Échec des requêtes";
          throw new Error(msg);
        }
      } catch (e) {
        setError(e.message || "Erreur");
        setSpy(null);
        setStore(null);
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [appid]);

  if (loading) return <p className="mt-8 text-center">Chargement…</p>;
  if (error) return <p className="mt-8 text-center text-red-500">Erreur : {error}</p>;
  if (!spy && !store) return <p className="mt-8 text-center">Aucune donnée</p>;

  const name = store?.name ?? spy?.name ?? "—";
  const publisher = store?.publishers?.join(", ") ?? spy?.publisher ?? "—";
  const developer = store?.developers?.join(", ") ?? spy?.developer ?? "—";
  const owners = spy?.owners ?? "—";
  const ccu = Number(spy?.ccu ?? 0);
  const avgForever = toMinutesLabel(spy?.average_forever);
  const avg2w = toMinutesLabel(spy?.average_2weeks);
  const scoreRank = spy?.score_rank ?? "—";
  const shortDesc = stripHtml(store?.short_description);
  const { priceText, discount } = priceToEUR({ store, spy });

  const topTags = spy?.tags
    ? Object.entries(spy.tags).sort((a, b) => b[1] - a[1]).slice(0, 12)
    : [];

  return (
    <div className="min-h-full text-neutral-100">
      {/* Bandeau */}
      <div className="w-full bg-[#1e1f22] border-b border-[#1e1f22]">
        <div className="mx-auto max-w-[1100px] px-4 py-6">
          <Link to="/" className="text-sm text-[var(--pico-muted-color)] hover:underline">← Retour</Link>
          <h1 className="mt-2 text-2xl font-bold">{name}</h1>
        </div>
      </div>

      {/* Layout principal simplifié */}
      <div className="mx-auto max-w-[1100px] px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche */}
        <div className="lg:col-span-2">
          {headerImg && (
            <img
              src={headerImg}
              alt={name}
              className="w-full h-auto rounded-lg border border-[#1e1f22]"
            />
          )}

          {topTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {topTags.map(([tag, votes]) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs"
                  title={`${votes} votes`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {shortDesc && (
            <div className="mt-5">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-[var(--pico-muted-color)] whitespace-pre-line">{shortDesc}</p>
            </div>
          )}
        </div>

        {/* Colonne droite (achat + stats) */}
        <aside className="lg:col-span-1">
          <article className="rounded-xl border border-[#1e1f22] bg-[#313338] p-4">
            <h3 className="text-base font-semibold mb-3">Acheter</h3>
            <div className="flex items-baseline justify-between">
              <div className="text-xl font-bold">{priceText}</div>
              {typeof discount === "number" && discount > 0 && (
                <span className="rounded-md bg-green-600/20 px-2 py-1 text-xs font-semibold text-green-400">
                  -{discount}%
                </span>
              )}
            </div>
            <a
              href={steamPage || "#"}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block w-full text-center rounded-md bg-[var(--pico-primary)] px-4 py-2 font-medium text-white hover:bg-[var(--pico-primary-hover)]"
            >
              Ouvrir la page Steam
            </a>
          </article>

          <article className="mt-4 rounded-xl border border-[#1e1f22] bg-[#313338] p-4">
            <h3 className="text-base font-semibold mb-3">Informations</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--pico-muted-color)]">Développeur</span>
                <span className="text-right">{developer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--pico-muted-color)]">Éditeur</span>
                <span className="text-right">{publisher}</span>
              </div>
            </div>
          </article>

          <article className="mt-4 rounded-xl border border-[#1e1f22] bg-[#313338] p-4">
            <h3 className="text-base font-semibold mb-3">Statistiques</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--pico-muted-color)]">Propriétaires estimés</span>
                <span>{owners}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--pico-muted-color)]">Pic joueurs (hier)</span>
                <span>{ccu}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--pico-muted-color)]">Temps moyen total</span>
                <span>{avgForever}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--pico-muted-color)]">Temps moyen 2 semaines</span>
                <span>{avg2w}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--pico-muted-color)]">Rang (avis)</span>
                <span>{scoreRank}</span>
              </div>
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}
