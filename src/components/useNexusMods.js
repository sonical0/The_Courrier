import { useEffect, useMemo, useState, useCallback } from "react";

function toEpoch(val) {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = Number(val);
    if (!Number.isNaN(n) && n > 0) return n;
    const t = Date.parse(val);
    if (!Number.isNaN(t)) return Math.floor(t / 1000);
  }
  return 0;
}

export default function useNexusMods(credentials = null) {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTracked = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { Accept: "application/json" };
      if (credentials?.username && credentials?.apiKey) {
        headers["X-Nexus-Username"] = credentials.username;
        headers["X-Nexus-ApiKey"] = credentials.apiKey;
      }

      const res = await fetch(`/api/nexus/tracked`, { headers });
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
          gameId: m.gameId ?? m.game_id ?? m.game?.id,
          gameName: m.gameName ?? m.game_name ?? m.game?.name,
          author: m.author ?? m.user?.name ?? m.uploader?.name,
          authorId: m.authorId ?? m.author_id ?? m.user?.member_id ?? m.uploader?.member_id,
          updatedAt,
          url,
          picture: m.picture_url ?? m.thumbnail_url ?? m.content_preview_link ?? m.picture,
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
  }, [credentials]);

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

  const untrackMod = useCallback(async (domain, modId) => {
    try {
      // Préparer les headers avec les credentials si disponibles
      const headers = { Accept: "application/json" };
      if (credentials?.username && credentials?.apiKey) {
        headers["X-Nexus-Username"] = credentials.username;
        headers["X-Nexus-ApiKey"] = credentials.apiKey;
      }

      // En dev, utilise le proxy de package.json (Create React App)
      // En prod (Netlify/Vercel), utilise les serverless functions
      const res = await fetch(`/api/nexus/tracked/${domain}/${modId}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}${text ? " — " + text : ""}`);
      }
      // Rafraîchit la liste après suppression
      await fetchTracked();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message || String(e) };
    }
  }, [fetchTracked, credentials]);

  return { loading, error, games, modsForGame, refresh: fetchTracked, untrackMod };
}
