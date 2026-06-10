import { useState, useEffect, useCallback } from "react";
import { getCompressed, setCompressed } from "../utils/compressedStorage";

const STORAGE_KEY = "courrier_last_visit";
const SEEN_KEY = "courrier_seen_mods";

function loadSeenMods() {
  const data = getCompressed(SEEN_KEY);
  return Array.isArray(data) ? new Set(data) : new Set();
}

function persistSeenMods(set) {
  setCompressed(SEEN_KEY, [...set]);
}

export default function useLastVisit() {
  const [lastVisit, setLastVisit] = useState(null);
  const [seenMods, setSeenMods] = useState(() => loadSeenMods());

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
      console.error("Erreur lors du chargement de la derniere visite:", e);
    }
  }, []);

  const updateLastVisit = useCallback(() => {
    const now = Math.floor(Date.now() / 1000);
    try {
      localStorage.setItem(STORAGE_KEY, String(now));
      setLastVisit(now);
    } catch (e) {
      console.error("Erreur lors de la sauvegarde de la derniere visite:", e);
    }
  }, []);

  const markAsSeen = useCallback((domain, modId) => {
    setSeenMods((prev) => {
      const next = new Set(prev);
      next.add(`${domain}:${modId}`);
      persistSeenMods(next);
      return next;
    });
  }, []);

  const markAllAsSeen = useCallback((mods) => {
    setSeenMods((prev) => {
      const next = new Set(prev);
      for (const m of mods) {
        if (m.domain && m.id) next.add(`${m.domain}:${m.id}`);
      }
      persistSeenMods(next);
      return next;
    });
  }, []);

  const isNew = useCallback((modUpdatedAt, domain, modId) => {
    if (!lastVisit || !modUpdatedAt) return false;
    if (domain && modId && seenMods.has(`${domain}:${modId}`)) return false;
    return Number(modUpdatedAt) > lastVisit;
  }, [lastVisit, seenMods]);

  const countNew = useCallback((mods) => {
    if (!lastVisit || !Array.isArray(mods)) return 0;
    return mods.filter((m) => {
      if (m.domain && m.id && seenMods.has(`${m.domain}:${m.id}`)) return false;
      return Number(m.updatedAt || 0) > lastVisit;
    }).length;
  }, [lastVisit, seenMods]);

  return {
    lastVisit,
    updateLastVisit,
    isNew,
    countNew,
    seenMods,
    markAsSeen,
    markAllAsSeen,
  };
}
