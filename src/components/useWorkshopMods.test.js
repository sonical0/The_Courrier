import { renderHook, act, waitFor } from "@testing-library/react";
import useWorkshopMods, { WORKSHOP_STORAGE_KEY } from "./useWorkshopMods";

const MOD = {
  id: "1922397818",
  resolu: true,
  titre: "Carrying Capacity",
  creeLe: 1,
  majLe: 1678815941000,
  appId: 281990,
  auteur: "765",
  image: null,
};

// Chaque route : [fragment d'URL, {status?, body}].
function repondre(routes) {
  jest.spyOn(global, "fetch").mockImplementation(async (url) => {
    for (const [motif, r] of routes) {
      if (url.includes(motif)) {
        const status = r.status || 200;
        return {
          ok: status < 400,
          status,
          headers: { get: () => null },
          json: async () => r.body,
        };
      }
    }
    throw new Error(`route inattendue ${url}`);
  });
}

const stocke = () => JSON.parse(localStorage.getItem(WORKSHOP_STORAGE_KEY) || "[]");

beforeEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
});

describe("useWorkshopMods", () => {
  it("ajoute un mod par son URL, le stocke et l'expose au format des listes", async () => {
    repondre([
      ["/api/steam/workshop", { body: { success: true, mods: [MOD] } }],
      ["/api/steam/game/281990", { body: { success: true, name: "Stellaris" } }],
    ]);
    const { result } = renderHook(() => useWorkshopMods());
    let r;
    await act(async () => {
      r = await result.current.ajouter(
        "https://steamcommunity.com/sharedfiles/filedetails/?id=1922397818"
      );
    });
    expect(r).toEqual({ success: true });
    expect(stocke()[0]).toMatchObject({ id: "1922397818", titre: "Carrying Capacity", jeu: "Stellaris" });
    expect(result.current.mods[0]).toMatchObject({ source: "workshop", domain: "stellaris" });
  });

  it("mod introuvable → refus, rien de stocké", async () => {
    repondre([["/api/steam/workshop", { body: { success: true, mods: [{ id: "1", resolu: false }] } }]]);
    const { result } = renderHook(() => useWorkshopMods());
    let r;
    await act(async () => {
      r = await result.current.ajouter("1");
    });
    expect(r.success).toBe(false);
    expect(stocke()).toEqual([]);
  });

  it("saisie invalide → refus sans appel réseau", async () => {
    const spy = jest.spyOn(global, "fetch");
    const { result } = renderHook(() => useWorkshopMods());
    let r;
    await act(async () => {
      r = await result.current.ajouter("pas un id");
    });
    expect(r.success).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("Steam en panne au rafraîchissement → anciennes valeurs gardées, erreur signalée", async () => {
    localStorage.setItem(
      WORKSHOP_STORAGE_KEY,
      JSON.stringify([{ id: "1922397818", appId: 281990, titre: "Ancien titre", maj: 42, fetchedAt: 0 }])
    );
    repondre([["/api/steam/workshop", { status: 503, body: { success: false, error: "Steam indisponible" } }]]);
    const { result } = renderHook(() => useWorkshopMods());
    await waitFor(() => expect(result.current.erreur).toBe("Steam indisponible"));
    expect(result.current.mods[0]).toMatchObject({ name: "Ancien titre", updatedAt: 42 });
  });

  it("entrée fraîche → aucun rafraîchissement", async () => {
    localStorage.setItem(
      WORKSHOP_STORAGE_KEY,
      JSON.stringify([{ id: "1922397818", appId: 281990, titre: "T", maj: 42, fetchedAt: Date.now() }])
    );
    const spy = jest.spyOn(global, "fetch");
    renderHook(() => useWorkshopMods());
    await act(async () => {});
    expect(spy).not.toHaveBeenCalled();
  });

  it("met à jour la date ; un mod devenu introuvable est marqué, pas effacé", async () => {
    localStorage.setItem(
      WORKSHOP_STORAGE_KEY,
      JSON.stringify([
        { id: "1922397818", appId: 281990, titre: "T", maj: 1, fetchedAt: 0 },
        { id: "2", appId: 281990, titre: "Retiré", maj: 1, fetchedAt: 0 },
      ])
    );
    repondre([
      ["/api/steam/workshop", { body: { success: true, mods: [MOD, { id: "2", resolu: false }] } }],
    ]);
    const { result } = renderHook(() => useWorkshopMods());
    await waitFor(() => expect(result.current.mods[0].updatedAt).toBe(1678815941000));
    expect(stocke()[1]).toMatchObject({ id: "2", titre: "Retiré", introuvable: true });
  });

  it("retirer supprime l'entrée", () => {
    localStorage.setItem(
      WORKSHOP_STORAGE_KEY,
      JSON.stringify([{ id: "7", appId: 281990, titre: "T", fetchedAt: Date.now() }])
    );
    const { result } = renderHook(() => useWorkshopMods());
    act(() => result.current.retirer("7"));
    expect(stocke()).toEqual([]);
  });
});
