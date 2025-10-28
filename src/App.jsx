import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import BootstrapPage from "./pages/BootstrapPage";
import TailwindPage from "./pages/TailwindPage";

export default function App() {
  return (
    <Router>
      <nav className="p-3 bg-light d-flex justify-content-around">
        <Link to="/">Bootstrap</Link>
        <Link to="/tailwind">Tailwind</Link>
      </nav>
      <Routes>
        <Route path="/" element={<BootstrapPage />} />
        <Route path="/tailwind" element={<TailwindPage />} />
      </Routes>
    </Router>
  );
}