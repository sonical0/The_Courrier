export default function App() {
  const games = [
    { id: 1, title: "Cyberpunk 2077", price: "29,99 €", img: "https://picsum.photos/640/360?random=1" },
    { id: 2, title: "Elden Ring",     price: "39,99 €", img: "https://picsum.photos/640/360?random=2" },
    { id: 3, title: "Red Dead Redemption 2", price: "24,99 €", img: "https://picsum.photos/640/360?random=3" },
    { id: 4, title: "Starfield",      price: "49,99 €", img: "https://picsum.photos/640/360?random=4" },
    { id: 5, title: "Baldur's Gate 3", price: "44,99 €", img: "https://picsum.photos/640/360?random=5" },
    { id: 6, title: "Horizon Forbidden West", price: "39,99 €", img: "https://picsum.photos/640/360?random=6" },
  ];

  return (
    <div className="min-h-full bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <a className="font-bold tracking-tight text-white" href="#">Instant Gaming</a>
          <div className="hidden gap-6 md:flex">
            <a className="text-neutral-300 hover:text-white" href="#">Offres</a>
            <a className="text-neutral-300 hover:text-white" href="#">Nouveautés</a>
            <a className="text-neutral-300 hover:text-white" href="#">Prochaines sorties</a>
            <a className="text-neutral-300 hover:text-white" href="#">Support</a>
          </div>
          <div className="flex items-center gap-2">
            <a className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-200 hover:bg-white/5" href="#">
              Connexion
            </a>
            <a className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-orange-400" href="#">
              S’inscrire
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
          Jeux PC, consoles et cartes à prix réduits
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-neutral-400">
          Vos titres préférés jusqu’à −80% instantanément.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <a className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-black hover:bg-orange-400" href="#">
            Voir toutes les offres
          </a>
          <a className="rounded-xl border border-white/15 px-5 py-3 font-semibold text-white hover:bg-white/5" href="#">
            Parcourir les catégories
          </a>
        </div>
      </section>

      {/* Grid d’offres */}
      <main className="mx-auto max-w-7xl px-4 pb-16">
        <h2 className="mb-4 text-xl font-semibold">Offres populaires</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <article
              key={g.id}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 transition-transform hover:-translate-y-1"
            >
              <div className="relative">
                <img
                  src={g.img}
                  alt={g.title}
                  className="h-44 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs text-white">
                  -72%
                </span>
              </div>
              <div className="p-4">
                <h3 className="line-clamp-1 text-base font-medium text-white">{g.title}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-bold text-orange-400">{g.price}</span>
                  <button
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                    type="button"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <a className="rounded-xl border border-white/15 px-5 py-3 font-semibold text-white hover:bg-white/5" href="#">
            Voir plus
          </a>
        </div>

        {/* Section À propos */}
        <section className="mt-16">
          <h2 className="mb-2 text-xl font-semibold">À propos</h2>
          <p className="max-w-3xl text-neutral-400">
            Plateforme de jeux dématérialisés à prix réduit. Achetez vos clés Steam, Ubisoft Connect, EA app
            ou Epic Games instantanément, téléchargez et jouez.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-neutral-400">
        © {new Date().getFullYear()} Instant Gaming — Tous droits réservés
      </footer>
    </div>
  );
}
