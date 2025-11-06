import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
import GameDetails from "./pages/GameDetails"; // ← sans {}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/steam/app/:appid" element={<GameDetails />} />
    </Routes>
  </BrowserRouter>
);
