import { lireLoadOrder } from "./loadOrder";

const ORDRE = ["Mod A", "1922397818", "Mod C"];
const attendu = [{ nom: "Mod A" }, { id: "1922397818" }, { nom: "Mod C" }];

describe("lireLoadOrder", () => {
  it("JSON The Courrier et TXT rendent le même ordre que le fichier", () => {
    const json = JSON.stringify({ mods: [{ nom: "Mod A" }, { id: "1922397818" }, { nom: "Mod C" }] });
    const txt = ORDRE.join("\n");
    expect(lireLoadOrder(json, "lo.json").entrees).toEqual(attendu);
    expect(lireLoadOrder(txt, "lo.txt").entrees).toEqual(attendu);
  });

  it("TXT : lignes vides et commentaires ignorés, fins de ligne Windows, BOM", () => {
    const txt = "﻿# ma liste\r\nMod A\r\n\r\n1922397818\r\n  Mod C  \r\n";
    expect(lireLoadOrder(txt, "lo.txt")).toEqual({ nom: null, entrees: attendu, rejetees: [] });
  });

  it("export d'Irony : ModIds vides → le nom fait foi, SteamId repris quand il existe", () => {
    const irony = {
      Game: "Stellaris",
      Name: "Big Mods 4.5",
      ModNames: ["Mod A", "Mod B", ""],
      ModIds: [
        { ParadoxId: null, SteamId: null },
        { ParadoxId: null, SteamId: "1922397818" },
        { ParadoxId: null, SteamId: null },
      ],
      Mods: ["mod/a.mod", "mod/b.mod", "mod/c.mod"],
    };
    const r = lireLoadOrder(JSON.stringify(irony), "exported.json");
    expect(r.nom).toBe("Big Mods 4.5");
    expect(r.entrees).toEqual([{ nom: "Mod A" }, { id: "1922397818", nom: "Mod B" }]);
    expect(r.rejetees).toEqual(["position 3 : ni nom ni identifiant"]);
  });

  it("liste de collections Irony : prend celle qui a des ModNames", () => {
    const r = lireLoadOrder(JSON.stringify([{ Name: "x" }, { Name: "C", ModNames: ["Z"] }]), "c.json");
    expect(r.entrees).toEqual([{ nom: "Z" }]);
  });

  it("JSON : entrée sans id ni nom → rejetée, jamais ignorée en silence", () => {
    const r = lireLoadOrder(JSON.stringify({ mods: [{ nom: "A" }, {}, { name: "B" }] }), "lo.json");
    expect(r.entrees).toEqual([{ nom: "A" }, { nom: "B" }]);
    expect(r.rejetees).toHaveLength(1);
    expect(r.rejetees[0]).toMatch(/position 2/);
  });

  it("JSON illisible ou format inconnu → erreur explicite", () => {
    expect(() => lireLoadOrder("{pas du json", "lo.json")).toThrow(/JSON illisible/);
    expect(() => lireLoadOrder(JSON.stringify({ autre: 1 }), "lo.json")).toThrow(/Format non reconnu/);
  });
});
