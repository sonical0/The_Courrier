import { extraireIdWorkshop } from "./workshop";

/**
 * Alertes « à faire » avec condition de fin (spec, lot 2).
 *
 * Une condition ne vérifie que ce que The Courrier sait vérifier : la présence
 * d'un mod dans la liste suivie, sa date de mise à jour, et l'ordre d'un load
 * order SAISI (pas l'ordre réel du jeu). Trois résultats par condition :
 * `vraie`, `fausse`, `indeterminee`. Une donnée manquante donne toujours
 * `indeterminee`, jamais `vraie` ni `fausse`.
 */

export const TYPES_CONDITION = {
  modPresent: "Le mod est dans la liste suivie",
  modAvant: "Le mod se charge avant un autre",
  modMajDepuis: "Le mod a été mis à jour depuis une date",
};

// ---------------------------------------------------------------- références

const NEXUS_URL = /^https?:\/\/(?:www\.|next\.)?nexusmods\.com\/([a-z0-9_-]+)\/mods\/(\d+)/i;

/**
 * Ce que l'utilisateur tape pour désigner un mod : URL Nexus, URL ou ID
 * Workshop, ou nom exact. Un nombre seul est un ID Workshop : un ID Nexus
 * n'a pas de sens sans son jeu, l'URL le porte.
 */
export function lireReferenceMod(saisie) {
  const s = String(saisie ?? "").trim();
  if (!s) return null;
  const nexus = s.match(NEXUS_URL);
  if (nexus) return { source: "nexus", domain: nexus[1].toLowerCase(), id: nexus[2] };
  const ws = extraireIdWorkshop(s);
  if (ws) return { source: "workshop", id: ws };
  return { nom: s };
}

/** Référence tirée d'un mod de la liste suivie (choix dans la liste). */
export function referenceDepuisMod(m) {
  return m.source === "workshop"
    ? { source: "workshop", id: String(m.id), nom: m.name }
    : { source: "nexus", domain: m.domain, id: String(m.id), nom: m.name };
}

const norm = (s) => String(s ?? "").trim().toLowerCase();

export function trouverMod(ref, mods) {
  if (!ref || !Array.isArray(mods)) return null;
  if (ref.source === "workshop") {
    return mods.find((m) => m.source === "workshop" && String(m.id) === ref.id) || null;
  }
  if (ref.source === "nexus") {
    return (
      mods.find(
        (m) => m.source !== "workshop" && m.domain === ref.domain && String(m.id) === ref.id
      ) || null
    );
  }
  const n = norm(ref.nom);
  return mods.find((m) => norm(m.name) === n) || null;
}

export function libelleReference(ref, mods = []) {
  if (!ref) return "?";
  if (ref.nom) return ref.nom;
  const m = trouverMod(ref, mods);
  if (m?.name) return m.name;
  return ref.source === "workshop" ? `Workshop #${ref.id}` : `${ref.domain} #${ref.id}`;
}

/**
 * Position d'un mod dans un load order : par ID quand les deux en ont un
 * (ID Workshop), sinon par nom. Le nom vient de la référence ou, à défaut,
 * du mod suivi correspondant.
 */
export function positionDans(ref, entrees, mods = []) {
  const nom = norm(ref?.nom || trouverMod(ref, mods)?.name);
  return entrees.findIndex(
    (e) =>
      (ref?.source === "workshop" && e.id && e.id === ref.id) ||
      (nom && e.nom && norm(e.nom) === nom)
  );
}

// ---------------------------------------------------------------- évaluation

// Les dates Nexus arrivent en secondes ou en millisecondes (voir NexusModsPage).
const enMs = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return String(Math.trunc(n)).length > 10 ? n : n * 1000;
};

const dateLisible = (ms) =>
  new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const resultat = (etat, raison) => ({ etat, raison });

/**
 * La liste suivie est-elle complète pour cette référence ? La liste Nexus
 * peut être en cours de chargement ou en échec ; celle du Workshop vit dans
 * le navigateur et est toujours là.
 */
function listeFiable(ref, ctx) {
  if (ref?.source === "workshop") return true;
  return !ctx.nexusIncomplet;
}

function evaluerPresent(c, ctx) {
  const m = trouverMod(c.mod, ctx.mods);
  const nom = libelleReference(c.mod, ctx.mods);
  if (!m) {
    return listeFiable(c.mod, ctx)
      ? resultat("fausse", `${nom} n'est pas dans la liste suivie.`)
      : resultat("indeterminee", "La liste Nexus n'est pas chargée.");
  }
  if (!c.version) return resultat("vraie", `${nom} est suivi.`);
  if (!m.version) return resultat("indeterminee", `Version de ${nom} inconnue.`);
  return norm(m.version) === norm(c.version)
    ? resultat("vraie", `${nom} est suivi, en version ${m.version}.`)
    : resultat("fausse", `${nom} est en version ${m.version}, pas ${c.version}.`);
}

function evaluerAvant(c, ctx) {
  const lo = ctx.loadOrders?.[c.jeu];
  if (!lo?.entrees?.length) return resultat("indeterminee", "Aucun load order enregistré pour ce jeu.");
  const a = positionDans(c.mod, lo.entrees, ctx.mods);
  const b = positionDans(c.avant, lo.entrees, ctx.mods);
  const na = libelleReference(c.mod, ctx.mods);
  const nb = libelleReference(c.avant, ctx.mods);
  if (a < 0) return resultat("indeterminee", `${na} n'est pas dans le load order.`);
  if (b < 0) return resultat("indeterminee", `${nb} n'est pas dans le load order.`);
  return a < b
    ? resultat("vraie", `${na} (n° ${a + 1}) se charge avant ${nb} (n° ${b + 1}).`)
    : resultat("fausse", `${na} (n° ${a + 1}) se charge après ${nb} (n° ${b + 1}).`);
}

function evaluerMajDepuis(c, ctx) {
  const m = trouverMod(c.mod, ctx.mods);
  const nom = libelleReference(c.mod, ctx.mods);
  if (!m) return resultat("indeterminee", `${nom} n'est pas suivi : sa date est inconnue.`);
  if (m.source === "workshop" && ctx.workshopErreur) {
    return resultat("indeterminee", "Steam n'a pas répondu : date du Workshop non vérifiée.");
  }
  const maj = enMs(m.updatedAt);
  if (!maj) return resultat("indeterminee", `Date de mise à jour de ${nom} inconnue.`);
  return maj >= c.date
    ? resultat("vraie", `${nom} mis à jour le ${dateLisible(maj)}.`)
    : resultat("fausse", `Dernière mise à jour de ${nom} : ${dateLisible(maj)}.`);
}

const EVALUATEURS = { modPresent: evaluerPresent, modAvant: evaluerAvant, modMajDepuis: evaluerMajDepuis };

export function evaluerCondition(c, ctx) {
  const f = EVALUATEURS[c?.type];
  if (!f) return resultat("indeterminee", "Condition inconnue.");
  try {
    return f(c, ctx);
  } catch (e) {
    // Une erreur d'évaluation ne vaut jamais « terminée ».
    return resultat("indeterminee", `Évaluation impossible : ${e.message}`);
  }
}

/**
 * État d'une alerte. Une alerte déjà terminée le reste (spec : l'état n'est
 * pas réécrit à chaque évaluation) ; sinon :
 *  - une condition fausse → « en cours » (on sait que ce n'est pas fait) ;
 *  - sinon une condition indéterminée → « indéterminée » ;
 *  - toutes vraies → « terminée ».
 */
export function evaluerAlerte(alerte, ctx) {
  const details = (alerte.conditions || []).map((c) => ({ condition: c, ...evaluerCondition(c, ctx) }));
  if (alerte.etat === "terminee") return { etat: "terminee", details };
  if (details.length === 0) return { etat: "indeterminee", details };
  if (details.some((d) => d.etat === "fausse")) return { etat: "en-cours", details };
  if (details.some((d) => d.etat === "indeterminee")) return { etat: "indeterminee", details };
  return { etat: "terminee", details };
}

/** La condition en clair, telle qu'elle s'affiche sous l'alerte. */
export function decrireCondition(c, mods = []) {
  const nom = libelleReference(c.mod, mods);
  switch (c.type) {
    case "modPresent":
      return c.version ? `${nom} est suivi, en version ${c.version}` : `${nom} est suivi`;
    case "modAvant":
      return `${nom} se charge avant ${libelleReference(c.avant, mods)}`;
    case "modMajDepuis":
      return `${nom} a été mis à jour depuis le ${dateLisible(c.date)}`;
    default:
      return "Condition inconnue";
  }
}
