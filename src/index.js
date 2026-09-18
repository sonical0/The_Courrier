import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { installer as installerDiagnostics } from "./components/diagnostics";

// Avant le rendu : les erreurs de montage et les premiers appels API doivent
// etre captures, sinon le journal manque precisement ce qui casse au demarrage.
installerDiagnostics();

/**
 * Nettoyage d'une cle devenue orpheline.
 *
 * `gameVersions` etait ecrite par useGameVersions, supprime le 2026-09-18 : ce
 * hook comparait un champ `version` que les objets `games` ne portent pas, donc
 * il ne stockait jamais rien et aucune mise a jour de jeu n'etait detectee. La
 * detection se fait desormais dans useSteamGames, sur les buildId Steam, sous la
 * cle `steamGameVersions`.
 *
 * Deux octets de donnee morte — mais c'est cette valeur `{}` qui a fait chercher
 * un probleme de cache la ou il n'y en avait pas. On la retire pour que personne
 * ne refasse l'enquete.
 */
try {
  localStorage.removeItem("gameVersions");
} catch {
  // Stockage refuse (navigation privee, blocage tiers) : sans consequence.
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
