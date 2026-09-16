import { useState, useCallback } from "react";

const TAGS_KEY = "courrier_mod_tags";

export const TAG_LABELS = {
  installed: "Installe",
  "to-install": "A installer",
  paused: "En pause",
  archived: "Archive",
};

export const TAG_COLORS = {
  installed: {
    border: "ring-2 ring-green-500",
    badge: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    btn: "bg-green-500 text-white",
  },
  "to-install": {
    border: "ring-2 ring-blue-500",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    btn: "bg-blue-500 text-white",
  },
  paused: {
    border: "ring-2 ring-yellow-500",
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    btn: "bg-yellow-500 text-white",
  },
  archived: {
    border: "ring-2 ring-red-400",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    btn: "bg-red-400 text-white",
  },
};

function loadTags() {
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function persistTags(tags) {
  try {
    localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
  } catch {}
}

export default function useModTags() {
  const [tags, setTags] = useState(() => loadTags());

  const getTag = useCallback(
    (domain, id) => tags[`${domain}:${id}`] || null,
    [tags]
  );

  const setTag = useCallback((domain, id, tag) => {
    setTags((prev) => {
      const next = { ...prev, [`${domain}:${id}`]: tag };
      persistTags(next);
      return next;
    });
  }, []);

  const clearTag = useCallback((domain, id) => {
    setTags((prev) => {
      const next = { ...prev };
      delete next[`${domain}:${id}`];
      persistTags(next);
      return next;
    });
  }, []);

  const toggleTag = useCallback(
    (domain, id, tag) => {
      if (getTag(domain, id) === tag) {
        clearTag(domain, id);
      } else {
        setTag(domain, id, tag);
      }
    },
    [getTag, setTag, clearTag]
  );

  return { getTag, setTag, clearTag, toggleTag, tags };
}
