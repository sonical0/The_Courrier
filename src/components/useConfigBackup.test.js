import { exportConfig, importConfig } from "./useConfigBackup";

let blobContent = null;
let downloadName = null;

beforeEach(() => {
  localStorage.clear();
  blobContent = null;
  downloadName = null;
  global.URL.createObjectURL = jest.fn(() => "blob:test");
  global.URL.revokeObjectURL = jest.fn();
  jest.spyOn(document, "createElement").mockImplementation((tag) => {
    if (tag === "a") {
      return {
        set href(v) {},
        set download(v) { downloadName = v; },
        click: jest.fn(),
      };
    }
    return document.createElement.wrappedMethod
      ? document.createElement.wrappedMethod(tag)
      : {};
  });
  global.Blob = jest.fn().mockImplementation((parts) => {
    blobContent = parts[0];
    return { type: "application/json" };
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("exportConfig", () => {
  it("cree un fichier JSON avec les cles configurees", () => {
    localStorage.setItem("courrier_mod_tags", JSON.stringify({ "skyrimse:1": "installed" }));
    localStorage.setItem("theme", "dark");
    exportConfig();
    const parsed = JSON.parse(blobContent);
    expect(parsed.version).toBe("1");
    expect(parsed.data["courrier_mod_tags"]).toEqual({ "skyrimse:1": "installed" });
    expect(parsed.data["theme"]).toBe("dark");
    expect(parsed.exportedAt).toBeTruthy();
  });

  it("n'exporte pas les cles absentes", () => {
    exportConfig();
    const parsed = JSON.parse(blobContent);
    expect(Object.keys(parsed.data)).toHaveLength(0);
  });

  it("n'exporte jamais les credentials nexus", () => {
    localStorage.setItem("nexus_credentials", JSON.stringify({ username: "u", apiKey: "k" }));
    exportConfig();
    const parsed = JSON.parse(blobContent);
    expect(parsed.data["nexus_credentials"]).toBeUndefined();
  });

  it("le nom de fichier contient la date du jour", () => {
    exportConfig();
    expect(downloadName).toMatch(/the-courrier-config-\d{4}-\d{2}-\d{2}\.json/);
  });
});

function makeJsonFile(payload) {
  const content = JSON.stringify(payload);
  return new File([content], "config.json", { type: "application/json" });
}

describe("importConfig", () => {
  it("restaure les cles valides dans localStorage", async () => {
    const payload = {
      version: "1",
      exportedAt: "2026-06-10T00:00:00.000Z",
      data: {
        "courrier_mod_tags": { "skyrimse:1": "paused" },
        "theme": "dark",
      },
    };
    const result = await importConfig(makeJsonFile(payload));
    expect(result.success).toBe(true);
    expect(result.restored).toBe(2);
    expect(JSON.parse(localStorage.getItem("courrier_mod_tags"))).toEqual({ "skyrimse:1": "paused" });
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("retourne une erreur si le fichier n'est pas JSON", async () => {
    const file = new File(["hello"], "config.txt", { type: "text/plain" });
    const result = await importConfig(file);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("retourne une erreur si le JSON est invalide", async () => {
    const file = new File(["not-json{"], "config.json", { type: "application/json" });
    const result = await importConfig(file);
    expect(result.success).toBe(false);
  });

  it("retourne une erreur si la structure est incorrecte (pas de data)", async () => {
    const file = makeJsonFile({ version: "1" });
    const result = await importConfig(file);
    expect(result.success).toBe(false);
  });

  it("ignore les cles non reconnues dans le fichier importe", async () => {
    const payload = {
      version: "1",
      exportedAt: "",
      data: {
        "theme": "light",
        "nexus_credentials": { username: "hacker", apiKey: "stolen" },
      },
    };
    const result = await importConfig(makeJsonFile(payload));
    expect(result.success).toBe(true);
    expect(localStorage.getItem("nexus_credentials")).toBeNull();
    expect(localStorage.getItem("theme")).toBe("light");
  });
});
