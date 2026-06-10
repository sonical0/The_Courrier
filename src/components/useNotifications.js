import { useState, useCallback, useEffect } from "react";

const PREF_KEY = "courrier_notifications_enabled";

function getPermission() {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

function loadPref() {
  try {
    return localStorage.getItem(PREF_KEY) === "true";
  } catch {
    return false;
  }
}

export default function useNotifications() {
  const [permission, setPermission] = useState(() => getPermission());
  const [enabled, setEnabled] = useState(() => loadPref());

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "unsupported";
    if (Notification.permission === "granted") {
      setPermission("granted");
      setEnabled(true);
      localStorage.setItem(PREF_KEY, "true");
      return "granted";
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      setEnabled(true);
      localStorage.setItem(PREF_KEY, "true");
    } else {
      setEnabled(false);
      localStorage.setItem(PREF_KEY, "false");
    }
    return result;
  }, []);

  const disableNotifications = useCallback(() => {
    setEnabled(false);
    localStorage.setItem(PREF_KEY, "false");
  }, []);

  const notify = useCallback(
    (title, body) => {
      if (!enabled || permission !== "granted" || typeof Notification === "undefined") return;
      try {
        new Notification(title, {
          body,
          icon: "/logo192.png",
          tag: "courrier-update",
          renotify: true,
        });
      } catch {}
    },
    [enabled, permission]
  );

  const notifyNewMods = useCallback(
    (count) => {
      if (count <= 0) return;
      notify(
        "The Courrier",
        count === 1
          ? "1 nouveau mod disponible"
          : `${count} nouveaux mods disponibles`
      );
    },
    [notify]
  );

  return {
    permission,
    enabled,
    supported: typeof Notification !== "undefined",
    requestPermission,
    disableNotifications,
    notify,
    notifyNewMods,
  };
}
