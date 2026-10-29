import { useState } from "react";

/**
 * Champ « Ajouter un mod Workshop » : ID ou URL de la page du mod.
 *
 * `workshop` vient de useWorkshopMods (via le contexte de AppLayout). Sans lui
 * (tests de page qui ne le fournissent pas), le champ ne s'affiche pas.
 */
export default function AjoutWorkshop({ workshop }) {
  const [saisie, setSaisie] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState(null);

  if (!workshop) return null;

  const envoyer = async (e) => {
    e.preventDefault();
    if (!saisie.trim()) return;
    setEnCours(true);
    setMessage(null);
    const r = await workshop.ajouter(saisie);
    setEnCours(false);
    if (r.success) {
      setSaisie("");
      setMessage({ ok: true, texte: "Mod ajouté." });
    } else {
      setMessage({ ok: false, texte: r.error });
    }
  };

  return (
    <form onSubmit={envoyer} aria-label="Ajouter un mod Workshop">
      <label className="block font-semibold mb-2" htmlFor="ajout-workshop">
        Ajouter un mod Workshop
      </label>
      <div className="flex gap-2">
        <input
          id="ajout-workshop"
          type="text"
          inputMode="url"
          className="pico-input"
          placeholder="ID ou URL Steam"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          disabled={enCours}
        />
        <button type="submit" className="cr-bouton" disabled={enCours || !saisie.trim()}>
          {enCours ? "…" : "Ajouter"}
        </button>
      </div>
      {message && (
        <p
          className="mt-2 mb-0"
          role={message.ok ? "status" : "alert"}
          style={{ color: message.ok ? "var(--cr-muted)" : "var(--cr-crit)" }}
        >
          {message.texte}
        </p>
      )}
      {workshop.erreur && (
        <p className="mt-2 mb-0" role="alert" style={{ color: "var(--cr-crit)" }}>
          Steam n'a pas répondu : dates du Workshop non mises à jour ({workshop.erreur}).
        </p>
      )}
      {!workshop.erreur && workshop.perime && (
        <p className="mt-2 mb-0" style={{ color: "var(--cr-muted)" }}>
          Steam refuse pour l'instant : dates du Workshop servies depuis le cache.
        </p>
      )}
    </form>
  );
}
