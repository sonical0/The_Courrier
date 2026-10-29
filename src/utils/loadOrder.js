/**
 * Lecture d'un load order importé (spec, lot 2). Tout se passe dans le
 * navigateur : le fichier n'est jamais envoyé au serveur.
 *
 * Formats acceptés :
 *  - JSON The Courrier : `{ "mods": [{ "id": "…" } | { "nom": "…" }, …] }` ;
 *  - export d'Irony (`exported.json` du zip, ou la collection seule) :
 *    `{ Name, ModNames: [...], ModIds: [{ SteamId, ParadoxId }, ...] }`.
 *    Les `ModIds` sont souvent vides (copies locales des mods) : le nom fait
 *    alors foi ;
 *  - TXT : une ligne par mod, dans l'ordre. Une ligne de chiffres est un ID
 *    Workshop, toute autre ligne un nom ; lignes vides et `#` ignorées.
 *
 * Rien n'est ignoré en silence : ce qui ne peut pas devenir une entrée part
 * dans `rejetees`, avec sa position.
 *
 * @returns {{ nom: string|null, entrees: {id?: string, nom?: string}[], rejetees: string[] }}
 */
export function lireLoadOrder(texte, nomFichier = "") {
  const brut = String(texte ?? "").replace(/^﻿/, "");
  const commeJson = /\.json$/i.test(nomFichier) || /^\s*[[{]/.test(brut);
  if (!commeJson) return lireTxt(brut);

  let json;
  try {
    json = JSON.parse(brut);
  } catch (e) {
    throw new Error(`JSON illisible : ${e.message}`);
  }
  // Une base d'Irony est une liste d'objets ; un export, un objet seul.
  const racine = Array.isArray(json) ? json.find((c) => c?.ModNames) ?? json[0] : json;

  if (Array.isArray(racine?.ModNames)) return lireIrony(racine);
  if (Array.isArray(racine?.mods)) return lireJsonCourrier(racine);
  throw new Error("Format non reconnu : ni « mods » (The Courrier) ni « ModNames » (Irony).");
}

const texteNet = (v) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

function lireIrony(col) {
  const entrees = [];
  const rejetees = [];
  col.ModNames.forEach((nom, i) => {
    const ids = col.ModIds?.[i];
    const id = texteNet(ids?.SteamId) || texteNet(ids?.ParadoxId);
    const n = texteNet(nom);
    if (!n && !id) {
      rejetees.push(`position ${i + 1} : ni nom ni identifiant`);
      return;
    }
    entrees.push({ ...(id && { id }), ...(n && { nom: n }) });
  });
  return { nom: texteNet(col.Name) || null, entrees, rejetees };
}

function lireJsonCourrier(racine) {
  const entrees = [];
  const rejetees = [];
  racine.mods.forEach((m, i) => {
    const id = texteNet(m?.id);
    const nom = texteNet(m?.nom ?? m?.name);
    if (!id && !nom) {
      rejetees.push(`position ${i + 1} : ${JSON.stringify(m)}`);
      return;
    }
    entrees.push({ ...(id && { id }), ...(nom && { nom }) });
  });
  return { nom: texteNet(racine.nom ?? racine.name) || null, entrees, rejetees };
}

function lireTxt(brut) {
  const entrees = [];
  const rejetees = [];
  brut.split(/\r?\n/).forEach((ligne, i) => {
    const l = ligne.trim();
    if (!l || l.startsWith("#")) return;
    if (l.length > 300) {
      rejetees.push(`ligne ${i + 1} : trop longue pour un nom de mod`);
      return;
    }
    entrees.push(/^\d{1,20}$/.test(l) ? { id: l } : { nom: l });
  });
  return { nom: null, entrees, rejetees };
}
