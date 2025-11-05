import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import BootstrapPage from "./pages/BootstrapPage";
import TailwindPage from "./pages/TailwindPage";
import NexusModsPage from "./pages/NexusModsPage.jsx";
import CredentialsModal from "./components/CredentialsModal";
import useNexusCredentials from "./components/useNexusCredentials";

export default function App() {
  const { credentials, loading, saveCredentials, clearCredentials, hasCredentials } = useNexusCredentials();
  const [showModal, setShowModal] = useState(false);

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
      <nav className="p-3 bg-light d-flex justify-content-between align-items-center">
        <div className="d-flex gap-3">
          <Link to="/">Actus Mods</Link>
          <Link to="/tailwind">Tailwind</Link>
          <Link to="/nexus-mods">Nexus Mods</Link>
        </div>
        <div className="d-flex gap-2 align-items-center">
          {hasCredentials && (
            <span className="badge bg-success">
              ✓ {credentials?.username}
            </span>
          )}
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => setShowModal(true)}
            title={hasCredentials ? "Modifier les identifiants" : "Configurer les identifiants"}
          >
            ⚙️ Config
          </button>
          {hasCredentials && (
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={handleClearCredentials}
              title="Supprimer les identifiants"
            >
              🗑️
            </button>
          )}
        </div>
      </nav>

      <CredentialsModal
        show={showModal || shouldShowModal}
        onSave={handleSaveCredentials}
        onCancel={showModal ? () => setShowModal(false) : undefined}
      />

      <Routes>
        <Route path="/" element={<BootstrapPage credentials={credentials} />} />
        <Route path="/tailwind" element={<TailwindPage />} />
        <Route path="/nexus-mods" element={<NexusModsPage credentials={credentials} />} />
      </Routes>
    </Router>
  );
}
