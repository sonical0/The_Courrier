import { useState, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ActuUpdatePage from "./pages/ActuUpdatePage";
import NexusModsPage from "./pages/NexusModsPage.jsx";
import CredentialsModal from "./components/CredentialsModal";
import useNexusCredentials from "./components/useNexusCredentials";
import useNexusMods from "./components/useNexusMods";
import useLastVisit from "./components/useLastVisit";
import useTheme from "./components/useTheme";

export default function App() {
  const { credentials, loading, saveCredentials, clearCredentials, hasCredentials } = useNexusCredentials();
  const { loading: modsLoading, games, modsForGame } = useNexusMods(credentials);
  const { countNew } = useLastVisit();
  const [showModal, setShowModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Calculer le nombre de nouveaux mods
  const newModsCount = useMemo(() => {
    if (modsLoading || !games.length) return 0;
    const allMods = [];
    for (const g of games) {
      const key = g.domain || g.gameId || g.name;
      allMods.push(...modsForGame(key));
    }
    return countNew(allMods);
  }, [games, modsForGame, countNew, modsLoading]);

  const handleSaveCredentials = (username, apiKey) => {
    if (saveCredentials(username, apiKey)) {
      setShowModal(false);
      setIsMenuOpen(false);
    } else {
      alert("Erreur lors de la sauvegarde des identifiants");
    }
  };

  const handleClearCredentials = () => {
    if (window.confirm("Voulez-vous vraiment supprimer vos identifiants Nexus Mods ?")) {
      clearCredentials();
    }
  };

  const shouldShowModal = showModal || (!loading && !hasCredentials);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <header className="bg-slate-50 dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-700">
          <div className="container mx-auto px-4">
            <nav className="flex items-center justify-between py-4">
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer no-underline">
                <img
                  src="/logo512.png"
                  alt="The Courrier Logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-[68px] md:h-[68px]"
                />
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  The Courrier
                </h1>
              </Link>

              <div className="hidden xl:flex items-center gap-6">
                <div className="flex gap-4">
                  <Link
                    to="/"
                    className="text-slate-700 dark:text-slate-300 hover:text-pico-primary dark:hover:text-pico-primary transition-colors font-medium"
                  >
                    📊 Tableau de bord
                  </Link>
                  <Link
                    to="/actus"
                    className="text-slate-700 dark:text-slate-300 hover:text-pico-primary dark:hover:text-pico-primary transition-colors font-medium relative"
                  >
                    Mise à jour
                    {newModsCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {newModsCount > 99 ? "99+" : newModsCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/nexus-mods"
                    className="text-slate-700 dark:text-slate-300 hover:text-pico-primary dark:hover:text-pico-primary transition-colors font-medium"
                  >
                    Liste des Mods
                  </Link>
                </div>

                {hasCredentials && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                    ✓ {credentials?.username}
                  </span>
                )}

                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
                  title={theme === "light" ? "Passer en mode nuit" : "Passer en mode jour"}
                >
                  {theme === "light" ? "🌙 Nuit" : "☀️ Jour"}
                </button>

                <button
                  className="px-4 py-2 rounded-lg bg-pico-primary hover:bg-pico-primary-hover text-white transition-colors font-medium"
                  onClick={() => setShowModal(true)}
                  title={hasCredentials ? "Modifier les identifiants" : "Configurer les identifiants"}
                >
                  ⚙️ Config
                </button>

                {hasCredentials && (
                  <button
                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors font-medium"
                    onClick={handleClearCredentials}
                    title="Supprimer les identifiants"
                  >
                    🗑️
                  </button>
                )}
              </div>

              <div className="xl:hidden">
                <button
                  aria-label="Ouvrir le menu"
                  className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => setIsMenuOpen((v) => !v)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                       viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                </button>
              </div>
            </nav>

            {isMenuOpen && (
              <div className="xl:hidden pb-4">
                <div className={`flex flex-col gap-3 rounded-xl border p-4 transition-colors ${
                  theme === 'dark' 
                    ? 'border-slate-700 bg-slate-800' 
                    : 'border-slate-200 bg-white'
                }`}>
                  <Link
                    to="/"
                    onClick={() => setIsMenuOpen(false)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors font-medium ${
                      theme === 'dark'
                        ? 'bg-slate-700 text-white hover:bg-slate-600'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    📊 Tableau de bord
                  </Link>
                  <Link
                    to="/actus"
                    onClick={() => setIsMenuOpen(false)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors font-medium relative ${
                      theme === 'dark'
                        ? 'bg-slate-700 text-white hover:bg-slate-600'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    Mise à jour
                    {newModsCount > 0 && (
                      <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {newModsCount > 99 ? "99+" : newModsCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/nexus-mods"
                    onClick={() => setIsMenuOpen(false)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors font-medium ${
                      theme === 'dark'
                        ? 'bg-slate-700 text-white hover:bg-slate-600'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    Liste des Mods
                  </Link>
                  <button
                    onClick={() => {
                      toggleTheme();
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors font-medium ${
                      theme === 'dark'
                        ? 'bg-slate-700 text-white hover:bg-slate-600'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                    title={theme === "light" ? "Passer en mode nuit" : "Passer en mode jour"}
                  >
                    {theme === "light" ? "🌙 Nuit" : "☀️ Jour"}
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 rounded-lg bg-pico-primary hover:bg-pico-primary-hover text-white transition-colors font-medium"
                    title={hasCredentials ? "Modifier les identifiants" : "Configurer les identifiants"}
                  >
                    ⚙️ Config
                  </button>

                  <div className="flex items-center justify-between pt-2">
                    {hasCredentials ? (
                      <>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          theme === 'dark'
                            ? 'bg-green-900/30 text-green-300'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          ✓ {credentials?.username}
                        </span>
                        <button
                          className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors font-medium"
                          onClick={handleClearCredentials}
                          title="Supprimer les identifiants"
                        >
                          🗑️
                        </button>
                      </>
                    ) : (
                      <span className={`text-sm ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Identifiants non configurés
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        <CredentialsModal
          show={shouldShowModal}
          onSave={handleSaveCredentials}
          onCancel={hasCredentials ? () => setShowModal(false) : undefined}
        />

        <main>
          {loading ? (
            <div className="container mx-auto px-4 py-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">Chargement...</p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<DashboardPage credentials={credentials} />} />
              <Route path="/actus" element={<ActuUpdatePage credentials={credentials} />} />
              <Route path="/nexus-mods" element={<NexusModsPage credentials={credentials} />} />
            </Routes>
          )}
        </main>
      </div>
    </Router>
  );
}
