import { useCallback, useEffect, useMemo, useState } from "react";
import { extraireIdWorkshop, versMod } from "../utils/workshop";

// Une entree par mod : {id, appId, titre, maj, note, jeu, image, auteur, fetchedAt}.
// Tout reste dans le navigateur (spec, lot 1) : pas de compte Steam, rien cote serveur.
export const WORKSHOP_STORAGE_KEY = "courrier_workshop_mods";

// Meme fraicheur que le cache du point d'acces : en deca, aucune requete.
const WORKSHOP_TTL_MS = 10 * 60 * 1000;
// Le point d'acces accepte 50 ID par appel.
const LOT = 50;

function lire() {
  try {
    const brut = JSON.parse(localStorage.getItem(WORKSHOP_STORAGE_KEY) || "[]");
    return Array.isArray(brut) ? brut.filter((e) => e && typeof e.id === "string") : [];
  } catch {
    return [];
  }
}

function ecrire(entrees) {
  try {
    localStorage.setItem(WORKSHOP_STORAGE_KEY, JSON.stringify(entrees));
  } catch (e) {
    console.error("Sauvegarde des mods Workshop impossible :", e);
  }
}

async function interroger(ids) {
  const res = await fetch(`/api/steam/workshop?ids=${ids.join(",")}`);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success || !Array.isArray(data.mods)) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return { mods: data.mods, perime: res.headers?.get?.("X-Steam-Stale") === "1" };
}

async function nomDuJeu(appId) {
  if (!appId) return null;
  try {
    const res = await fetch(`/api/steam/game/${appId}`);
    const data = await res.json();
    return data?.success ? data.name : null;
  } catch {
    return null;
  }
}

/**
 * Mods Steam Workshop suivis, au format des listes de mods (`source: "workshop"`).
 *
 * Un echec de Steam ne remplace jamais une donnee par du vide : les entrees
 * gardent leur derniere valeur connue et `erreur` le signale.
 */
export default function useWorkshopMods() {
  const [entrees, setEntrees] = useState(lire);
  const [erreur, setErreur] = useState(null);
  const [perime, setPerime] = useState(false);

  const maj = useCallback((fn) => {
    setEntrees((prev) => {
      const next = fn(prev);
      ecrire(next);
      return next;
    });
  }, []);

  const rafraichir = useCallback(
    async (force = false) => {
      const actuelles = lire();
      const ids = actuelles
        .filter((e) => force || !e.fetchedAt || Date.now() - e.fetchedAt >= WORKSHOP_TTL_MS)
        .map((e) => e.id);
      if (ids.length === 0) return;

      const recus = new Map();
      let vieux = false;
      try {
        for (let i = 0; i < ids.length; i += LOT) {
          const { mods, perime: p } = await interroger(ids.slice(i, i + LOT));
          vieux = vieux || p;
          for (const m of mods) recus.set(m.id, m);
        }
        setErreur(null);
      } catch (e) {
        setErreur(e.message || String(e));
      }
      setPerime(vieux);
      if (recus.size === 0) return;

      const maintenant = Date.now();
      maj((prev) =>
        prev.map((e) => {
          const m = recus.get(e.id);
          // Introuvable (retire, prive) : on garde l'entree telle quelle et on le
          // marque, plutot que d'effacer ce que l'utilisateur a ajoute.
          if (!m) return e;
          if (!m.resolu) return { ...e, introuvable: true, fetchedAt: maintenant };
          return {
            ...e,
            introuvable: false,
            titre: m.titre,
            maj: m.majLe,
            appId: m.appId ?? e.appId,
            image: m.image,
            auteur: m.auteur,
            fetchedAt: maintenant,
          };
        })
      );
    },
    [maj]
  );

  useEffect(() => {
    rafraichir();
  }, [rafraichir]);

  /** @returns {Promise<{success: boolean, error?: string}>} */
  const ajouter = useCallback(
    async (saisie) => {
      const id = extraireIdWorkshop(saisie);
      if (!id) return { success: false, error: "Ni un ID ni une URL de mod Workshop." };
      if (lire().some((e) => e.id === id)) return { success: false, error: "Ce mod est déjà suivi." };
      try {
        const { mods } = await interroger([id]);
        const m = mods[0];
        if (!m?.resolu) return { success: false, error: "Mod introuvable sur le Workshop (retiré ou privé ?)." };
        const jeu = await nomDuJeu(m.appId);
        const entree = {
          id,
          appId: m.appId,
          titre: m.titre,
          maj: m.majLe,
          note: "",
          jeu,
          image: m.image,
          auteur: m.auteur,
          fetchedAt: Date.now(),
        };
        maj((prev) => (prev.some((e) => e.id === id) ? prev : [...prev, entree]));
        return { success: true };
      } catch (e) {
        return { success: false, error: `Steam ne répond pas : ${e.message || e}` };
      }
    },
    [maj]
  );

  const retirer = useCallback(
    (id) => maj((prev) => prev.filter((e) => e.id !== String(id))),
    [maj]
  );

  const mods = useMemo(() => entrees.map(versMod), [entrees]);

  return { mods, ajouter, retirer, rafraichir, erreur, perime };
}
