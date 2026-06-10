import { useState, useEffect } from "react";

const ACCOUNTS_KEY = "nexus_accounts";
const LEGACY_KEY = "nexus_credentials";

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

function loadState() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.accounts)) return parsed;
    }
  } catch {}

  // Migration format legacy
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const creds = JSON.parse(legacy);
      if (creds.username && creds.apiKey) {
        const id = generateId();
        const state = { activeId: id, accounts: [{ id, username: creds.username, apiKey: creds.apiKey }] };
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(state));
        localStorage.removeItem(LEGACY_KEY);
        return state;
      }
    }
  } catch {}

  return { activeId: null, accounts: [] };
}

function persistState(state) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(state));
  } catch {}
}

export default function useNexusCredentials() {
  const [state, setState] = useState({ activeId: null, accounts: [], loading: true });

  useEffect(() => {
    const loaded = loadState();
    setState({ ...loaded, loading: false });
  }, []);

  const activeAccount = state.accounts.find((a) => a.id === state.activeId) || null;
  const credentials = activeAccount ? { username: activeAccount.username, apiKey: activeAccount.apiKey } : null;

  // Ajoute un nouveau compte ou met a jour un existant (meme username), set comme actif
  const saveCredentials = (username, apiKey) => {
    try {
      setState((prev) => {
        const existing = prev.accounts.find((a) => a.username === username);
        let accounts;
        let activeId;
        if (existing) {
          accounts = prev.accounts.map((a) => a.id === existing.id ? { ...a, apiKey } : a);
          activeId = existing.id;
        } else {
          const id = generateId();
          accounts = [...prev.accounts, { id, username, apiKey }];
          activeId = id;
        }
        const next = { ...prev, accounts, activeId };
        persistState({ activeId: next.activeId, accounts: next.accounts });
        return next;
      });
      return true;
    } catch {
      return false;
    }
  };

  // Supprime le compte actif, bascule sur le premier compte restant
  const clearCredentials = () => {
    try {
      setState((prev) => {
        const accounts = prev.accounts.filter((a) => a.id !== prev.activeId);
        const activeId = accounts.length > 0 ? accounts[0].id : null;
        const next = { ...prev, accounts, activeId };
        persistState({ activeId: next.activeId, accounts: next.accounts });
        return next;
      });
      return true;
    } catch {
      return false;
    }
  };

  const switchAccount = (id) => {
    setState((prev) => {
      if (!prev.accounts.find((a) => a.id === id)) return prev;
      const next = { ...prev, activeId: id };
      persistState({ activeId: next.activeId, accounts: next.accounts });
      return next;
    });
  };

  const removeAccount = (id) => {
    setState((prev) => {
      const accounts = prev.accounts.filter((a) => a.id !== id);
      const activeId =
        prev.activeId === id
          ? accounts.length > 0 ? accounts[0].id : null
          : prev.activeId;
      const next = { ...prev, accounts, activeId };
      persistState({ activeId: next.activeId, accounts: next.accounts });
      return next;
    });
  };

  return {
    // backward compat
    credentials,
    loading: state.loading,
    saveCredentials,
    clearCredentials,
    hasCredentials: !!(credentials?.username && credentials?.apiKey),
    // multi-compte
    accounts: state.accounts,
    activeAccountId: state.activeId,
    switchAccount,
    removeAccount,
  };
}
