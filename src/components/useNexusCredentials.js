import { useState, useEffect } from "react";

const STORAGE_KEY = "nexus_credentials";

/**
 * Hook pour gérer les credentials Nexus Mods stockés dans localStorage
 */
export default function useNexusCredentials() {
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger les credentials au montage
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

  // Sauvegarder les credentials
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

  // Supprimer les credentials
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

  // Vérifier si les credentials sont présents
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
