// src/App.jsx — recherche active sans filtre 15€, groupée <15€ puis ≥15€ avec séparateur
import { useState } from "react";
import useSteamDealsUnder15 from "./components/useSteamDealsUnder15.js";
import useSteamDealsByTitle from "./components/useSteamDealsByTitle.js";

function DealImage({ images, title }) {
  const [idx, setIdx] = useState(0);
  if (!images?.length) return null;
  const src = images[idx] || null;
  if (!src) return null;
  return (
    <img
      src={src}
      alt={title}
      className="game-img h-40 sm:h-48 xl:h-56"
      onError={() => {
        const next = idx + 1;
        if (next < images.length) setIdx(next);
      }}
    />
  );
}

function CardsGrid({ items }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-4">
      {items.map((g) => (
        <article key={g.id} className="game-card">
          <div className="relative">
            <DealImage images={g.images || (g.img ? [g.img] : [])} title={g.title} />
            <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] sm:text-xs">
              {g.platform || "Steam"}
            </span>
          </div>
          <div className="p-3 sm:p-4">
            <h3 className="line-clamp-2 text-sm font-semibold sm:text-base xl:text-lg">{g.title}</h3>
            <div className="mt-2 flex items-center justify-between">
              <span className="price text-sm sm:text-base">{g.price}</span>
              <a
                href={g.link}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-[var(--pico-primary)] px-2 py-1 text-xs font-medium text-white hover:bg-[var(--pico-primary-hover)] sm:px-3 sm:py-1.5 sm:text-sm"
              >
                Voir l’offre ↗
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function App() {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState(""); // vide => mode par défaut (≤15€)
  const search = useSteamDealsByTitle(query);     // actif si query !== ""
  const under15 = useSteamDealsUnder15();         // affiché uniquement si query === ""

  // États actifs selon le mode
  const activeLoading = query ? search.loading : under15.loading;
  const activeError = query ? search.error : under15.error;
  const activeDeals = query ? search.deals : under15.deals;

  // Groupes en mode recherche
  let under15Group = [];
  let over15Group = [];
  if (query && Array.isArray(activeDeals)) {
    under15Group = activeDeals.filter((d) => Number(d.priceValueEUR) <= 15);
    over15Group = activeDeals.filter((d) => !(Number(d.priceValueEUR) <= 15));
  }

  return (
    <div className="min-h-full text-neutral-100">
      {/* HEADER */}
      <header className="sticky top-0 z-10 border-b border-white/10 backdrop-blur">
        <nav className="mx-auto flex items-center justify-between px-4 py-3">
          <a className="font-bold tracking-tight text-white" href="#">FreeStuff</a>
          <span className="text-sm text-[color:var(--pico-muted-color)]">
            {query ? `Recherche: “${query}”` : "Steam ≤ 15€"}
          </span>
        </nav>
      </header>

      {/* HERO + RECHERCHE */}
      <section className="mx-auto max-w-[1100px] px-4 py-8 text-center">
        <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">Deals Steam</h1>
        <form
          className="mt-5"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(q.trim());
          }}
        >
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par titre (laisser vide pour ≤ 15€)"
            className="w-full rounded-lg border border-[#1e1f22] bg-[#313338] px-3 py-2 text-sm text-white placeholder-[#b5bac1] focus:outline-none"
            aria-label="Rechercher un jeu"
          />
        </form>
      </section>

      {/* États */}
      {activeLoading && <p className="text-center mt-10">Chargement…</p>}
      {activeError && <p className="text-center mt-10 text-red-500">Erreur : {activeError}</p>}

      {/* Contenu */}
      {!activeLoading && !activeError && (
        <section className="page-rails py-6">
          <div className="mx-auto max-w-[1100px] px-4 xl:mx-0 xl:max-w-none xl:w-full xl:px-3">
            {/* Mode par défaut (sans recherche) -> une seule grille ≤15€ */}
            {!query && Array.isArray(activeDeals) && (
              <CardsGrid items={activeDeals} />
            )}

            {/* Mode recherche -> deux sections */}
            {query && Array.isArray(activeDeals) && (
              <>
                <h2 className="mb-3 text-lg font-semibold">Jeux de moins de 15€</h2>
                {under15Group.length === 0 ? (
                  <p className="text-center text-[#b5bac1]">Aucun résultat</p>
                ) : (
                  <CardsGrid items={under15Group} />
                )}

                <hr className="my-8 border-t border-[var(--pico-border-color)]" />

                <h2 className="mb-3 text-lg font-semibold">Autres résultats (≥ 15€)</h2>
                {over15Group.length === 0 ? (
                  <p className="text-center text-[#b5bac1]">Aucun autre résultat</p>
                ) : (
                  <CardsGrid items={over15Group} />
                )}
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
