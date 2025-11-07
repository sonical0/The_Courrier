import { useState, useEffect } from "react";

const STORAGE_KEY = "nexus_credentials";

export default function useNexusCredentials() {
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.username && parsed.apiKey) {
          setCredentials(parsed);
        }
      }
    } catch (e) {
      console.error("Erreur lors du chargement des credentials:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveCredentials = (username, apiKey) => {
    try {
      const creds = { username, apiKey };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
      setCredentials(creds);
      return true;
    } catch (e) {
      console.error("Erreur lors de la sauvegarde des credentials:", e);
      return false;
    }
  };

  const clearCredentials = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setCredentials(null);
      return true;
    } catch (e) {
      console.error("Erreur lors de la suppression des credentials:", e);
      return false;
    }
  };

  const hasCredentials = () => {
    return credentials && credentials.username && credentials.apiKey;
  };

  return {
    credentials,
    loading,
    saveCredentials,
    clearCredentials,
    hasCredentials: hasCredentials(),
  };
}
