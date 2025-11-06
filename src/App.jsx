import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import BootstrapPage from "./pages/BootstrapPage";
import TailwindPage from "./pages/TailwindPage";
import NexusModsPage from "./pages/NexusModsPage.jsx";
import CredentialsModal from "./components/CredentialsModal";
import useNexusCredentials from "./components/useNexusCredentials";
import useTheme from "./components/useTheme";

export default function App() {
  const { credentials, loading, saveCredentials, clearCredentials, hasCredentials } = useNexusCredentials();
  const [showModal, setShowModal] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSaveCredentials = (username, apiKey) => {
    if (saveCredentials(username, apiKey)) {
      setShowModal(false);
    } else {
      alert("Erreur lors de la sauvegarde des identifiants");
    }
  };

  const handleClearCredentials = () => {
    if (window.confirm("Voulez-vous vraiment supprimer vos identifiants Nexus Mods ?")) {
      clearCredentials();
    }
  };

  // Afficher le modal si pas de credentials
  const shouldShowModal = !loading && !hasCredentials && !showModal;

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        {/* Header inspiré de PicoCSS */}
        <header className="bg-slate-50 dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-700">
          <div className="container mx-auto px-4">
            <nav className="flex items-center justify-between py-4">
              <div className="flex items-center gap-6">
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
                <div className="flex gap-4">
                  <Link 
                    to="/" 
                    className="text-slate-700 dark:text-slate-300 hover:text-pico-primary dark:hover:text-pico-primary transition-colors font-medium"
                  >
                    Actus Mods
                  </Link>
                  <Link 
                    to="/tailwind" 
                    className="text-slate-700 dark:text-slate-300 hover:text-pico-primary dark:hover:text-pico-primary transition-colors font-medium"
                  >
                    Tailwind
                  </Link>
                  <Link 
                    to="/nexus-mods" 
                    className="text-slate-700 dark:text-slate-300 hover:text-pico-primary dark:hover:text-pico-primary transition-colors font-medium"
                  >
                    Nexus Mods
                  </Link>
                </div>
              </div>
              
              <div className="flex gap-3 items-center">
                {hasCredentials && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                    ✓ {credentials?.username}
                  </span>
                )}
                
                {/* Bouton Jour/Nuit */}
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
                  title={theme === 'light' ? 'Passer en mode nuit' : 'Passer en mode jour'}
                >
                  {theme === 'light' ? '🌙 Nuit' : '☀️ Jour'}
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
            </nav>
          </div>
        </header>

        <CredentialsModal
          show={showModal || shouldShowModal}
          onSave={handleSaveCredentials}
          onCancel={showModal ? () => setShowModal(false) : undefined}
        />

        <main>
          <Routes>
            <Route path="/" element={<BootstrapPage credentials={credentials} />} />
            <Route path="/tailwind" element={<TailwindPage />} />
            <Route path="/nexus-mods" element={<NexusModsPage credentials={credentials} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

