import LZString from "lz-string";
import { setCompressed, getCompressed } from "./compressedStorage";

beforeEach(() => {
  localStorage.clear();
});

describe("compressedStorage", () => {
  it("round-trip array de chaînes", () => {
    const data = ["skyrim:123", "skyrim:456", "fallout4:789"];
    setCompressed("test_key", data);
    expect(getCompressed("test_key")).toEqual(data);
  });

  it("round-trip objet imbriqué", () => {
    const data = { "skyrim:1": "installed", "fallout4:2": "to-install" };
    setCompressed("test_key", data);
    expect(getCompressed("test_key")).toEqual(data);
  });

  it("retourne null pour une clé absente", () => {
    expect(getCompressed("absent")).toBeNull();
  });

  it("migration plain JSON : getCompressed lit des données non compressées", () => {
    // Données écrites avant l'implémentation de la compression
    localStorage.setItem("legacy_key", JSON.stringify([1, 2, 3]));
    expect(getCompressed("legacy_key")).toEqual([1, 2, 3]);
  });

  it("la valeur brute stockée n'est pas du JSON valide (compression réelle)", () => {
    setCompressed("test_key", ["hello", "world"]);
    const raw = localStorage.getItem("test_key");
    expect(() => JSON.parse(raw)).toThrow();
    // Vérifier que c'est bien du LZString compressé
    expect(LZString.decompress(raw)).toBe(JSON.stringify(["hello", "world"]));
  });

  it("round-trip tableau vide", () => {
    setCompressed("test_key", []);
    expect(getCompressed("test_key")).toEqual([]);
  });
});
