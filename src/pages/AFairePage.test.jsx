import { render, screen, within } from "@testing-library/react";
import AFairePage from "./AFairePage";
import { ALERTES_STORAGE_KEY } from "../components/useAlertes";

jest.mock("react-router-dom", () => ({ useOutletContext: jest.fn() }));
const { useOutletContext } = require("react-router-dom");

const WS = {
  source: "workshop",
  id: "1922397818",
  name: "Carrying Capacity",
  domain: "stellaris",
  updatedAt: 1678815941000,
};
const GAMES = [{ key: "stellaris", domain: "stellaris", name: "Stellaris" }];

function contexte(mods, extra = {}) {
  useOutletContext.mockReturnValue({
    games: GAMES,
    modsForGame: () => mods,
    loading: false,
    error: null,
    workshop: { erreur: null },
    ...extra,
  });
}

const alerte = {
  id: "a1",
  titre: "Installer Carrying Capacity",
  creeLe: 1,
  etat: "ouverte",
  conditions: [{ type: "modPresent", mod: { source: "workshop", id: WS.id } }],
};

const stockees = () => JSON.parse(localStorage.getItem(ALERTES_STORAGE_KEY));
const etatAffiche = () => within(screen.getByTestId("alerte-a1")).getByText(/^(En cours|Indéterminée|Terminée)$/);

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(ALERTES_STORAGE_KEY, JSON.stringify([alerte]));
});

describe("AFairePage — critère d'acceptation du lot 2", () => {
  it("modPresent : en cours, puis terminée d'elle-même après l'ajout du mod, et le reste après rechargement", () => {
    contexte([]);
    const { unmount } = render(<AFairePage />);
    expect(etatAffiche()).toHaveTextContent("En cours");
    expect(screen.getByText(/n'est pas dans la liste suivie/)).toBeInTheDocument();
    unmount();

    // Le mod est ajouté : l'alerte se ferme et l'état est mémorisé.
    contexte([WS]);
    const second = render(<AFairePage />);
    expect(etatAffiche()).toHaveTextContent("Terminée");
    expect(stockees()[0]).toMatchObject({ etat: "terminee" });
    expect(stockees()[0].termineeLe).toEqual(expect.any(Number));
    second.unmount();

    // « Rechargement » sans le mod (retiré, ou liste pas encore chargée) :
    // l'alerte reste terminée.
    contexte([], { loading: true });
    render(<AFairePage />);
    expect(etatAffiche()).toHaveTextContent("Terminée");
  });

  it("liste Nexus en chargement → indéterminée, pas terminée", () => {
    localStorage.setItem(
      ALERTES_STORAGE_KEY,
      JSON.stringify([{ ...alerte, conditions: [{ type: "modPresent", mod: { source: "nexus", domain: "x", id: "1" } }] }])
    );
    contexte([], { loading: true });
    render(<AFairePage />);
    expect(etatAffiche()).toHaveTextContent("Indéterminée");
    expect(stockees()[0].etat).toBe("ouverte");
  });
});
