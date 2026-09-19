import { useState, useEffect, useRef } from "react";

/**
 * Fenêtre de configuration des identifiants Nexus Mods.
 *
 * Reprise sur les jetons `cr-*`. Au-delà de l'apparence, elle n'était pas une
 * vraie boîte de dialogue : pas de `role="dialog"`, pas de `aria-modal`, aucun
 * libellé associé, la touche Échap ne la fermait pas et le focus restait dans
 * la page derrière. Les libellés de champs et les `data-testid` sont conservés
 * tels quels — ils servent aux tests et à rien d'autre.
 */
export default function CredentialsModal({ show, onSave, onCancel, accounts = [], activeAccountId = null, onSwitch, onRemove }) {
  const [username, setUsername] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // null | "ok" | "error"
  const [testMessage, setTestMessage] = useState("");
  const champInitial = useRef(null);

  // Échap ferme, et le focus entre dans la fenêtre à l'ouverture : sans ça, la
  // tabulation continuait de parcourir la page masquée derrière.
  useEffect(() => {
    if (!show) return undefined;
    const surEchap = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", surEchap);
    champInitial.current?.focus();
    return () => document.removeEventListener("keydown", surEchap);
  }, [show, onCancel]);

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
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0, 0, 0, 0.55)" }}
        onClick={onCancel}
      />

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onCancel?.()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titre-config-nexus"
          className="w-full overflow-y-auto"
          style={{
            background: "var(--cr-surface)",
            color: "var(--cr-ink)",
            border: "1px solid var(--cr-line)",
            borderRadius: "var(--cr-radius)",
            maxWidth: "36rem",
            maxHeight: "90vh",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div
            className="flex items-center justify-between gap-3 p-5 border-b"
            style={{ borderColor: "var(--cr-line)" }}
          >
            <h2 id="titre-config-nexus" className="text-xl font-semibold m-0">
              Configuration Nexus Mods
            </h2>
            {onCancel && (
              <button type="button" className="cr-bouton" onClick={onCancel}>
                Fermer
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-5 flex flex-col gap-4">
              {accounts.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold m-0 mb-2">Comptes enregistrés</h3>
                  <ul className="m-0 p-0 list-none flex flex-col gap-2">
                    {accounts.map((a) => (
                      <li key={a.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          className="cr-filtre flex-1"
                          style={
                            a.id === activeAccountId
                              ? {
                                  background: "var(--cr-accent-soft)",
                                  borderColor: "var(--cr-accent)",
                                  color: "var(--cr-accent)",
                                  fontWeight: 600,
                                }
                              : undefined
                          }
                          aria-pressed={a.id === activeAccountId}
                          onClick={() => onSwitch?.(a.id)}
                          data-testid={`account-switch-${a.id}`}
                        >
                          {a.username}
                          {a.id === activeAccountId && (
                            <span className="cr-etiquette cr-etiquette-ok">actif</span>
                          )}
                        </button>
                        {accounts.length > 1 && (
                          <button
                            type="button"
                            className="cr-bouton flex-shrink-0"
                            style={{ color: "var(--cr-crit)", borderColor: "var(--cr-crit)" }}
                            onClick={() => onRemove?.(a.id)}
                            aria-label={`Supprimer le compte ${a.username}`}
                            data-testid={`account-remove-${a.id}`}
                          >
                            Supprimer
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  <h3
                    className="text-base font-semibold m-0 mt-4 pt-4 border-t"
                    style={{ borderColor: "var(--cr-line)" }}
                  >
                    Ajouter un compte
                  </h3>
                </div>
              )}

              {accounts.length === 0 && (
                <p className="m-0" style={{ color: "var(--cr-muted)" }}>
                  Pour utiliser cette application, vous devez fournir vos identifiants Nexus Mods.
                  Ces informations sont stockées dans votre navigateur et ne sont jamais partagées.
                </p>
              )}

              {error && (
                <p className="m-0">
                  <span className="cr-etiquette cr-etiquette-critique">{error}</span>
                </p>
              )}

              <div>
                <label htmlFor="nexus-username" className="block font-semibold mb-2">
                  Nom d'utilisateur Nexus Mods
                </label>
                <input
                  ref={champInitial}
                  type="text"
                  className="pico-input"
                  id="nexus-username"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="VotreNomDUtilisateur"
                  autoComplete="username"
                  aria-describedby="aide-username"
                />
                <p id="aide-username" className="mt-1 mb-0" style={{ color: "var(--cr-muted)" }}>
                  Votre nom d'utilisateur sur nexusmods.com
                </p>
              </div>

              <div>
                <label htmlFor="nexus-apikey" className="block font-semibold mb-2">
                  Clé API Nexus Mods
                </label>
                <input
                  type="password"
                  className="pico-input"
                  id="nexus-apikey"
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  placeholder="votre-cle-api-privee"
                  autoComplete="off"
                  aria-describedby="aide-apikey"
                />
                <p id="aide-apikey" className="mt-1 mb-0" style={{ color: "var(--cr-muted)" }}>
                  Rendez-vous sur{" "}
                  <a
                    href="https://www.nexusmods.com/users/myaccount?tab=api"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--cr-accent)" }}
                  >
                    votre page de paramètres Nexus Mods
                  </a>{" "}
                  et copiez la clé <strong>« Personal API Key »</strong>, tout en bas de la page.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="cr-bouton w-full"
                  onClick={handleTest}
                  disabled={testing || !username.trim() || !apiKey.trim()}
                  data-testid="test-connection-btn"
                >
                  {testing ? "Test en cours…" : "Tester la connexion"}
                </button>
                {testMessage && (
                  <p
                    className="m-0"
                    role="status"
                    // L'état est porté par un attribut, pas par une classe de
                    // couleur : le test l'interrogeait via `text-green-700`,
                    // ce qui liait une assertion de comportement au style.
                    data-etat={testResult === "ok" ? "succes" : "erreur"}
                    data-testid="test-result-message"
                  >
                    <span
                      className={`cr-etiquette ${
                        testResult === "ok" ? "cr-etiquette-ok" : "cr-etiquette-critique"
                      }`}
                    >
                      {testMessage}
                    </span>
                  </p>
                )}
              </div>

              <p
                className="m-0 p-3"
                style={{
                  background: "var(--cr-surface-2)",
                  border: "1px solid var(--cr-line)",
                  borderRadius: "var(--cr-radius)",
                }}
              >
                <strong>Sécurité :</strong> vos identifiants sont stockés uniquement dans votre
                navigateur et ne transitent que vers les serveurs de Nexus Mods.
              </p>
            </div>

            <div
              className="flex flex-wrap gap-3 justify-end p-5 border-t"
              style={{ borderColor: "var(--cr-line)" }}
            >
              {onCancel && (
                <button type="button" className="cr-bouton" onClick={onCancel}>
                  Annuler
                </button>
              )}
              <button type="submit" className="cr-bouton cr-bouton-principal">
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
