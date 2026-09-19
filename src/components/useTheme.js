import { useState, useEffect, useCallback } from "react";

/**
 * Thème à TROIS états, pas deux.
 *
 * `systeme` est le défaut : la page suit le réglage de l'appareil, ce qui est
 * le comportement attendu aujourd'hui et le plus respectueux de l'utilisateur.
 * `light` et `dark` forcent l'un ou l'autre.
 *
 * L'ancien hook n'avait que deux états et imposait le clair au premier
 * chargement, quel que soit le réglage système.
 *
 * Mécanique : on continue de poser la classe `.dark` sur <html>, parce que
 * Tailwind est configuré en `darkMode: 'class'` et que les écrans existants
 * reposent sur des centaines d'utilitaires `dark:`. En mode `systeme` on
 * écoute `prefers-color-scheme` pour suivre un changement en direct — bascule
 * automatique au coucher du soleil sur mobile, par exemple.
 */

const CLE = "theme";
const ETATS = ["systeme", "light", "dark"];

const requete = () =>
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

function appliquer(choix) {
  const racine = document.documentElement;
  const mq = requete();
  const sombre = choix === "dark" || (choix === "systeme" && mq && mq.matches);
  racine.classList.toggle("dark", sombre);
  // Utile aux feuilles qui voudraient cibler l'état sans dépendre de Tailwind.
  racine.setAttribute("data-theme", sombre ? "dark" : "light");
}

function lireChoixInitial() {
  try {
    const garde = localStorage.getItem(CLE);
    // L'ancienne version stockait déjà "light"/"dark" : ces valeurs restent
    // valides, on ne casse pas la préférence des utilisateurs existants.
    if (garde && ETATS.includes(garde)) return garde;
  } catch {
    /* stockage refusé : on retombe sur le réglage système */
  }
  return "systeme";
}

export default function useTheme() {
  const [choix, setChoix] = useState(() => {
    const initial = lireChoixInitial();
    appliquer(initial);
    return initial;
  });

  useEffect(() => {
    appliquer(choix);
    try {
      localStorage.setItem(CLE, choix);
    } catch {
      /* sans effet */
    }
  }, [choix]);

  // En mode système uniquement : suivre un changement de réglage en direct.
  useEffect(() => {
    if (choix !== "systeme") return undefined;
    const mq = requete();
    if (!mq) return undefined;
    const suivre = () => appliquer("systeme");
    mq.addEventListener("change", suivre);
    return () => mq.removeEventListener("change", suivre);
  }, [choix]);

  const cycler = useCallback(() => {
    setChoix((actuel) => ETATS[(ETATS.indexOf(actuel) + 1) % ETATS.length]);
  }, []);

  const sombreEffectif =
    choix === "dark" || (choix === "systeme" && !!requete()?.matches);

  return {
    /** "systeme" | "light" | "dark" — le CHOIX, pas le rendu */
    choix,
    /** vrai si la page s'affiche en sombre, quel que soit le choix */
    sombreEffectif,
    cycler,
    setChoix,

    // Compatibilité avec l'ancienne interface, encore utilisée ailleurs.
    theme: sombreEffectif ? "dark" : "light",
    toggleTheme: cycler,
  };
}
