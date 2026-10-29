import {
  lireReferenceMod,
  evaluerCondition,
  evaluerAlerte,
  decrireCondition,
  positionDans,
} from "./conditions";

const WS = { source: "workshop", id: "1922397818", name: "Carrying Capacity", domain: "stellaris", updatedAt: 1678815941000 };
const NX = { id: "42", domain: "skyrimspecialedition", name: "SkyUI", version: "5.2", updatedAt: 1700000000 };

const ctx = (extra = {}) => ({ mods: [WS, NX], loadOrders: {}, nexusIncomplet: false, workshopErreur: null, ...extra });

describe("lireReferenceMod", () => {
  it.each([
    ["https://www.nexusmods.com/skyrimspecialedition/mods/42?tab=files", { source: "nexus", domain: "skyrimspecialedition", id: "42" }],
    ["https://steamcommunity.com/sharedfiles/filedetails/?id=1922397818", { source: "workshop", id: "1922397818" }],
    ["1922397818", { source: "workshop", id: "1922397818" }],
    ["  SkyUI ", { nom: "SkyUI" }],
    ["", null],
  ])("%p", (saisie, attendu) => {
    expect(lireReferenceMod(saisie)).toEqual(attendu);
  });
});

describe("modPresent", () => {
  it("suivi → vraie ; absent → fausse", () => {
    expect(evaluerCondition({ type: "modPresent", mod: { source: "workshop", id: WS.id } }, ctx()).etat).toBe("vraie");
    expect(evaluerCondition({ type: "modPresent", mod: { nom: "Inconnu" } }, ctx()).etat).toBe("fausse");
  });

  it("nom : insensible à la casse", () => {
    expect(evaluerCondition({ type: "modPresent", mod: { nom: "skyui" } }, ctx()).etat).toBe("vraie");
  });

  it("liste Nexus pas chargée → indéterminée, jamais fausse ni vraie", () => {
    const c = { type: "modPresent", mod: { source: "nexus", domain: "x", id: "1" } };
    expect(evaluerCondition(c, ctx({ nexusIncomplet: true })).etat).toBe("indeterminee");
  });

  it("le Workshop vit dans le navigateur : absent reste fausse même si Nexus charge", () => {
    const c = { type: "modPresent", mod: { source: "workshop", id: "999" } };
    expect(evaluerCondition(c, ctx({ nexusIncomplet: true })).etat).toBe("fausse");
  });

  it("version demandée : égale → vraie, autre → fausse, inconnue → indéterminée", () => {
    const ref = { source: "nexus", domain: NX.domain, id: "42" };
    expect(evaluerCondition({ type: "modPresent", mod: ref, version: "5.2" }, ctx()).etat).toBe("vraie");
    expect(evaluerCondition({ type: "modPresent", mod: ref, version: "5.3" }, ctx()).etat).toBe("fausse");
    expect(
      evaluerCondition({ type: "modPresent", mod: { source: "workshop", id: WS.id }, version: "1" }, ctx()).etat
    ).toBe("indeterminee");
  });
});

describe("modAvant", () => {
  const lo = { stellaris: { entrees: [{ nom: "Mod A" }, { id: "1922397818" }, { nom: "Mod C" }] } };
  const c = (mod, avant) => ({ type: "modAvant", mod: { nom: mod }, avant: { nom: avant }, jeu: "stellaris" });

  it("ordre respecté → vraie, inversé → fausse", () => {
    expect(evaluerCondition(c("Mod A", "Mod C"), ctx({ loadOrders: lo })).etat).toBe("vraie");
    expect(evaluerCondition(c("Mod C", "Mod A"), ctx({ loadOrders: lo })).etat).toBe("fausse");
  });

  it("pas de load order, ou mod absent → indéterminée", () => {
    expect(evaluerCondition(c("Mod A", "Mod C"), ctx()).etat).toBe("indeterminee");
    expect(evaluerCondition(c("Mod A", "Mod Z"), ctx({ loadOrders: lo })).etat).toBe("indeterminee");
  });

  it("un mod Workshop se retrouve par son ID, ou par le nom du mod suivi", () => {
    expect(positionDans({ source: "workshop", id: "1922397818" }, lo.stellaris.entrees, [WS])).toBe(1);
    const parNom = { stellaris: { entrees: [{ nom: "Carrying Capacity" }] } };
    expect(positionDans({ source: "workshop", id: WS.id }, parNom.stellaris.entrees, [WS])).toBe(0);
  });
});

describe("modMajDepuis", () => {
  it("dates Nexus en secondes et Workshop en millisecondes comparées pareil", () => {
    const avant = new Date("2023-01-01").getTime();
    const apres = new Date("2024-01-01").getTime();
    expect(evaluerCondition({ type: "modMajDepuis", mod: { nom: "SkyUI" }, date: avant }, ctx()).etat).toBe("vraie");
    expect(evaluerCondition({ type: "modMajDepuis", mod: { nom: "SkyUI" }, date: apres }, ctx()).etat).toBe("fausse");
    expect(
      evaluerCondition({ type: "modMajDepuis", mod: { source: "workshop", id: WS.id }, date: avant }, ctx()).etat
    ).toBe("vraie");
  });

  it("Steam en échec → indéterminée pour un mod Workshop", () => {
    const c = { type: "modMajDepuis", mod: { source: "workshop", id: WS.id }, date: 0 };
    expect(evaluerCondition(c, ctx({ workshopErreur: "503" })).etat).toBe("indeterminee");
  });
});

describe("evaluerAlerte", () => {
  const vraie = { type: "modPresent", mod: { nom: "SkyUI" } };
  const fausse = { type: "modPresent", mod: { nom: "Absent" } };
  const indet = { type: "modAvant", mod: { nom: "a" }, avant: { nom: "b" }, jeu: "x" };

  it("une fausse → en cours ; sinon une indéterminée → indéterminée ; toutes vraies → terminée", () => {
    expect(evaluerAlerte({ conditions: [vraie, fausse, indet] }, ctx()).etat).toBe("en-cours");
    expect(evaluerAlerte({ conditions: [vraie, indet] }, ctx()).etat).toBe("indeterminee");
    expect(evaluerAlerte({ conditions: [vraie] }, ctx()).etat).toBe("terminee");
  });

  it("type inconnu ou aucune condition → jamais terminée", () => {
    expect(evaluerAlerte({ conditions: [{ type: "bidon" }] }, ctx()).etat).toBe("indeterminee");
    expect(evaluerAlerte({ conditions: [] }, ctx()).etat).toBe("indeterminee");
  });

  it("une alerte terminée le reste, même si la condition redevient fausse", () => {
    expect(evaluerAlerte({ etat: "terminee", conditions: [fausse] }, ctx()).etat).toBe("terminee");
  });
});

describe("decrireCondition", () => {
  it("écrit la condition en clair, avec le nom du mod suivi", () => {
    expect(decrireCondition({ type: "modPresent", mod: { source: "workshop", id: WS.id } }, [WS])).toBe(
      "Carrying Capacity est suivi"
    );
    expect(
      decrireCondition({ type: "modAvant", mod: { nom: "A" }, avant: { nom: "B" }, jeu: "x" })
    ).toBe("A se charge avant B");
  });
});
