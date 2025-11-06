import { useState, useEffect } from 'react';

export default function useTheme() {
  const [theme, setTheme] = useState(() => {
    // Récupère le thème depuis localStorage ou utilise 'light' par défaut
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme || 'light';
    
    // Applique immédiatement le thème au chargement
    const root = document.documentElement;
    if (initialTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    return initialTheme;
  });

  useEffect(() => {
    // Met à jour la classe sur l'élément html
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Sauvegarde dans localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
}

