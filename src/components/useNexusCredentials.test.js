import { renderHook, act } from "@testing-library/react";
import useNexusCredentials from "./useNexusCredentials";

jest.mock("../utils/cryptoStorage", () => ({
  encryptValue: jest.fn(async (v) => `enc:${v}`),
  decryptValue: jest.fn(async (v) => (v.startsWith("enc:") ? v.slice(4) : v)),
}));

const ACCOUNTS_KEY = "nexus_accounts";
const LEGACY_KEY = "nexus_credentials";

function makeAccountsState(accounts, activeIndex = 0) {
  return { activeId: accounts[activeIndex].id, accounts };
}

beforeEach(() => {
  localStorage.clear();
});

describe("useNexusCredentials — chargement initial", () => {
  it("credentials est null et loading passe a false si localStorage est vide", async () => {
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    expect(result.current.loading).toBe(false);
    expect(result.current.credentials).toBeNull();
    expect(result.current.hasCredentials).toBe(false);
  });

  it("charge le compte actif depuis nexus_accounts", async () => {
    const state = makeAccountsState([{ id: "a1", username: "alice", apiKey: "key123" }]);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(state));
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    expect(result.current.credentials).toEqual({ username: "alice", apiKey: "key123" });
    expect(result.current.hasCredentials).toBe(true);
    expect(result.current.accounts).toHaveLength(1);
  });

  it("migre l'ancien format nexus_credentials vers nexus_accounts", async () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ username: "bob", apiKey: "legacykey" }));
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    expect(result.current.credentials).toEqual({ username: "bob", apiKey: "legacykey" });
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
    expect(JSON.parse(localStorage.getItem(ACCOUNTS_KEY)).accounts).toHaveLength(1);
  });

  it("ignore un JSON invalide dans localStorage", async () => {
    localStorage.setItem(ACCOUNTS_KEY, "not-json");
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    expect(result.current.credentials).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});

describe("useNexusCredentials — saveCredentials", () => {
  it("ajoute un nouveau compte et le set comme actif", async () => {
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    act(() => { result.current.saveCredentials("bob", "mykey"); });
    expect(result.current.credentials).toEqual({ username: "bob", apiKey: "mykey" });
    expect(result.current.hasCredentials).toBe(true);
    expect(result.current.accounts).toHaveLength(1);
  });

  it("met a jour la cle d'un compte existant (meme username)", async () => {
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    act(() => { result.current.saveCredentials("alice", "key1"); });
    act(() => { result.current.saveCredentials("alice", "key2"); });
    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.credentials?.apiKey).toBe("key2");
  });

  it("ajoute un second compte si le username est different", async () => {
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    act(() => { result.current.saveCredentials("alice", "key1"); });
    act(() => { result.current.saveCredentials("bob", "key2"); });
    expect(result.current.accounts).toHaveLength(2);
    expect(result.current.credentials?.username).toBe("bob");
  });

  it("retourne true en cas de succes", async () => {
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    let returned;
    act(() => { returned = result.current.saveCredentials("u", "k"); });
    expect(returned).toBe(true);
  });
});

describe("useNexusCredentials — clearCredentials", () => {
  it("supprime le compte actif, credentials devient null si c'etait le seul", async () => {
    const state = makeAccountsState([{ id: "a1", username: "alice", apiKey: "key" }]);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(state));
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    act(() => { result.current.clearCredentials(); });
    expect(result.current.credentials).toBeNull();
    expect(result.current.hasCredentials).toBe(false);
    expect(result.current.accounts).toHaveLength(0);
  });

  it("bascule sur le premier compte restant si plusieurs comptes", async () => {
    const state = {
      activeId: "a1",
      accounts: [
        { id: "a1", username: "alice", apiKey: "k1" },
        { id: "a2", username: "bob", apiKey: "k2" },
      ],
    };
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(state));
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    act(() => { result.current.clearCredentials(); });
    expect(result.current.credentials?.username).toBe("bob");
    expect(result.current.accounts).toHaveLength(1);
  });

  it("retourne true en cas de succes", async () => {
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    let returned;
    act(() => { returned = result.current.clearCredentials(); });
    expect(returned).toBe(true);
  });
});

describe("useNexusCredentials — switchAccount", () => {
  it("change le compte actif", async () => {
    const state = {
      activeId: "a1",
      accounts: [
        { id: "a1", username: "alice", apiKey: "k1" },
        { id: "a2", username: "bob", apiKey: "k2" },
      ],
    };
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(state));
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    act(() => { result.current.switchAccount("a2"); });
    expect(result.current.credentials?.username).toBe("bob");
    expect(result.current.activeAccountId).toBe("a2");
  });

  it("ne fait rien si l'id est inconnu", async () => {
    const state = makeAccountsState([{ id: "a1", username: "alice", apiKey: "k1" }]);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(state));
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    act(() => { result.current.switchAccount("unknown"); });
    expect(result.current.activeAccountId).toBe("a1");
  });
});

describe("useNexusCredentials — removeAccount", () => {
  it("supprime un compte non-actif sans changer l'actif", async () => {
    const state = {
      activeId: "a1",
      accounts: [
        { id: "a1", username: "alice", apiKey: "k1" },
        { id: "a2", username: "bob", apiKey: "k2" },
      ],
    };
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(state));
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    act(() => { result.current.removeAccount("a2"); });
    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.credentials?.username).toBe("alice");
  });

  it("bascule sur un autre compte si le compte actif est supprime", async () => {
    const state = {
      activeId: "a1",
      accounts: [
        { id: "a1", username: "alice", apiKey: "k1" },
        { id: "a2", username: "bob", apiKey: "k2" },
      ],
    };
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(state));
    const { result } = renderHook(() => useNexusCredentials());
    await act(async () => {});
    act(() => { result.current.removeAccount("a1"); });
    expect(result.current.credentials?.username).toBe("bob");
  });
});
