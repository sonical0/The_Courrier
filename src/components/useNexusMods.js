import { useEffect, useMemo, useState, useCallback } from "react";

// tolérant aux formats timestamp/ISO/numérique
function toEpoch(val) {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    // nombre encodé en string
    const n = Number(val);
    if (!Number.isNaN(n) && n > 0) return n;
    // date ISO
    const t = Date.parse(val);
    if (!Number.isNaN(t)) return Math.floor(t / 1000);
  }
  return 0;
}

export default function useNexusMods() {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTracked = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/nexus/tracked`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}${text ? " — " + text : ""}`);
      }
      const data = await res.json();

      const normalized = (Array.isArray(data) ? data : []).map((m) => {
        const id =
          m.mod_id ?? m.modId ?? m.id;
        const domain =
          m.domain_name ?? m.domain ?? m.game?.domain_name;
        const name =
          m.name ?? m.mod_name ?? m.title ?? `${domain || "?"} / ${id || "?"}`;
        const url =
          m.url ??
          m.mod_page_url ??
          (domain && id ? `https://www.nexusmods.com/${domain}/mods/${id}` : undefined);

        const updatedAt = toEpoch(
          m.updated_time ??
            m.updated_timestamp ??
            m.last_update ??
            m.last_updated ??
            m.uploaded_time ??
            m.latest_file_update ??
            m.created_time ??
            m.updatedAt
        );

        return {
          id,
          name,
          version: m.version ?? m.mod_version ?? m.latest_version,
          domain,
          gameId: m.game_id ?? m.game?.id,
          gameName: m.game_name ?? m.game?.name,
          author: m.author ?? m.user?.name ?? m.uploader?.name,
          updatedAt,
          url,
          picture: m.picture_url ?? m.thumbnail_url ?? m.content_preview_link,
          summary: m.summary ?? m.short_description ?? "",
          // ajouts enrichissement serveur
          previousVersion: m.previousVersion ?? m.previous_version ?? null,
          changelog: Array.isArray(m.changelog)
            ? m.changelog
            : m.changelog
            ? [m.changelog]
            : [],
          changelogUrl:
            m.changelogUrl ||
            (domain && id
              ? `https://www.nexusmods.com/${domain}/mods/${id}?tab=logs`
              : undefined),
        };
      });

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
    return filtered.sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt));
  }

  return { loading, error, games, modsForGame, refresh: fetchTracked };
}
