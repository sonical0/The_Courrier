import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "courrier_last_visit";

export default function useLastVisit() {
  const [lastVisit, setLastVisit] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const timestamp = parseInt(stored, 10);
        if (!isNaN(timestamp)) {
          setLastVisit(timestamp);
        }
      }
    } catch (e) {
      console.error("Erreur lors du chargement de la dernière visite:", e);
    }
  }, []);

  const updateLastVisit = useCallback(() => {
    const now = Math.floor(Date.now() / 1000);
    try {
      localStorage.setItem(STORAGE_KEY, String(now));
      setLastVisit(now);
    } catch (e) {
      console.error("Erreur lors de la sauvegarde de la dernière visite:", e);
    }
  }, []);

  const isNew = useCallback((modUpdatedAt) => {
    if (!lastVisit || !modUpdatedAt) return false;
    return Number(modUpdatedAt) > lastVisit;
  }, [lastVisit]);

  const countNew = useCallback((mods) => {
    if (!lastVisit || !Array.isArray(mods)) return 0;
    return mods.filter(m => Number(m.updatedAt || 0) > lastVisit).length;
  }, [lastVisit]);

  return {
    lastVisit,
    updateLastVisit,
    isNew,
    countNew,
  };
}
