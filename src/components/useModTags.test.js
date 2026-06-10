import { renderHook, act } from "@testing-library/react";
import useModTags from "./useModTags";

const TAGS_KEY = "courrier_mod_tags";

beforeEach(() => {
  localStorage.clear();
});

describe("useModTags — getTag", () => {
  it("retourne null si aucun tag n'est defini", () => {
    const { result } = renderHook(() => useModTags());
    expect(result.current.getTag("skyrimse", "42")).toBeNull();
  });

  it("retourne le tag persiste au demarrage", () => {
    localStorage.setItem(TAGS_KEY, JSON.stringify({ "skyrimse:42": "installed" }));
    const { result } = renderHook(() => useModTags());
    expect(result.current.getTag("skyrimse", "42")).toBe("installed");
  });
});

describe("useModTags — setTag", () => {
  it("affecte un tag et le persiste dans localStorage", () => {
    const { result } = renderHook(() => useModTags());
    act(() => {
      result.current.setTag("skyrimse", "42", "installed");
    });
    expect(result.current.getTag("skyrimse", "42")).toBe("installed");
    const stored = JSON.parse(localStorage.getItem(TAGS_KEY));
    expect(stored["skyrimse:42"]).toBe("installed");
  });

  it("ecrase un tag existant", () => {
    const { result } = renderHook(() => useModTags());
    act(() => { result.current.setTag("skyrimse", "42", "installed"); });
    act(() => { result.current.setTag("skyrimse", "42", "paused"); });
    expect(result.current.getTag("skyrimse", "42")).toBe("paused");
  });
});

describe("useModTags — clearTag", () => {
  it("supprime le tag et met a jour localStorage", () => {
    localStorage.setItem(TAGS_KEY, JSON.stringify({ "skyrimse:42": "archived" }));
    const { result } = renderHook(() => useModTags());
    act(() => { result.current.clearTag("skyrimse", "42"); });
    expect(result.current.getTag("skyrimse", "42")).toBeNull();
    const stored = JSON.parse(localStorage.getItem(TAGS_KEY));
    expect(stored["skyrimse:42"]).toBeUndefined();
  });

  it("ne provoque pas d'erreur si le tag n'existe pas", () => {
    const { result } = renderHook(() => useModTags());
    expect(() => {
      act(() => { result.current.clearTag("skyrimse", "999"); });
    }).not.toThrow();
  });
});

describe("useModTags — toggleTag", () => {
  it("ajoute le tag si absent", () => {
    const { result } = renderHook(() => useModTags());
    act(() => { result.current.toggleTag("skyrimse", "42", "to-install"); });
    expect(result.current.getTag("skyrimse", "42")).toBe("to-install");
  });

  it("supprime le tag si deja actif (toggle off)", () => {
    const { result } = renderHook(() => useModTags());
    act(() => { result.current.setTag("skyrimse", "42", "to-install"); });
    act(() => { result.current.toggleTag("skyrimse", "42", "to-install"); });
    expect(result.current.getTag("skyrimse", "42")).toBeNull();
  });

  it("remplace le tag si un tag different est deja actif", () => {
    const { result } = renderHook(() => useModTags());
    act(() => { result.current.setTag("skyrimse", "42", "installed"); });
    act(() => { result.current.toggleTag("skyrimse", "42", "archived"); });
    expect(result.current.getTag("skyrimse", "42")).toBe("archived");
  });
});
