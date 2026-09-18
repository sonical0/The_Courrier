import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./AppLayout";
import DashboardPage from "./pages/DashboardPage";
import ActuUpdatePage from "./pages/ActuUpdatePage";
import NexusModsPage from "./pages/NexusModsPage";
import IncompatibilityPage from "./pages/IncompatibilityPage";
import NotFoundPage from "./pages/NotFoundPage";
import RouteErrorPage from "./pages/RouteErrorPage";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    // Sans errorElement, toute erreur d'execution d'une route remonte a l'ecran
    // par defaut de React Router, ecrit pour le developpeur et montre a
    // l'utilisateur.
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "actus", element: <ActuUpdatePage /> },
      { path: "nexus-mods", element: <NexusModsPage /> },
      { path: "incompatibility", element: <IncompatibilityPage /> },
      // Attrape-tout : garde l'en-tete et la navigation, donc l'utilisateur
      // n'est jamais bloque sur une impasse.
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
