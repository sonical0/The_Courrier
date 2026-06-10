import { renderHook, act } from "@testing-library/react";
import useNexusCredentials from "./useNexusCredentials";

const KEY = "nexus_credentials";

beforeEach(() => {
  localStorage.clear();
});

describe("useNexusCredentials — chargement initial", () => {
  it("credentials est null et loading passe a false si localStorage est vide", async () => {
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    expect(result.current.loading).toBe(false);
    expect(result.current.credentials).toBeNull();
    expect(result.current.hasCredentials).toBeFalsy();
  });

  it("charge les credentials depuis localStorage au montage", async () => {
    localStorage.setItem(KEY, JSON.stringify({ username: "alice", apiKey: "key123" }));
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    expect(result.current.credentials).toEqual({ username: "alice", apiKey: "key123" });
    expect(result.current.hasCredentials).toBeTruthy();
    expect(result.current.loading).toBe(false);
  });

  it("ignore un objet incomplet (username absent)", async () => {
    localStorage.setItem(KEY, JSON.stringify({ apiKey: "key123" }));
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    expect(result.current.credentials).toBeNull();
    expect(result.current.hasCredentials).toBeFalsy();
  });

  it("ignore un JSON invalide dans localStorage", async () => {
    localStorage.setItem(KEY, "not-json");
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    expect(result.current.credentials).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});

describe("useNexusCredentials — saveCredentials", () => {
  it("sauvegarde les credentials dans l'etat et localStorage", async () => {
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    act(() => {
      result.current.saveCredentials("bob", "mykey");
    });
    expect(result.current.credentials).toEqual({ username: "bob", apiKey: "mykey" });
    expect(result.current.hasCredentials).toBeTruthy();
    const stored = JSON.parse(localStorage.getItem(KEY));
    expect(stored).toEqual({ username: "bob", apiKey: "mykey" });
  });

  it("retourne true en cas de succes", async () => {
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    let returned;
    act(() => {
      returned = result.current.saveCredentials("u", "k");
    });
    expect(returned).toBe(true);
  });
});

describe("useNexusCredentials — clearCredentials", () => {
  it("supprime les credentials de l'etat et du localStorage", async () => {
    localStorage.setItem(KEY, JSON.stringify({ username: "alice", apiKey: "key" }));
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    act(() => {
      result.current.clearCredentials();
    });
    expect(result.current.credentials).toBeNull();
    expect(result.current.hasCredentials).toBeFalsy();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("retourne true en cas de succes", async () => {
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    let returned;
    act(() => {
      returned = result.current.clearCredentials();
    });
    expect(returned).toBe(true);
  });
});
