import { extraireIdWorkshop, versMod, domainePourAppId } from "./workshop";
import {
  lireIdsWorkshop,
  normaliserDetailWorkshop,
  WORKSHOP_MAX_IDS,
} from "../../api/utils/steamWorkshop.mjs";

describe("extraireIdWorkshop", () => {
  it.each([
    ["1922397818", "1922397818"],
    ["  1922397818 ", "1922397818"],
    ["https://steamcommunity.com/sharedfiles/filedetails/?id=1922397818", "1922397818"],
    ["https://steamcommunity.com/workshop/filedetails/?id=1922397818&searchtext=", "1922397818"],
    ["https://evil.example/?id=1922397818", null],
    ["https://steamcommunity.com/sharedfiles/filedetails/?id=12a", null],
    ["abc", null],
    ["", null],
  ])("%p → %p", (saisie, attendu) => {
    expect(extraireIdWorkshop(saisie)).toBe(attendu);
  });
});

describe("lireIdsWorkshop (point d'accès)", () => {
  it("dédoublonne et garde les ID en chaîne (64 bits)", () => {
    expect(lireIdsWorkshop("3479726947,1,3479726947")).toEqual(["3479726947", "1"]);
    expect(lireIdsWorkshop("18446744073709551615")).toEqual(["18446744073709551615"]);
  });

  it.each([[undefined], [""], ["12a"], ["1,,2"], ["-1"], ["1".repeat(21)]])("refuse %p", (brut) => {
    expect(lireIdsWorkshop(brut)).toBeNull();
  });

  it(`refuse plus de ${WORKSHOP_MAX_IDS} ID`, () => {
    const ids = Array.from({ length: WORKSHOP_MAX_IDS + 1 }, (_, i) => String(i + 1));
    expect(lireIdsWorkshop(ids.join(","))).toBeNull();
  });
});

describe("normaliserDetailWorkshop", () => {
  it("garde les champs utiles, dates en millisecondes", () => {
    const m = normaliserDetailWorkshop({
      publishedfileid: "1922397818",
      result: 1,
      title: "Carrying Capacity",
      time_created: 1574893055,
      time_updated: 1678815941,
      file_size: "13876103",
      consumer_app_id: 281990,
      subscriptions: 14608,
      creator: "76561198030285479",
      preview_url: "https://images.steamusercontent.com/ugc/x/",
      description: "long texte non renvoyé",
    });
    expect(m).toEqual({
      id: "1922397818",
      resolu: true,
      titre: "Carrying Capacity",
      creeLe: 1574893055000,
      majLe: 1678815941000,
      taille: 13876103,
      appId: 281990,
      abonnes: 14608,
      auteur: "76561198030285479",
      image: "https://images.steamusercontent.com/ugc/x/",
    });
  });

  it("introuvable (result 9) → resolu false, pas une fiche vide", () => {
    expect(normaliserDetailWorkshop({ publishedfileid: "1", result: 9 })).toEqual({
      id: "1",
      resolu: false,
      erreur: "introuvable",
    });
  });

  it("image non https ignorée", () => {
    const m = normaliserDetailWorkshop({ publishedfileid: "2", result: 1, preview_url: "http://x" });
    expect(m.image).toBeNull();
  });
});

describe("versMod", () => {
  it("range Stellaris sous le domaine Nexus, source workshop", () => {
    const m = versMod({ id: "1922397818", appId: 281990, titre: "CC", maj: 5, jeu: "Stellaris" });
    expect(m).toMatchObject({
      source: "workshop",
      id: "1922397818",
      domain: "stellaris",
      name: "CC",
      updatedAt: 5,
      gameName: "Stellaris",
      url: "https://steamcommunity.com/sharedfiles/filedetails/?id=1922397818",
    });
  });

  it("jeu absent de la table → domaine steam-<appId>", () => {
    expect(domainePourAppId(123)).toBe("steam-123");
  });
});
