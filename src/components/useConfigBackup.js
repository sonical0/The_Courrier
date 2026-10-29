const BACKUP_KEYS = [
  "courrier_mod_tags",
  "courrier_seen_mods",
  "courrier_last_visit",
  "theme",
];

export function exportConfig() {
  const data = {};
  for (const key of BACKUP_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    }
  }

  const payload = {
    version: "1",
    exportedAt: new Date().toISOString(),
    data,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `the-courrier-config-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importConfig(file) {
  return new Promise((resolve) => {
    if (!file || file.type !== "application/json") {
      resolve({ success: false, error: "Le fichier doit etre un JSON (.json)" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target.result);
        if (!payload.version || !payload.data || typeof payload.data !== "object") {
          resolve({ success: false, error: "Format de fichier invalide" });
          return;
        }

        let restored = 0;
        for (const key of BACKUP_KEYS) {
          if (key in payload.data) {
            const val = payload.data[key];
            localStorage.setItem(key, typeof val === "string" ? val : JSON.stringify(val));
            restored++;
          }
        }
        resolve({ success: true, restored });
      } catch {
        resolve({ success: false, error: "Fichier JSON invalide ou corrompu" });
      }
    };
    reader.onerror = () => resolve({ success: false, error: "Impossible de lire le fichier" });
    reader.readAsText(file);
  });
}
