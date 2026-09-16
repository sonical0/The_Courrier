import { useState } from "react";

export default function CredentialsModal({ show, onSave, onCancel, accounts = [], activeAccountId = null, onSwitch, onRemove }) {
  const [username, setUsername] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // null | "ok" | "error"
  const [testMessage, setTestMessage] = useState("");

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    setTestResult(null);
    setTestMessage("");
  };

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
    setTestResult(null);
    setTestMessage("");
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setTestMessage("");
    try {
      const r = await fetch("/api/nexus/validate", {
        headers: {
          "X-Nexus-Username": username.trim(),
          "X-Nexus-ApiKey": apiKey.trim(),
        },
      });
      if (r.ok) {
        const d = await r.json();
        setTestResult("ok");
        setTestMessage(`Connexion reussie — connecte en tant que ${d.name || username.trim()}`);
      } else {
        setTestResult("error");
        setTestMessage("Cle API invalide ou utilisateur introuvable");
      }
    } catch {
      setTestResult("error");
      setTestMessage("Impossible de contacter les serveurs Nexus Mods");
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Le nom d'utilisateur est requis");
      return;
    }
    if (!apiKey.trim()) {
      setError("La cle API est requise");
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
              {accounts.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Comptes enregistres
                  </p>
                  <ul className="space-y-2">
                    {accounts.map((a) => (
                      <li
                        key={a.id}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${
                          a.id === activeAccountId
                            ? "border-pico-primary bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 font-medium"
                            : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <button
                          type="button"
                          className="flex-1 text-left hover:underline"
                          onClick={() => onSwitch?.(a.id)}
                          data-testid={`account-switch-${a.id}`}
                        >
                          {a.username}
                          {a.id === activeAccountId && (
                            <span className="ml-2 text-xs font-normal opacity-70">actif</span>
                          )}
                        </button>
                        {accounts.length > 1 && (
                          <button
                            type="button"
                            className="ml-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            onClick={() => onRemove?.(a.id)}
                            title={`Supprimer le compte ${a.username}`}
                            data-testid={`account-remove-${a.id}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  <hr className="my-4 border-slate-200 dark:border-slate-700" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ajouter un compte
                  </p>
                </div>
              )}

              {accounts.length === 0 && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Pour utiliser cette application, vous devez fournir vos identifiants
                  Nexus Mods. Ces informations seront stockees localement dans votre
                  navigateur et ne seront jamais partagees.
                </p>
              )}

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
                  onChange={handleUsernameChange}
                  placeholder="VotreNomDUtilisateur"
                  autoComplete="username"
                />
                <small className="block mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Votre nom d'utilisateur sur nexusmods.com
                </small>
              </div>

              <div>
                <label htmlFor="nexus-apikey" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Cle API Nexus Mods
                </label>
                <input
                  type="password"
                  className="pico-input"
                  id="nexus-apikey"
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  placeholder="votre-cle-api-privee"
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
                    votre page de parametres Nexus Mods
                  </a>
                  {" "}et copiez la cle <strong>"Personal API Key"</strong> qui se trouve <strong>tout en bas de la page</strong>.
                </small>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  className="pico-btn-outline w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleTest}
                  disabled={testing || !username.trim() || !apiKey.trim()}
                  data-testid="test-connection-btn"
                >
                  {testing ? "Test en cours..." : "Tester la connexion"}
                </button>
                {testMessage && (
                  <p
                    className={`text-sm font-medium ${
                      testResult === "ok"
                        ? "text-green-700 dark:text-green-400"
                        : "text-red-700 dark:text-red-400"
                    }`}
                    data-testid="test-result-message"
                  >
                    {testMessage}
                  </p>
                )}
              </div>

              <div className="p-3 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                <strong className="text-blue-800 dark:text-blue-200">Securite :</strong> Vos identifiants sont stockes uniquement
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
