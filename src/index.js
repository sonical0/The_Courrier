import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { installer as installerDiagnostics } from "./components/diagnostics";

// Avant le rendu : les erreurs de montage et les premiers appels API doivent
// etre captures, sinon le journal manque precisement ce qui casse au demarrage.
installerDiagnostics();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
