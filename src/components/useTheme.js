import { useState, useEffect } from 'react';

export default function useTheme() {
  // Fonction pour appliquer le thème sur le DOM
  const applyTheme = (theme) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const [theme, setTheme] = useState(() => {
    // Récupère le thème depuis localStorage ou utilise 'light' par défaut
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme || 'light';
    
    // Applique immédiatement le thème au chargement
    applyTheme(initialTheme);
    
    return initialTheme;
  });

  useEffect(() => {
    // Met à jour la classe sur l'élément html
    applyTheme(theme);
    // Sauvegarde dans localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
}
