import { useCallback, useState } from "react";

// Un load order par jeu (clé : domaine du jeu, comme dans les listes de mods) :
// {[jeu]: {entrees: [{id?, nom?}], source, majLe}}. Saisi à la main ou importé ;
// il ne reflète pas forcément l'ordre réel du jeu.
export const LOADORDER_STORAGE_KEY = "courrier_loadorder";

function lire() {
  try {
    const brut = JSON.parse(localStorage.getItem(LOADORDER_STORAGE_KEY) || "{}");
    return brut && typeof brut === "object" && !Array.isArray(brut) ? brut : {};
  } catch {
    return {};
  }
}

function ecrire(lo) {
  try {
    localStorage.setItem(LOADORDER_STORAGE_KEY, JSON.stringify(lo));
  } catch (e) {
    console.error("Sauvegarde du load order impossible :", e);
  }
}

export default function useLoadOrders() {
  const [loadOrders, setLoadOrders] = useState(lire);

  const maj = useCallback((fn) => {
    setLoadOrders((prev) => {
      const next = fn(prev);
      ecrire(next);
      return next;
    });
  }, []);

  const definir = useCallback(
    (jeu, entrees, source = "saisie") =>
      maj((prev) => ({ ...prev, [jeu]: { entrees, source, majLe: Date.now() } })),
    [maj]
  );

  const deplacer = useCallback(
    (jeu, index, sens) =>
      maj((prev) => {
        const entrees = [...(prev[jeu]?.entrees || [])];
        const cible = index + sens;
        if (cible < 0 || cible >= entrees.length) return prev;
        [entrees[index], entrees[cible]] = [entrees[cible], entrees[index]];
        return { ...prev, [jeu]: { ...prev[jeu], entrees, source: "saisie", majLe: Date.now() } };
      }),
    [maj]
  );

  const ajouterEntree = useCallback(
    (jeu, entree) =>
      maj((prev) => {
        const entrees = [...(prev[jeu]?.entrees || []), entree];
        return { ...prev, [jeu]: { ...prev[jeu], entrees, source: prev[jeu]?.source || "saisie", majLe: Date.now() } };
      }),
    [maj]
  );

  const retirerEntree = useCallback(
    (jeu, index) =>
      maj((prev) => {
        const entrees = (prev[jeu]?.entrees || []).filter((_, i) => i !== index);
        return { ...prev, [jeu]: { ...prev[jeu], entrees, majLe: Date.now() } };
      }),
    [maj]
  );

  const supprimer = useCallback(
    (jeu) =>
      maj((prev) => {
        const { [jeu]: _, ...reste } = prev;
        return reste;
      }),
    [maj]
  );

  return { loadOrders, definir, deplacer, ajouterEntree, retirerEntree, supprimer };
}
