import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ActuUpdatePage from "./pages/ActuUpdatePage";
import NexusModsPage from "./pages/NexusModsPage.jsx";
import CredentialsModal from "./components/CredentialsModal";
import useNexusCredentials from "./components/useNexusCredentials";
import useTheme from "./components/useTheme";

export default function App() {
  const { credentials, loading, saveCredentials, clearCredentials, hasCredentials } = useNexusCredentials();
  const [showModal, setShowModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

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

  // Affichage auto du modal si pas de credentials (la demande explicite via bouton garde la priorité)
  const shouldShowModal = showModal || (!loading && !hasCredentials);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        {/* Header */}
        <header className="bg-slate-50 dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-700">
          <div className="container mx-auto px-4">
            <nav className="flex items-center justify-between py-4">
              {/* Logo + Title */}
              <div className="flex items-center gap-3">
                <img
                  src="/logo512.png"
                  alt="The Courrier Logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-[68px] md:h-[68px]"
                />
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  The Courrier
                </h1>
              </div>

              {/* Desktop nav (>= xl ~ 1280px) */}
              <div className="hidden xl:flex items-center gap-6">
                <div className="flex gap-4">
                  <Link
                    to="/"
                    className="text-slate-700 dark:text-slate-300 hover:text-pico-primary dark:hover:text-pico-primary transition-colors font-medium"
                  >
                    Actus Mods
                  </Link>
                  <Link
                    to="/nexus-mods"
                    className="text-slate-700 dark:text-slate-300 hover:text-pico-primary dark:hover:text-pico-primary transition-colors font-medium"
                  >
                    Nexus Mods
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

              {/* Burger (tablette et inférieur: < xl) */}
              <div className="xl:hidden">
                <button
                  aria-label="Ouvrir le menu"
                  className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => setIsMenuOpen((v) => !v)}
                >
                  {/* Icône 3 barres */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                       viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                </button>
              </div>
            </nav>

            {/* Panel mobile / tablette : menu vertical */}
            {isMenuOpen && (
              <div className="xl:hidden pb-4">
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
                  <Link
                    to="/"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-left px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                  >
                    Actus Mods
                  </Link>
                  <Link
                    to="/nexus-mods"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-left px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                  >
                    Nexus Mods
                  </Link>
                  <button
                    onClick={() => {
                      toggleTheme();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
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

                  {/* État utilisateur + action supprimer (optionnel mais utile) */}
                  <div className="flex items-center justify-between pt-2">
                    {hasCredentials ? (
                      <>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
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
                      <span className="text-sm text-slate-500 dark:text-slate-400">
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
              <Route path="/" element={<ActuUpdatePage credentials={credentials} />} />
              <Route path="/nexus-mods" element={<NexusModsPage credentials={credentials} />} />
            </Routes>
          )}
        </main>
      </div>
    </Router>
  );
}
