import { renderHook, act, waitFor } from "@testing-library/react";
import useNexusMods from "./useNexusMods";
import { getCompressed, setCompressed } from "../utils/compressedStorage";

jest.mock("../utils/compressedStorage", () => ({
  getCompressed: jest.fn(),
  setCompressed: jest.fn(),
}));

const CREDENTIALS = { username: "alice", apiKey: "key123" };

const RAW_MODS = [
  {
    mod_id: 1,
    domain_name: "skyrimse",
    name: "Mod Alpha",
    version: "1.0",
    author: "AuthA",
    game_id: 1704,
    game_name: "Skyrim Special Edition",
    category: "Gameplay",
    updated_timestamp: 1000000,
    url: "https://www.nexusmods.com/skyrimse/mods/1",
  },
  {
    mod_id: 2,
    domain_name: "skyrimse",
    name: "Mod Beta",
    version: "2.0",
    author: "AuthB",
    game_id: 1704,
    game_name: "Skyrim Special Edition",
    category: "Armures",
    updated_timestamp: 900000,
    url: "https://www.nexusmods.com/skyrimse/mods/2",
  },
];

const CACHED_MODS = [
  { id: 1, domain: "skyrimse", name: "Mod Alpha", updatedAt: 1000000, gameId: 1704, gameName: "Skyrim Special Edition" },
  { id: 2, domain: "skyrimse", name: "Mod Beta", updatedAt: 900000, gameId: 1704, gameName: "Skyrim Special Edition" },
];

function mockFetchSuccess(data = RAW_MODS) {
  jest.spyOn(global, "fetch").mockResolvedValueOnce({
    ok: true,
    json: async () => data,
    text: async () => "",
  });
}

function mockFetchError(status = 401, body = "Unauthorized") {
  jest.spyOn(global, "fetch").mockResolvedValueOnce({
    ok: false,
    status,
    text: async () => body,
    json: async () => ({ error: body }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  // Pas de cache par défaut : getCompressed retourne undefined → cache miss
});

describe("useNexusMods — chargement initial", () => {
  it("demarre en etat de chargement puis retourne les mods normalises", async () => {
    mockFetchSuccess();
    const { result } = renderHook(() => useNexusMods(CREDENTIALS));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.games).toHaveLength(1);
    expect(result.current.games[0].name).toBe("Skyrim Special Edition");
  });

  it("envoie les headers credentials dans la requete", async () => {
    mockFetchSuccess();
    renderHook(() => useNexusMods(CREDENTIALS));
    await waitFor(() => {});
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/nexus/tracked",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Nexus-Username": "alice",
          "X-Nexus-ApiKey": "key123",
        }),
      })
    );
  });

  it("n'envoie pas de headers credentials si null", async () => {
    mockFetchSuccess();
    renderHook(() => useNexusMods(null));
    await waitFor(() => {});
    const callHeaders = global.fetch.mock.calls[0][1].headers;
    expect(callHeaders["X-Nexus-Username"]).toBeUndefined();
    expect(callHeaders["X-Nexus-ApiKey"]).toBeUndefined();
  });

  it("set error si la reponse n'est pas ok", async () => {
    mockFetchError(401, "Unauthorized");
    const { result } = renderHook(() => useNexusMods(CREDENTIALS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatch(/401/);
    expect(result.current.games).toHaveLength(0);
  });

  it("set error en cas d'erreur reseau", async () => {
    jest.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network failure"));
    const { result } = renderHook(() => useNexusMods(CREDENTIALS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Network failure");
  });
});

describe("useNexusMods — normalisation des mods", () => {
  it("normalise mod_id -> id et domain_name -> domain", async () => {
    mockFetchSuccess();
    const { result } = renderHook(() => useNexusMods(CREDENTIALS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const mods = result.current.modsForGame("skyrimse");
    expect(mods[0].id).toBe(1);
    expect(mods[0].domain).toBe("skyrimse");
    expect(mods[0].name).toBe("Mod Alpha");
  });

  it("modsForGame retourne uniquement les mods du domaine demande", async () => {
    mockFetchSuccess();
    const { result } = renderHook(() => useNexusMods(CREDENTIALS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.modsForGame("skyrimse")).toHaveLength(2);
    expect(result.current.modsForGame("cyberpunk2077")).toHaveLength(0);
  });

  it("modsForGame retourne les mods tries par updatedAt decroissant", async () => {
    mockFetchSuccess();
    const { result } = renderHook(() => useNexusMods(CREDENTIALS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const mods = result.current.modsForGame("skyrimse");
    expect(Number(mods[0].updatedAt)).toBeGreaterThanOrEqual(Number(mods[1].updatedAt));
  });
});

describe("useNexusMods — refresh et untrackMod", () => {
  it("refresh() effectue un nouvel appel fetch", async () => {
    mockFetchSuccess();
    const { result } = renderHook(() => useNexusMods(CREDENTIALS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    mockFetchSuccess([]);
    await act(async () => { await result.current.refresh(); });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.current.games).toHaveLength(0);
  });

  it("untrackMod() appelle DELETE puis refresh", async () => {
    mockFetchSuccess();
    const { result } = renderHook(() => useNexusMods(CREDENTIALS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    jest.spyOn(global, "fetch")
      .mockResolvedValueOnce({ ok: true, text: async () => "" })
      .mockResolvedValueOnce({ ok: true, json: async () => [], text: async () => "" });
    await act(async () => {
      const res = await result.current.untrackMod("skyrimse", 1);
      expect(res.success).toBe(true);
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/nexus/tracked/skyrimse/1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("untrackMod() retourne success:false en cas d'erreur", async () => {
    mockFetchSuccess();
    const { result } = renderHook(() => useNexusMods(CREDENTIALS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    jest.spyOn(global, "fetch").mockRejectedValueOnce(new Error("network down"));
    await act(async () => {
      const res = await result.current.untrackMod("skyrimse", 1);
      expect(res.success).toBe(false);
      expect(res.error).toBe("network down");
    });
  });
});

describe("useNexusMods — cache", () => {
  beforeEach(() => {
    getCompressed.mockReset();
    setCompressed.mockReset();
  });

  it("cache hit valide → fetch non appelé", async () => {
    getCompressed.mockReturnValue({ data: CACHED_MODS, fetchedAt: Date.now() });
    const fetchSpy = jest.spyOn(global, "fetch");
    const { result } = renderHook(() => useNexusMods(CREDENTIALS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.games).toHaveLength(1);
    expect(result.current.games[0].name).toBe("Skyrim Special Edition");
  });

  it("cache expiré (11 min) → fetch appelé", async () => {
    getCompressed.mockReturnValue({ data: CACHED_MODS, fetchedAt: Date.now() - 11 * 60 * 1000 });
    mockFetchSuccess();
    const { result } = renderHook(() => useNexusMods(CREDENTIALS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("cache absent → fetch appelé", async () => {
    getCompressed.mockReturnValue(null);
    mockFetchSuccess();
    const { result } = renderHook(() => useNexusMods(CREDENTIALS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("refresh() bypasse le cache → fetch appelé malgré cache valide", async () => {
    getCompressed.mockReturnValue({ data: CACHED_MODS, fetchedAt: Date.now() });
    const { result } = renderHook(() => useNexusMods(CREDENTIALS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    // Chargement initial depuis cache, pas de fetch
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true, json: async () => [], text: async () => "",
    });
    await act(async () => { await result.current.refresh(); });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("untrackMod() invalide le cache et force un re-fetch", async () => {
    getCompressed.mockReturnValue({ data: CACHED_MODS, fetchedAt: Date.now() });
    const { result } = renderHook(() => useNexusMods(CREDENTIALS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const removeItemSpy = jest.spyOn(Storage.prototype, "removeItem");
    jest.spyOn(global, "fetch")
      .mockResolvedValueOnce({ ok: true, text: async () => "" })
      .mockResolvedValueOnce({ ok: true, json: async () => [], text: async () => "" });
    await act(async () => { await result.current.untrackMod("skyrimse", 1); });
    expect(removeItemSpy).toHaveBeenCalledWith("courrier_mods_cache_alice");
    expect(global.fetch).toHaveBeenCalledTimes(2); // DELETE + re-fetch forcé
    removeItemSpy.mockRestore();
  });

  it("clé de cache différente par utilisateur → pas de collision", async () => {
    getCompressed.mockReturnValue(null);
    mockFetchSuccess();
    const { result: r1 } = renderHook(() => useNexusMods({ username: "alice", apiKey: "k1" }));
    await waitFor(() => expect(r1.current.loading).toBe(false));

    mockFetchSuccess();
    const { result: r2 } = renderHook(() => useNexusMods({ username: "bob", apiKey: "k2" }));
    await waitFor(() => expect(r2.current.loading).toBe(false));

    const queriedKeys = getCompressed.mock.calls.map((c) => c[0]);
    expect(queriedKeys).toContain("courrier_mods_cache_alice");
    expect(queriedKeys).toContain("courrier_mods_cache_bob");
    expect(new Set(queriedKeys).size).toBeGreaterThan(1);
  });
});
