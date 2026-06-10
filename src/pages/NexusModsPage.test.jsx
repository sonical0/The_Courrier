import { render, screen, fireEvent } from "@testing-library/react";
import NexusModsPage from "./NexusModsPage";

jest.mock("../components/useNexusMods");
jest.mock("../components/useLastVisit");
jest.mock("../components/EnhancedChangelog", () => () => null);
jest.mock("../components/SteamGameInfo", () => () => null);

const useNexusMods = require("../components/useNexusMods").default;
const useLastVisit = require("../components/useLastVisit").default;

const mockMods = [
  { id: "1", domain: "skyrimse", name: "Mod Gameplay A", author: "Auth1", category: "Gameplay", updatedAt: 1000000, version: "1.0" },
  { id: "2", domain: "skyrimse", name: "Mod Armures B", author: "Auth2", category: "Armures", updatedAt: 900000, version: "2.0" },
  { id: "3", domain: "skyrimse", name: "Mod Gameplay C", author: "Auth3", category: "Gameplay", updatedAt: 800000, version: "1.1" },
  { id: "4", domain: "skyrimse", name: "Mod Sans Cat", author: "Auth4", category: null, updatedAt: 700000, version: "0.1" },
];

const mockGames = [
  { key: "skyrimse", domain: "skyrimse", gameId: 1704, name: "Skyrim Special Edition" },
];

function setupMocks(modsOverride) {
  const mods = modsOverride || mockMods;
  useNexusMods.mockReturnValue({
    loading: false,
    error: null,
    games: mockGames,
    modsForGame: () => mods,
    refresh: jest.fn(),
    untrackMod: jest.fn(),
  });
  useLastVisit.mockReturnValue({
    isNew: () => false,
    updateLastVisit: jest.fn(),
    markAsSeen: jest.fn(),
    markAllAsSeen: jest.fn(),
    countNew: () => 0,
  });
}

function renderPage() {
  return render(
    <NexusModsPage credentials={{ username: "u", apiKey: "k" }} getSteamInfo={() => null} />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  window.confirm = jest.fn(() => true);
});

describe("NexusModsPage — filtre par categorie", () => {
  it("affiche tous les mods avant tout filtrage", () => {
    setupMocks();
    renderPage();
    expect(screen.getByText("Mod Gameplay A")).toBeInTheDocument();
    expect(screen.getByText("Mod Armures B")).toBeInTheDocument();
    expect(screen.getByText("Mod Gameplay C")).toBeInTheDocument();
  });

  it("affiche le menu deroulant de categories quand des mods ont des categories", () => {
    setupMocks();
    renderPage();
    const select = screen.getByDisplayValue("Toutes les catégories");
    expect(select).toBeInTheDocument();
    expect(select).toHaveDisplayValue("Toutes les catégories");
  });

  it("filtrer par 'Gameplay' n'affiche que les mods Gameplay", () => {
    setupMocks();
    renderPage();
    const select = screen.getByDisplayValue("Toutes les catégories");
    fireEvent.change(select, { target: { value: "Gameplay" } });
    expect(screen.getByText("Mod Gameplay A")).toBeInTheDocument();
    expect(screen.getByText("Mod Gameplay C")).toBeInTheDocument();
    expect(screen.queryByText("Mod Armures B")).not.toBeInTheDocument();
  });

  it("filtrer par 'Armures' n'affiche que les mods Armures", () => {
    setupMocks();
    renderPage();
    const select = screen.getByDisplayValue("Toutes les catégories");
    fireEvent.change(select, { target: { value: "Armures" } });
    expect(screen.getByText("Mod Armures B")).toBeInTheDocument();
    expect(screen.queryByText("Mod Gameplay A")).not.toBeInTheDocument();
    expect(screen.queryByText("Mod Gameplay C")).not.toBeInTheDocument();
  });

  it("repasser a 'ALL' reaffiche tous les mods", () => {
    setupMocks();
    renderPage();
    const select = screen.getByDisplayValue("Toutes les catégories");
    fireEvent.change(select, { target: { value: "Armures" } });
    fireEvent.change(select, { target: { value: "ALL" } });
    expect(screen.getByText("Mod Gameplay A")).toBeInTheDocument();
    expect(screen.getByText("Mod Armures B")).toBeInTheDocument();
  });

  it("n'affiche pas le menu categories si aucun mod n'a de categorie", () => {
    setupMocks([
      { id: "1", domain: "skyrimse", name: "Mod sans cat", author: "A", category: null, updatedAt: 1000, version: "1.0" },
    ]);
    renderPage();
    expect(screen.queryByDisplayValue("Toutes les catégories")).not.toBeInTheDocument();
  });

  it("filtre categorie et recherche textuelle sont cumulatifs", () => {
    setupMocks();
    renderPage();
    const select = screen.getByDisplayValue("Toutes les catégories");
    fireEvent.change(select, { target: { value: "Gameplay" } });
    const search = screen.getByPlaceholderText(/Rechercher/i);
    fireEvent.change(search, { target: { value: "C" } });
    expect(screen.queryByText("Mod Gameplay A")).not.toBeInTheDocument();
    expect(screen.getByText("Mod Gameplay C")).toBeInTheDocument();
  });
});
