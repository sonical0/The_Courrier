import { useState } from "react";
import { lireLoadOrder } from "../utils/loadOrder";

const libelleEntree = (e) => e.nom || `#${e.id}`;
const norm = (s) => String(s ?? "").trim().toLowerCase();

/**
 * Load order d'un jeu : import (JSON The Courrier, export d'Irony, TXT) ou
 * saisie à la main, réordonnable. Le fichier est lu dans le navigateur.
 */
export default function EditeurLoadOrder({ games, modsForGame, loadOrders, actions }) {
  const [jeu, setJeu] = useState(games[0]?.key || "");
  const [ajout, setAjout] = useState("");
  const [rapport, setRapport] = useState(null);

  const jeuCourant = jeu || games[0]?.key || "";
  const lo = loadOrders[jeuCourant];
  const entrees = lo?.entrees || [];
  const modsDuJeu = jeuCourant ? modsForGame(jeuCourant) : [];

  const importer = async (e) => {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (!fichier || !jeuCourant) return;
    try {
      const { nom, entrees: lues, rejetees } = lireLoadOrder(await fichier.text(), fichier.name);
      if (lues.length === 0) throw new Error("aucune entrée lisible dans le fichier");
      actions.definir(jeuCourant, lues, `import : ${fichier.name}`);
      // Les entrées qui ne correspondent à aucun mod suivi sont gardées (elles
      // comptent pour l'ordre) mais listées : c'est souvent une faute de nom.
      const nonReconnues = lues.filter(
        (x) =>
          !modsDuJeu.some(
            (m) => (x.id && String(m.id) === x.id) || (x.nom && norm(m.name) === norm(x.nom))
          )
      );
      setRapport({ ok: true, nom, n: lues.length, rejetees, nonReconnues });
    } catch (err) {
      setRapport({ ok: false, erreur: err.message });
    }
  };

  const ajouterEntree = () => {
    const s = ajout.trim();
    if (!s || !jeuCourant) return;
    actions.ajouterEntree(jeuCourant, /^\d{1,20}$/.test(s) ? { id: s } : { nom: s });
    setAjout("");
  };

  if (games.length === 0) {
    return <div className="cr-vide">Aucun jeu suivi : ajoutez d'abord des mods.</div>;
  }

  return (
    <section aria-label="Load order" className="flex flex-col gap-4">
      <h2 className="text-xl font-bold m-0">Load order</h2>
      <p className="m-0" style={{ color: "var(--cr-muted)" }}>
        Sert aux conditions « se charge avant ». Il vaut ce que vaut la liste saisie : The Courrier ne lit
        pas l'ordre réel du jeu.
      </p>

      <select
        aria-label="Jeu"
        className="pico-input"
        value={jeuCourant}
        onChange={(e) => {
          setJeu(e.target.value);
          setRapport(null);
        }}
      >
        {games.map((g) => (
          <option key={g.key} value={g.key}>
            {g.name}
          </option>
        ))}
      </select>

      <div>
        <label className="cr-bouton cursor-pointer inline-block" htmlFor="import-loadorder">
          Importer un fichier (JSON, export Irony, TXT)
        </label>
        <input
          id="import-loadorder"
          type="file"
          accept=".json,.txt,application/json,text/plain"
          className="cr-visuellement-cache"
          onChange={importer}
        />
        <p className="mt-2 mb-0 text-sm" style={{ color: "var(--cr-muted)" }}>
          Irony : décompresser l'export de la collection et choisir <span className="cr-mono">exported.json</span>.
        </p>
      </div>

      {rapport && (
        <div role={rapport.ok ? "status" : "alert"}>
          {rapport.ok ? (
            <>
              <p className="m-0">
                {rapport.n} entrée{rapport.n > 1 ? "s" : ""} importée{rapport.n > 1 ? "s" : ""}
                {rapport.nom ? ` (collection « ${rapport.nom} »)` : ""}.
              </p>
              {rapport.rejetees.length > 0 && (
                <details className="mt-2">
                  <summary>{rapport.rejetees.length} ligne(s) rejetée(s)</summary>
                  <ul className="m-0 pl-5">
                    {rapport.rejetees.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </details>
              )}
              {rapport.nonReconnues.length > 0 && (
                <details className="mt-2">
                  <summary>
                    {rapport.nonReconnues.length} entrée(s) ne correspondent à aucun mod suivi de ce jeu
                  </summary>
                  <ul className="m-0 pl-5">
                    {rapport.nonReconnues.map((x, i) => (
                      <li key={i}>{libelleEntree(x)}</li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          ) : (
            <p className="m-0" style={{ color: "var(--cr-crit)" }}>
              Import impossible : {rapport.erreur}
            </p>
          )}
        </div>
      )}

      {entrees.length === 0 ? (
        <div className="cr-vide">Aucun load order pour ce jeu.</div>
      ) : (
        <ol className="m-0 p-0 list-none flex flex-col gap-1" aria-label="Ordre de chargement">
          {entrees.map((e, i) => (
            <li key={`${i}-${libelleEntree(e)}`} className="flex items-center gap-2">
              <span className="cr-mono" style={{ color: "var(--cr-muted)", minWidth: "3ch" }}>
                {i + 1}
              </span>
              <span className="flex-1 min-w-0 overflow-wrap-anywhere">{libelleEntree(e)}</span>
              <button
                type="button"
                className="cr-bouton"
                aria-label={`Monter ${libelleEntree(e)}`}
                disabled={i === 0}
                onClick={() => actions.deplacer(jeuCourant, i, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="cr-bouton"
                aria-label={`Descendre ${libelleEntree(e)}`}
                disabled={i === entrees.length - 1}
                onClick={() => actions.deplacer(jeuCourant, i, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="cr-bouton"
                aria-label={`Retirer ${libelleEntree(e)}`}
                onClick={() => actions.retirerEntree(jeuCourant, i)}
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="flex gap-2">
        <datalist id="mods-du-jeu">
          {modsDuJeu.map((m) => (
            <option key={`${m.domain}:${m.id}`} value={m.name} />
          ))}
        </datalist>
        <input
          aria-label="Ajouter au load order"
          className="pico-input"
          list="mods-du-jeu"
          placeholder="Ajouter un mod en fin de liste"
          value={ajout}
          onChange={(e) => setAjout(e.target.value)}
        />
        <button type="button" className="cr-bouton" onClick={ajouterEntree}>
          Ajouter
        </button>
      </div>

      {entrees.length > 0 && (
        <div>
          <button
            type="button"
            className="cr-bouton"
            style={{ color: "var(--cr-crit)", borderColor: "var(--cr-crit)" }}
            onClick={() => {
              if (window.confirm("Supprimer le load order de ce jeu ?")) actions.supprimer(jeuCourant);
            }}
          >
            Supprimer ce load order
          </button>
        </div>
      )}
    </section>
  );
}
