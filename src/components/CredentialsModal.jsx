import { useState } from "react";

export default function CredentialsModal({ show, onSave, onCancel }) {
  const [username, setUsername] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Le nom d'utilisateur est requis");
      return;
    }
    if (!apiKey.trim()) {
      setError("La clé API est requise");
      return;
    }

    onSave(username.trim(), apiKey.trim());
  };

  if (!show) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onCancel}
      />

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onCancel?.()}
      >
  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-t-xl">
            <h5 className="text-xl font-bold text-slate-900 dark:text-white">
              Configuration Nexus Mods
            </h5>
            {onCancel && (
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                onClick={onCancel}
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4 bg-slate-50 dark:bg-slate-900">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Pour utiliser cette application, vous devez fournir vos identifiants
                Nexus Mods. Ces informations seront stockées localement dans votre
                navigateur et ne seront jamais partagées.
              </p>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg text-red-800 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="nexus-username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nom d'utilisateur Nexus Mods
                </label>
                <input
                  type="text"
                  className="pico-input"
                  id="nexus-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="VotreNomDUtilisateur"
                  autoComplete="username"
                />
                <small className="block mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Votre nom d'utilisateur sur nexusmods.com
                </small>
              </div>

              <div>
                <label htmlFor="nexus-apikey" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Clé API Nexus Mods
                </label>
                <input
                  type="password"
                  className="pico-input"
                  id="nexus-apikey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="votre-clé-api-privée"
                  autoComplete="off"
                />
                <small className="block mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Rendez-vous sur{" "}
                  <a
                    href="https://www.nexusmods.com/users/myaccount?tab=api"
                    target="_blank"
                    rel="noreferrer"
                    className="text-pico-primary hover:underline"
                  >
                    votre page de paramètres Nexus Mods
                  </a>
                  {" "}et copiez la clé <strong>"Personal API Key"</strong> qui se trouve <strong>tout en bas de la page</strong>.
                </small>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                <strong className="text-blue-800 dark:text-blue-200">🔒 Sécurité :</strong> Vos identifiants sont stockés uniquement
                dans votre navigateur (localStorage) et ne transitent que vers les
                serveurs de Nexus Mods.
              </div>
            </div>

            <div className="flex gap-3 justify-end p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-b-xl">
              {onCancel && (
                <button
                  type="button"
                  className="pico-btn-outline"
                  onClick={onCancel}
                >
                  Annuler
                </button>
              )}
              <button type="submit" className="pico-btn-primary">
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

