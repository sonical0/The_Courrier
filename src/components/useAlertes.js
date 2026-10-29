import { useCallback, useState } from "react";

// Alertes « à faire » : {id, titre, creeLe, conditions: [...], etat, termineeLe?}.
// Tout reste dans le navigateur (spec, lot 2).
export const ALERTES_STORAGE_KEY = "courrier_alertes";

function lire() {
  try {
    const brut = JSON.parse(localStorage.getItem(ALERTES_STORAGE_KEY) || "[]");
    return Array.isArray(brut) ? brut.filter((a) => a && a.id && Array.isArray(a.conditions)) : [];
  } catch {
    return [];
  }
}

function ecrire(alertes) {
  try {
    localStorage.setItem(ALERTES_STORAGE_KEY, JSON.stringify(alertes));
  } catch (e) {
    console.error("Sauvegarde des alertes impossible :", e);
  }
}

const nouvelId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function useAlertes() {
  const [alertes, setAlertes] = useState(lire);

  const maj = useCallback((fn) => {
    setAlertes((prev) => {
      const next = fn(prev);
      ecrire(next);
      return next;
    });
  }, []);

  const ajouter = useCallback(
    ({ titre, conditions }) => {
      const t = String(titre ?? "").trim();
      if (!t || !Array.isArray(conditions) || conditions.length === 0) return false;
      maj((prev) => [
        ...prev,
        { id: nouvelId(), titre: t, creeLe: Date.now(), conditions, etat: "ouverte" },
      ]);
      return true;
    },
    [maj]
  );

  const supprimer = useCallback((id) => maj((prev) => prev.filter((a) => a.id !== id)), [maj]);

  // L'état « terminée » est mémorisé une fois atteint : il ne bascule pas au
  // gré d'une donnée qui manque plus tard (mod retiré, Steam en panne).
  const marquerTerminees = useCallback(
    (ids) => {
      if (!ids.length) return;
      const quand = Date.now();
      maj((prev) =>
        prev.map((a) => (ids.includes(a.id) && a.etat !== "terminee" ? { ...a, etat: "terminee", termineeLe: quand } : a))
      );
    },
    [maj]
  );

  return { alertes, ajouter, supprimer, marquerTerminees };
}
