import { useState } from "react";
import {
  TYPES_CONDITION,
  decrireCondition,
  lireReferenceMod,
  referenceDepuisMod,
} from "../utils/conditions";

/**
 * Saisie d'une alerte : un titre et une ou plusieurs conditions de fin.
 *
 * Un mod se désigne en le choisissant dans la liste suivie (suggestions), ou
 * par une URL Nexus, une URL ou un ID Workshop, ou son nom exact — utile pour
 * un mod qu'on ne suit pas encore (« installer X » se ferme quand X est suivi).
 */
export default function FormulaireAlerte({ mods, games, onCreer }) {
  const [titre, setTitre] = useState("");
  const [type, setType] = useState("modPresent");
  const [mod, setMod] = useState("");
  const [version, setVersion] = useState("");
  const [avant, setAvant] = useState("");
  const [jeu, setJeu] = useState("");
  const [date, setDate] = useState("");
  const [conditions, setConditions] = useState([]);
  const [message, setMessage] = useState(null);

  // Le nom exact d'un mod suivi donne sa référence complète (source et ID) ;
  // le reste passe par la lecture des URL et ID.
  const reference = (saisie) => {
    const s = saisie.trim();
    const suivi = mods.find((m) => m.name === s);
    return suivi ? referenceDepuisMod(suivi) : lireReferenceMod(s);
  };

  const ajouterCondition = () => {
    const ref = reference(mod);
    if (!ref) return setMessage("Indiquez un mod.");
    let c;
    if (type === "modPresent") {
      c = { type, mod: ref, ...(version.trim() && { version: version.trim() }) };
    } else if (type === "modAvant") {
      const refAvant = reference(avant);
      const jeuChoisi = jeu || games[0]?.key;
      if (!refAvant) return setMessage("Indiquez le mod qui doit se charger après.");
      if (!jeuChoisi) return setMessage("Aucun jeu suivi : impossible de choisir un load order.");
      c = { type, mod: ref, avant: refAvant, jeu: jeuChoisi };
    } else {
      if (!date) return setMessage("Indiquez une date.");
      c = { type, mod: ref, date: new Date(`${date}T00:00:00`).getTime() };
    }
    setConditions((prev) => [...prev, c]);
    setMod("");
    setVersion("");
    setAvant("");
    setMessage(null);
  };

  const creer = (e) => {
    e.preventDefault();
    if (!titre.trim()) return setMessage("Donnez un titre à l'alerte.");
    if (conditions.length === 0) return setMessage("Ajoutez au moins une condition de fin.");
    onCreer({ titre, conditions });
    setTitre("");
    setConditions([]);
    setMessage("Alerte créée.");
  };

  return (
    <form onSubmit={creer} aria-label="Nouvelle alerte" className="flex flex-col gap-4">
      <h2 className="text-xl font-bold m-0">Nouvelle alerte</h2>

      <datalist id="mods-suivis">
        {mods.map((m) => (
          <option key={`${m.domain}:${m.id}`} value={m.name} />
        ))}
      </datalist>

      <div>
        <label className="block font-semibold mb-2" htmlFor="alerte-titre">
          Ce qu'il y a à faire
        </label>
        <input
          id="alerte-titre"
          className="pico-input"
          placeholder="Installer le correctif de compatibilité…"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
        />
      </div>

      <fieldset className="m-0 p-0 border-0 flex flex-col gap-3">
        <legend className="font-semibold mb-2">Condition de fin</legend>

        <select
          aria-label="Type de condition"
          className="pico-input"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {Object.entries(TYPES_CONDITION).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>

        <input
          aria-label="Mod"
          className="pico-input"
          list="mods-suivis"
          placeholder="Mod suivi, URL Nexus, URL ou ID Workshop, ou nom exact"
          value={mod}
          onChange={(e) => setMod(e.target.value)}
        />

        {type === "modPresent" && (
          <input
            aria-label="Version attendue (facultatif)"
            className="pico-input"
            placeholder="Version attendue (facultatif)"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        )}

        {type === "modAvant" && (
          <>
            <input
              aria-label="Doit se charger avant"
              className="pico-input"
              list="mods-suivis"
              placeholder="… doit se charger avant ce mod"
              value={avant}
              onChange={(e) => setAvant(e.target.value)}
            />
            <select
              aria-label="Jeu du load order"
              className="pico-input"
              value={jeu}
              onChange={(e) => setJeu(e.target.value)}
            >
              {games.map((g) => (
                <option key={g.key} value={g.key}>
                  Load order : {g.name}
                </option>
              ))}
            </select>
          </>
        )}

        {type === "modMajDepuis" && (
          <input
            aria-label="Date"
            type="date"
            className="pico-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        )}

        <div>
          <button type="button" className="cr-bouton" onClick={ajouterCondition}>
            Ajouter cette condition
          </button>
        </div>
      </fieldset>

      {conditions.length > 0 && (
        <ul className="m-0 pl-5">
          {conditions.map((c, i) => (
            <li key={i} className="mb-1">
              {decrireCondition(c, mods)}{" "}
              <button
                type="button"
                className="cr-bouton"
                aria-label="Retirer cette condition"
                onClick={() => setConditions((prev) => prev.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="cr-bouton cr-bouton-principal">
          Créer l'alerte
        </button>
        {message && (
          <span role="status" style={{ color: "var(--cr-muted)" }}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
