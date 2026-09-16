import { renderHook, act, waitFor } from "@testing-library/react";
import useSteamGames from "./useSteamGames";

const STORAGE_KEY = "steamGameVersions";
const TWO_HOURS = 2 * 60 * 60 * 1000;

// skyrimspecialedition -> 489830, baldursgate3 -> 1086940 (NEXUS_TO_STEAM_MAP)
const SKYRIM = { key: "skyrimspecialedition", domain: "skyrimspecialedition", name: "Skyrim SE" };
const BG3 = { key: "baldursgate3", domain: "baldursgate3", name: "Baldur's Gate 3" };

// Identite stable obligatoire : fetchAllSteamData depend de `games`, donc un
// tableau recree a chaque render relancerait l'effet en boucle.
const GAMES_SKYRIM = [SKYRIM];
const GAMES_BOTH = [SKYRIM, BG3];
const GAMES_UNKNOWN = [{ key: "unknowngame", domain: "unknowngame", name: "Inconnu" }];

function mockSteamOk(buildId = "1000") {
  jest.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      name: "Jeu",
      buildId,
      lastUpdate: 1700000000,
      version: buildId,
    }),
  });
}

function storeEntry(domain, entry) {
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  raw[domain] = entry;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
}

beforeEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
});

describe("useSteamGames — TTL du cache local", () => {
  it("entree fraiche → aucune requete", async () => {
    storeEntry("skyrimspecialedition", {
      appId: 489830,
      name: "Skyrim SE",
      buildId: "1000",
      version: "1000",
      fetchedAt: Date.now(),
    });
    const fetchSpy = jest.spyOn(global, "fetch");

    const { result } = renderHook(() => useSteamGames(GAMES_SKYRIM));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchSpy).not.toHaveBeenCalled();
    // la donnee reste disponible malgre l'absence de requete
    expect(result.current.getSteamInfo("skyrimspecialedition")).toMatchObject({
      buildId: "1000",
    });
  });

  it("entree perimee (plus de 2h) → requete", async () => {
    storeEntry("skyrimspecialedition", {
      appId: 489830,
      buildId: "900",
      version: "900",
      fetchedAt: Date.now() - TWO_HOURS - 1000,
    });
    mockSteamOk("1000");

    const { result } = renderHook(() => useSteamGames(GAMES_SKYRIM));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith("/api/steam/game/489830");
  });

  it("entree absente → requete", async () => {
    mockSteamOk();

    const { result } = renderHook(() => useSteamGames(GAMES_SKYRIM));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("entree sans fetchedAt (ancien format) → requete, puis horodatage", async () => {
    storeEntry("skyrimspecialedition", { appId: 489830, buildId: "900" });
    mockSteamOk("1000");

    const { result } = renderHook(() => useSteamGames(GAMES_SKYRIM));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored.skyrimspecialedition.fetchedAt).toBeGreaterThan(0);
  });

  it("refresh() ignore le TTL", async () => {
    storeEntry("skyrimspecialedition", {
      appId: 489830,
      buildId: "1000",
      version: "1000",
      fetchedAt: Date.now(),
    });
    mockSteamOk("1001");

    const { result } = renderHook(() => useSteamGames(GAMES_SKYRIM));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(global.fetch).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.refresh();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("un jeu frais et un jeu nouveau → une seule requete, pour le nouveau", async () => {
    storeEntry("skyrimspecialedition", {
      appId: 489830,
      buildId: "1000",
      version: "1000",
      fetchedAt: Date.now(),
    });
    mockSteamOk();

    const { result } = renderHook(() => useSteamGames(GAMES_BOTH));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith("/api/steam/game/1086940");
  });

  it("jeu sans mapping Steam → aucune requete", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");

    renderHook(() => useSteamGames(GAMES_UNKNOWN));

    await waitFor(() => {});
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
