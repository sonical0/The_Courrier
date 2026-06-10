import { useState, useEffect } from "react";
import { encryptValue, decryptValue } from "../utils/cryptoStorage";

const ACCOUNTS_KEY = "nexus_accounts";
const LEGACY_KEY = "nexus_credentials";

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

function persist(state) {
  encryptValue(JSON.stringify({ activeId: state.activeId, accounts: state.accounts }))
    .then((enc) => localStorage.setItem(ACCOUNTS_KEY, enc))
    .catch(() => {});
}

export default function useNexusCredentials() {
  const [state, setState] = useState({ activeId: null, accounts: [], loading: true });

  useEffect(() => {
    const raw = localStorage.getItem(ACCOUNTS_KEY);

    if (!raw) {
      // Migration depuis l'ancien format nexus_credentials
      try {
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const creds = JSON.parse(legacy);
          if (creds.username && creds.apiKey) {
            const id = generateId();
            const migrated = { activeId: id, accounts: [{ id, username: creds.username, apiKey: creds.apiKey }] };
            // Écriture synchrone (plain JSON) — sera chiffré au prochain persist
            localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(migrated));
            localStorage.removeItem(LEGACY_KEY);
            setState({ ...migrated, loading: false });
            return;
          }
        }
      } catch {}
      setState({ activeId: null, accounts: [], loading: false });
      return;
    }

    if (raw.startsWith("{") || raw.startsWith("[")) {
      // JSON brut (pré-chiffrement) — charger tel quel, chiffrement à la prochaine action
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.accounts)) {
          setState({ ...parsed, loading: false });
          return;
        }
      } catch {}
      setState({ activeId: null, accounts: [], loading: false });
      return;
    }

    // Le format chiffré contient toujours un '.' (base64iv.base64cipher)
    // Si absent, les données sont corrompues ou invalides
    if (!raw.includes(".")) {
      setState({ activeId: null, accounts: [], loading: false });
      return;
    }

    // Données chiffrées — déchiffrement asynchrone
    decryptValue(raw)
      .then((json) => {
        try {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed.accounts)) {
            setState({ ...parsed, loading: false });
            return;
          }
        } catch {}
        setState({ activeId: null, accounts: [], loading: false });
      })
      .catch(() => setState({ activeId: null, accounts: [], loading: false }));
  }, []);

  const activeAccount = state.accounts.find((a) => a.id === state.activeId) || null;
  const credentials = activeAccount ? { username: activeAccount.username, apiKey: activeAccount.apiKey } : null;

  const saveCredentials = (username, apiKey) => {
    try {
      let next;
      setState((prev) => {
        const existing = prev.accounts.find((a) => a.username === username);
        let accounts;
        let activeId;
        if (existing) {
          accounts = prev.accounts.map((a) => (a.id === existing.id ? { ...a, apiKey } : a));
          activeId = existing.id;
        } else {
          const id = generateId();
          accounts = [...prev.accounts, { id, username, apiKey }];
          activeId = id;
        }
        next = { ...prev, accounts, activeId };
        return next;
      });
      if (next) persist(next);
      return true;
    } catch {
      return false;
    }
  };

  const clearCredentials = () => {
    try {
      let next;
      setState((prev) => {
        const accounts = prev.accounts.filter((a) => a.id !== prev.activeId);
        const activeId = accounts.length > 0 ? accounts[0].id : null;
        next = { ...prev, accounts, activeId };
        return next;
      });
      if (next) persist(next);
      return true;
    } catch {
      return false;
    }
  };

  const switchAccount = (id) => {
    let next;
    setState((prev) => {
      if (!prev.accounts.find((a) => a.id === id)) return prev;
      next = { ...prev, activeId: id };
      return next;
    });
    if (next) persist(next);
  };

  const removeAccount = (id) => {
    let next;
    setState((prev) => {
      const accounts = prev.accounts.filter((a) => a.id !== id);
      const activeId =
        prev.activeId === id
          ? accounts.length > 0
            ? accounts[0].id
            : null
          : prev.activeId;
      next = { ...prev, accounts, activeId };
      return next;
    });
    if (next) persist(next);
  };

  return {
    credentials,
    loading: state.loading,
    saveCredentials,
    clearCredentials,
    hasCredentials: !!(credentials?.username && credentials?.apiKey),
    accounts: state.accounts,
    activeAccountId: state.activeId,
    switchAccount,
    removeAccount,
  };
}
