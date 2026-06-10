import { renderHook, act } from "@testing-library/react";
import useNotifications from "./useNotifications";

const PREF_KEY = "courrier_notifications_enabled";

let mockPermission = "default";
let mockNotificationCtor;

beforeEach(() => {
  localStorage.clear();
  mockPermission = "default";
  mockNotificationCtor = jest.fn();
  mockNotificationCtor.requestPermission = jest.fn();
  Object.defineProperty(mockNotificationCtor, "permission", {
    get: () => mockPermission,
    configurable: true,
  });
  Object.defineProperty(global, "Notification", {
    value: mockNotificationCtor,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useNotifications — initialisation", () => {
  it("lit la permission courante au montage", () => {
    mockPermission = "granted";
    const { result } = renderHook(() => useNotifications());
    expect(result.current.permission).toBe("granted");
  });

  it("enabled est false si la pref n'est pas enregistree", () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.enabled).toBe(false);
  });

  it("enabled est true si la pref localStorage est true", () => {
    localStorage.setItem(PREF_KEY, "true");
    const { result } = renderHook(() => useNotifications());
    expect(result.current.enabled).toBe(true);
  });

  it("supported est true si Notification est disponible", () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.supported).toBe(true);
  });
});

describe("useNotifications — requestPermission", () => {
  it("retourne 'granted' et active les notifications si permission accordee", async () => {
    Notification.requestPermission.mockResolvedValue("granted");
    const { result } = renderHook(() => useNotifications());
    let returned;
    await act(async () => {
      returned = await result.current.requestPermission();
    });
    expect(returned).toBe("granted");
    expect(result.current.enabled).toBe(true);
    expect(localStorage.getItem(PREF_KEY)).toBe("true");
  });

  it("retourne 'denied' et desactive les notifications si permission refusee", async () => {
    Notification.requestPermission.mockResolvedValue("denied");
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(result.current.enabled).toBe(false);
    expect(localStorage.getItem(PREF_KEY)).toBe("false");
  });

  it("n'appelle pas requestPermission si deja granted", async () => {
    mockPermission = "granted";
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(Notification.requestPermission).not.toHaveBeenCalled();
    expect(result.current.enabled).toBe(true);
  });
});

describe("useNotifications — disableNotifications", () => {
  it("passe enabled a false et met a jour localStorage", async () => {
    localStorage.setItem(PREF_KEY, "true");
    const { result } = renderHook(() => useNotifications());
    act(() => { result.current.disableNotifications(); });
    expect(result.current.enabled).toBe(false);
    expect(localStorage.getItem(PREF_KEY)).toBe("false");
  });
});

describe("useNotifications — notify et notifyNewMods", () => {
  it("cree une Notification si enabled et permission granted", () => {
    mockPermission = "granted";
    localStorage.setItem(PREF_KEY, "true");
    const { result } = renderHook(() => useNotifications());
    act(() => { result.current.notify("Titre", "Corps"); });
    expect(mockNotificationCtor).toHaveBeenCalledWith("Titre", expect.objectContaining({ body: "Corps" }));
  });

  it("ne cree pas de Notification si disabled", () => {
    mockPermission = "granted";
    localStorage.setItem(PREF_KEY, "false");
    const { result } = renderHook(() => useNotifications());
    act(() => { result.current.notify("Titre", "Corps"); });
    expect(mockNotificationCtor).not.toHaveBeenCalled();
  });

  it("notifyNewMods envoie le bon message au singulier", () => {
    mockPermission = "granted";
    localStorage.setItem(PREF_KEY, "true");
    const { result } = renderHook(() => useNotifications());
    act(() => { result.current.notifyNewMods(1); });
    expect(mockNotificationCtor).toHaveBeenCalledWith(
      "The Courrier",
      expect.objectContaining({ body: "1 nouveau mod disponible" })
    );
  });

  it("notifyNewMods envoie le bon message au pluriel", () => {
    mockPermission = "granted";
    localStorage.setItem(PREF_KEY, "true");
    const { result } = renderHook(() => useNotifications());
    act(() => { result.current.notifyNewMods(5); });
    expect(mockNotificationCtor).toHaveBeenCalledWith(
      "The Courrier",
      expect.objectContaining({ body: "5 nouveaux mods disponibles" })
    );
  });

  it("notifyNewMods ne fait rien si count <= 0", () => {
    mockPermission = "granted";
    localStorage.setItem(PREF_KEY, "true");
    const { result } = renderHook(() => useNotifications());
    act(() => { result.current.notifyNewMods(0); });
    expect(mockNotificationCtor).not.toHaveBeenCalled();
  });
});
