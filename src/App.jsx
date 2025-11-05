import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import BootstrapPage from "./pages/BootstrapPage";
import TailwindPage from "./pages/TailwindPage";
import NexusModsPage from "./pages/NexusModsPage.jsx";

export default function App() {
  return (
    <Router>
      <nav className="p-3 bg-light d-flex justify-content-around">
        <Link to="/">Actus Mods</Link>
        <Link to="/tailwind">Tailwind</Link>
        <Link to="/nexus-mods">Nexus Mods</Link>
      </nav>
      <Routes>
        <Route path="/" element={<BootstrapPage />} />
        <Route path="/tailwind" element={<TailwindPage />} />
        <Route path="/nexus-mods" element={<NexusModsPage />} />
      </Routes>
    </Router>
  );
}
