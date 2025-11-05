import { useState } from "react";

/**
 * Modal Bootstrap pour saisir les credentials Nexus Mods
 */
export default function CredentialsModal({ show, onSave, onCancel }) {
  const [username, setUsername] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Validation basique
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
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1040 }}
        onClick={onCancel}
      />

      {/* Modal */}
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 1050 }}
        onClick={(e) => e.target === e.currentTarget && onCancel?.()}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Configuration Nexus Mods</h5>
              {onCancel && (
                <button
                  type="button"
                  className="btn-close"
                  onClick={onCancel}
                  aria-label="Close"
                />
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <p className="text-muted small mb-3">
                  Pour utiliser cette application, vous devez fournir vos identifiants
                  Nexus Mods. Ces informations seront stockées localement dans votre
                  navigateur et ne seront jamais partagées.
                </p>

                {error && (
                  <div className="alert alert-danger py-2" role="alert">
                    {error}
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="nexus-username" className="form-label">
                    Nom d'utilisateur Nexus Mods
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="nexus-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="VotreNomDUtilisateur"
                    autoComplete="username"
                  />
                  <small className="form-text text-muted">
                    Votre nom d'utilisateur sur nexusmods.com
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="nexus-apikey" className="form-label">
                    Clé API Nexus Mods
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="nexus-apikey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="votre-clé-api-privée"
                    autoComplete="off"
                  />
                  <small className="form-text text-muted">
                    Vous pouvez obtenir votre clé API sur{" "}
                    <a
                      href="https://www.nexusmods.com/users/myaccount?tab=api"
                      target="_blank"
                      rel="noreferrer"
                    >
                      votre page de paramètres Nexus Mods
                    </a>
                  </small>
                </div>

                <div className="alert alert-info py-2 small" role="alert">
                  <strong>🔒 Sécurité :</strong> Vos identifiants sont stockés uniquement
                  dans votre navigateur (localStorage) et ne transitent que vers les
                  serveurs de Nexus Mods.
                </div>
              </div>

              <div className="modal-footer">
                {onCancel && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onCancel}
                  >
                    Annuler
                  </button>
                )}
                <button type="submit" className="btn btn-primary">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
