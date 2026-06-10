import { renderHook, act } from "@testing-library/react";
import useLastVisit from "./useLastVisit";

const SEEN_KEY = "courrier_seen_mods";
const VISIT_KEY = "courrier_last_visit";

beforeEach(() => {
  localStorage.clear();
});

describe("useLastVisit — isNew", () => {
  it("retourne false si lastVisit est null (premiere visite)", () => {
    const { result } = renderHook(() => useLastVisit());
    expect(result.current.isNew(9999999999)).toBe(false);
  });

  it("retourne true si modUpdatedAt > lastVisit et mod pas vu", () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    const recent = Math.floor(Date.now() / 1000) - 60;
    localStorage.setItem(VISIT_KEY, String(past));
    const { result } = renderHook(() => useLastVisit());
    expect(result.current.isNew(recent, "skyrimse", "12345")).toBe(true);
  });

  it("retourne false si modUpdatedAt < lastVisit", () => {
    const now = Math.floor(Date.now() / 1000);
    const old = now - 7200;
    localStorage.setItem(VISIT_KEY, String(now - 3600));
    const { result } = renderHook(() => useLastVisit());
    expect(result.current.isNew(old, "skyrimse", "12345")).toBe(false);
  });

  it("retourne false si le mod est dans seenMods", () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    const recent = Math.floor(Date.now() / 1000) - 60;
    localStorage.setItem(VISIT_KEY, String(past));
    localStorage.setItem(SEEN_KEY, JSON.stringify(["skyrimse:12345"]));
    const { result } = renderHook(() => useLastVisit());
    expect(result.current.isNew(recent, "skyrimse", "12345")).toBe(false);
  });

  it("retourne true pour un autre mod non vu du meme jeu", () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    const recent = Math.floor(Date.now() / 1000) - 60;
    localStorage.setItem(VISIT_KEY, String(past));
    localStorage.setItem(SEEN_KEY, JSON.stringify(["skyrimse:12345"]));
    const { result } = renderHook(() => useLastVisit());
    expect(result.current.isNew(recent, "skyrimse", "99999")).toBe(true);
  });
});

describe("useLastVisit — markAsSeen", () => {
  it("ajoute le mod a seenMods et le persiste dans localStorage", () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    const recent = Math.floor(Date.now() / 1000) - 60;
    localStorage.setItem(VISIT_KEY, String(past));
    const { result } = renderHook(() => useLastVisit());

    expect(result.current.isNew(recent, "skyrimse", "42")).toBe(true);

    act(() => {
      result.current.markAsSeen("skyrimse", "42");
    });

    expect(result.current.isNew(recent, "skyrimse", "42")).toBe(false);
    const stored = JSON.parse(localStorage.getItem(SEEN_KEY));
    expect(stored).toContain("skyrimse:42");
  });
});

describe("useLastVisit — markAllAsSeen", () => {
  it("marque tous les mods passes en argument comme vus", () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    const recent = Math.floor(Date.now() / 1000) - 60;
    localStorage.setItem(VISIT_KEY, String(past));
    const mods = [
      { domain: "skyrimse", id: "1", updatedAt: recent },
      { domain: "skyrimse", id: "2", updatedAt: recent },
    ];
    const { result } = renderHook(() => useLastVisit());

    act(() => {
      result.current.markAllAsSeen(mods);
    });

    expect(result.current.isNew(recent, "skyrimse", "1")).toBe(false);
    expect(result.current.isNew(recent, "skyrimse", "2")).toBe(false);
    const stored = JSON.parse(localStorage.getItem(SEEN_KEY));
    expect(stored).toContain("skyrimse:1");
    expect(stored).toContain("skyrimse:2");
  });
});

describe("useLastVisit — countNew", () => {
  it("retourne 0 si lastVisit est null", () => {
    const { result } = renderHook(() => useLastVisit());
    const mods = [{ domain: "skyrimse", id: "1", updatedAt: 9999999999 }];
    expect(result.current.countNew(mods)).toBe(0);
  });

  it("compte correctement les mods non vus", () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    const recent = Math.floor(Date.now() / 1000) - 60;
    localStorage.setItem(VISIT_KEY, String(past));
    localStorage.setItem(SEEN_KEY, JSON.stringify(["skyrimse:1"]));
    const mods = [
      { domain: "skyrimse", id: "1", updatedAt: recent },
      { domain: "skyrimse", id: "2", updatedAt: recent },
      { domain: "skyrimse", id: "3", updatedAt: past - 100 },
    ];
    const { result } = renderHook(() => useLastVisit());
    expect(result.current.countNew(mods)).toBe(1);
  });
});
