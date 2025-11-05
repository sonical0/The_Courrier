export default function App() {
  const games = [
    { id: 1, 
      title: "Legacy: Steel & Sorcery", 
      price: "Gratuit à jouer jusqu'au 27/10/2025", 
      img: "https://picsum.photos/640/360?random=11", 
      platform: "Steam", dev: "Notorious Studios", 
      link: "https://store.steampowered.com/" 
    },
    { id: 1, 
      title: "Legacy: Steel & Sorcery", 
      price: "Gratuit à jouer jusqu'au 27/10/2025", 
      img: "https://picsum.photos/640/360?random=11", 
      platform: "Steam", dev: "Notorious Studios", 
      link: "https://store.steampowered.com/" 
    },
    { id: 1, 
      title: "Legacy: Steel & Sorcery", 
      price: "Gratuit à jouer jusqu'au 27/10/2025", 
      img: "https://picsum.photos/640/360?random=11", 
      platform: "Steam", dev: "Notorious Studios", 
      link: "https://store.steampowered.com/" 
    },
    { id: 1, 
      title: "Legacy: Steel & Sorcery", 
      price: "Gratuit à jouer jusqu'au 27/10/2025", 
      img: "https://picsum.photos/640/360?random=11", 
      platform: "Steam", dev: "Notorious Studios", 
      link: "https://store.steampowered.com/" 
    },
    { id: 1, 
      title: "Legacy: Steel & Sorcery", 
      price: "Gratuit à jouer jusqu'au 27/10/2025", 
      img: "https://picsum.photos/640/360?random=11", 
      platform: "Steam", dev: "Notorious Studios", 
      link: "https://store.steampowered.com/" 
    },
    { id: 1, 
      title: "Legacy: Steel & Sorcery", 
      price: "Gratuit à jouer jusqu'au 27/10/2025", 
      img: "https://picsum.photos/640/360?random=11", 
      platform: "Steam", dev: "Notorious Studios", 
      link: "https://store.steampowered.com/" 
    },
    { id: 1, 
      title: "Legacy: Steel & Sorcery", 
      price: "Gratuit à jouer jusqu'au 27/10/2025", 
      img: "https://picsum.photos/640/360?random=11", 
      platform: "Steam", dev: "Notorious Studios", 
      link: "https://store.steampowered.com/" 
    },
  
    { id: 1, 
      title: "Legacy: Steel & Sorcery", 
      price: "Gratuit à jouer jusqu'au 27/10/2025", 
      img: "https://picsum.photos/640/360?random=11", 
      platform: "Steam", dev: "Notorious Studios", 
      link: "https://store.steampowered.com/" 
    },
    { id: 1, 
      title: "Legacy: Steel & Sorcery", 
      price: "Gratuit à jouer jusqu'au 27/10/2025", 
      img: "https://picsum.photos/640/360?random=11", 
      platform: "Steam", dev: "Notorious Studios", 
      link: "https://store.steampowered.com/" 
    },
    { id: 1, 
      title: "Legacy: Steel & Sorcery", 
      price: "Gratuit à jouer jusqu'au 27/10/2025", 
      img: "https://picsum.photos/640/360?random=11", 
      platform: "Steam", dev: "Notorious Studios", 
      link: "https://store.steampowered.com/" 
    },
    { id: 1, 
      title: "Legacy: Steel & Sorcery", 
      price: "Gratuit à jouer jusqu'au 27/10/2025", 
      img: "https://picsum.photos/640/360?random=11", 
      platform: "Steam", dev: "Notorious Studios", 
      link: "https://store.steampowered.com/" 
    }, ];

  return (
    <div className="min-h-full text-neutral-100">
      {/* HEADER */}
      <header className="sticky top-0 z-10 border-b border-white/10 backdrop-blur">
        <nav className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-3">
          <a className="font-bold tracking-tight text-white" href="#">FreeStuff</a>
        </nav>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-[1100px] px-4 py-8 text-center">
        <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">Check ça</h1>
      </section>

      {/* GRILLE + RAILS */}
      <section className="page-rails py-6">
        <div className="mx-auto max-w-[1100px] px-4">
          {/* 1 col (mobile ≤576), 2 col tablettes/laptops (≥577), 3 col desktop (≥1200) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {games.map((g) => (
              <article key={g.id} className="game-card">
                {/* IMAGE: hauteur selon breakpoint (formats de carte) */}
                <div className="relative">
                  <img
                    src={g.img}
                    alt={g.title}
                    className="game-img h-40 sm:h-48 xl:h-56"
                  />
                  {/* Badge plateforme (compact mobile, standard desktop) */}
                  <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] sm:text-xs">
                    {g.platform}
                  </span>
                </div>

                {/* CONTENU: compact → standard → étendu */}
                <div className="p-3 sm:p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold sm:text-base xl:text-lg">{g.title}</h3>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="price text-sm sm:text-base">{g.price}</span>

                    {/* CTA: taille selon format */}
                    <a
                      href={g.link}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md bg-[var(--pico-primary)] px-2 py-1 text-xs font-medium text-white hover:bg-[var(--pico-primary-hover)] sm:px-3 sm:py-1.5 sm:text-sm"
                    >
                      Ouvrir ↗
                    </a>
                  </div>

                  {/* Métadonnées visibles dès md */}
                  <p className="mt-1 hidden text-[12px] text-[color:var(--pico-muted-color)] sm:block">© {g.dev}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
