import { useEffect, useMemo, useState, useCallback } from "react";

function pickUpdatedAt(m) {
  return (
    m?.updated_time ||
    m?.updated_timestamp ||
    m?.last_update ||
    m?.last_updated ||
    m?.uploaded_time ||
    0
  );
}

export default function useNexusMods() {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTracked = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // appel au proxy serveur local qui injecte la clé
      const res = await fetch(`/api/nexus/tracked`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}${text ? " — " + text : ""}`);
      }

      const data = await res.json();

      const normalized = (Array.isArray(data) ? data : []).map((m) => ({
        id: m.mod_id ?? m.modId ?? m.id,
        name: m.name,
        version: m.version ?? m.mod_version,
        domain: m.domain_name ?? m.domain ?? m.game?.domain_name,
        gameId: m.game_id ?? m.game?.id,
        gameName: m.game_name ?? m.game?.name,
        author: m.author ?? m.user?.name,
        updatedAt: pickUpdatedAt(m),
        url: m.url ?? m.mod_page_url,
        picture: m.picture_url ?? m.thumbnail_url,
      }));

      setMods(normalized);
    } catch (e) {
      setError(e.message || String(e));
      setMods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTracked();
  }, [fetchTracked]);

  const games = useMemo(() => {
    const map = new Map();
    for (const m of mods) {
      const key = m.domain || m.gameId || m.gameName;
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, {
          key,
          domain: m.domain,
          gameId: m.gameId,
          name: m.gameName || m.domain || `Game ${m.gameId || ""}`.trim(),
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }, [mods]);

  function modsForGame(gameKey) {
    const filtered = mods.filter(
      (m) =>
        m.domain === gameKey ||
        String(m.gameId) === String(gameKey) ||
        m.gameName === gameKey
    );
    return filtered.sort((a, b) => Number(pickUpdatedAt(b)) - Number(pickUpdatedAt(a)));
  }

  return { loading, error, games, modsForGame, refresh: fetchTracked };
}
