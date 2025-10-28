import { useState } from "react";

export default function FreeStuffButton() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setLoading(true);
    setError("");
    try {
      const base = process.env.REACT_APP_FREESTUFF_BASE;
      const url = `${base}/static/products?type=keep&kind=game&limit=12&offset=0`;
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${process.env.REACT_APP_FREESTUFF_API_KEY}`,
          "Accept": "application/json",
          // "X-Compatibility-Date": "2025-10-01" // optionnel si requis par la version
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // selon la forme: utilise data.products || data.list || data
      const list = data.products ?? data.list ?? (Array.isArray(data) ? data : []);
      setProducts(list);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-black hover:bg-orange-400 disabled:opacity-50"
        >
          {loading ? "Chargement..." : "Charger les jeux gratuits"}
        </button>
        {error && <span className="text-red-400 text-sm">Erreur: {error}</span>}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <article
            key={p.id ?? `${p.store}-${p.until}-${p.title ?? Math.random()}`}
            className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900"
          >
            <div className="p-4">
              <h3 className="line-clamp-2 text-base font-medium text-white">
                {p.title ?? p.name ?? "Jeu sans titre"}
              </h3>
              <p className="mt-1 text-xs text-neutral-400">
                {p.store ? `Store: ${p.store}` : "Store inconnu"}
                {p.until ? ` · Jusqu’au ${new Date(p.until).toLocaleString()}` : ""}
              </p>
              <div className="mt-3 flex justify-end">
                <a
                  href={p.url ?? p.link ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                >
                  Ouvrir
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      {(!loading && products.length === 0 && !error) && (
        <p className="mt-4 text-neutral-400 text-sm">
          Aucun résultat pour le moment.
        </p>
      )}
    </section>
  );
}
