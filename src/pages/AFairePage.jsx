import { useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import useAlertes from "../components/useAlertes";
import useLoadOrders from "../components/useLoadOrders";
import FormulaireAlerte from "../components/FormulaireAlerte";
import EditeurLoadOrder from "../components/EditeurLoadOrder";
import { decrireCondition, evaluerAlerte } from "../utils/conditions";

/**
 * « À faire » : des alertes qui se ferment d'elles-mêmes quand leur condition
 * devient vraie (spec, lot 2). L'évaluation se fait à l'affichage, sans
 * traitement en arrière-plan.
 *
 * Gravité : le mot passe avant la teinte (comme IncompatibilityPage) — chaque
 * état est écrit en toutes lettres, la couleur ne fait que le doubler.
 */
const ETATS = {
  "en-cours": { libelle: "En cours", pluriel: "en cours", classe: "cr-etiquette-attention", ordre: 0 },
  indeterminee: { libelle: "Indéterminée", pluriel: "indéterminées", classe: "cr-etiquette-neutre", ordre: 1 },
  terminee: { libelle: "Terminée", pluriel: "terminées", classe: "cr-etiquette-ok", ordre: 2 },
};

const SIGNE = { vraie: "✓", fausse: "✗", indeterminee: "?" };

export default function AFairePage() {
  const { games = [], modsForGame, loading, error, workshop } = useOutletContext();
  const { alertes, ajouter, supprimer, marquerTerminees } = useAlertes();
  const loadOrderActions = useLoadOrders();
  const { loadOrders } = loadOrderActions;

  const mods = useMemo(
    () => games.flatMap((g) => modsForGame(g.key)),
    [games, modsForGame]
  );

  const ctx = useMemo(
    () => ({
      mods,
      loadOrders,
      nexusIncomplet: Boolean(loading || error),
      workshopErreur: workshop?.erreur || null,
    }),
    [mods, loadOrders, loading, error, workshop?.erreur]
  );

  const evaluees = useMemo(
    () =>
      alertes
        .map((a) => ({ alerte: a, ...evaluerAlerte(a, ctx) }))
        .sort((x, y) => ETATS[x.etat].ordre - ETATS[y.etat].ordre || y.alerte.creeLe - x.alerte.creeLe),
    [alertes, ctx]
  );

  // Une alerte qui vient de passer « terminée » l'est pour de bon : on le
  // mémorise, pour qu'une donnée manquante plus tard ne la rouvre pas.
  useEffect(() => {
    const ids = evaluees
      .filter((e) => e.etat === "terminee" && e.alerte.etat !== "terminee")
      .map((e) => e.alerte.id);
    marquerTerminees(ids);
  }, [evaluees, marquerTerminees]);

  const comptes = evaluees.reduce((c, e) => ({ ...c, [e.etat]: (c[e.etat] || 0) + 1 }), {});

  return (
    <div className="cr-enveloppe py-8 pb-28">
      <header className="mb-8">
        <h1 className="text-3xl font-bold m-0" style={{ letterSpacing: "-0.02em" }}>
          À faire
        </h1>
        <p className="mt-2 mb-0" style={{ color: "var(--cr-muted)" }}>
          {alertes.length === 0
            ? "Aucune alerte."
            : Object.entries(ETATS)
                .filter(([k]) => comptes[k])
                .map(([k, v]) => `${comptes[k]} ${comptes[k] > 1 ? v.pluriel : v.libelle.toLowerCase()}`)
                .join(" · ")}
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10 lg:items-start">
        <section aria-label="Alertes" className="mb-10 lg:mb-0">
          {evaluees.length === 0 ? (
            <div className="cr-vide">
              Une alerte porte une condition de fin : elle se ferme d'elle-même quand la condition
              devient vraie.
            </div>
          ) : (
            <ul className="list-none m-0 p-0">
              {evaluees.map(({ alerte, etat, details }) => (
                <li key={alerte.id} className="cr-mod" data-testid={`alerte-${alerte.id}`}>
                  <div className="min-w-0" style={{ gridColumn: "1 / -1" }}>
                    <div className="flex flex-wrap items-start gap-x-3 gap-y-2 mb-2">
                      <h3 className="text-lg font-semibold m-0 flex-1 min-w-0 overflow-wrap-anywhere">
                        {alerte.titre}
                      </h3>
                      <span className={`cr-etiquette ${ETATS[etat].classe}`}>{ETATS[etat].libelle}</span>
                    </div>

                    <ul className="m-0 p-0 list-none flex flex-col gap-1">
                      {details.map((d, i) => (
                        <li key={i}>
                          <span aria-hidden="true" className="cr-mono" style={{ color: "var(--cr-muted)" }}>
                            {SIGNE[d.etat]}{" "}
                          </span>
                          <span>{decrireCondition(d.condition, mods)}</span>
                          {etat !== "terminee" && (
                            <span className="block text-sm" style={{ color: "var(--cr-muted)" }}>
                              {d.raison}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>

                    {alerte.termineeLe && (
                      <p className="cr-meta mt-2 mb-0">
                        Terminée le{" "}
                        <time dateTime={new Date(alerte.termineeLe).toISOString()}>
                          {new Date(alerte.termineeLe).toLocaleString("fr-FR")}
                        </time>
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        type="button"
                        className="cr-bouton"
                        style={{ color: "var(--cr-crit)", borderColor: "var(--cr-crit)" }}
                        onClick={() => {
                          if (window.confirm(`Supprimer l'alerte « ${alerte.titre} » ?`)) supprimer(alerte.id);
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="flex flex-col gap-10">
          <FormulaireAlerte mods={mods} games={games} onCreer={ajouter} />
          <EditeurLoadOrder
            games={games}
            modsForGame={modsForGame}
            loadOrders={loadOrders}
            actions={loadOrderActions}
          />
        </aside>
      </div>
    </div>
  );
}
