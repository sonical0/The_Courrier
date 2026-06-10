import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./AppLayout";
import DashboardPage from "./pages/DashboardPage";
import ActuUpdatePage from "./pages/ActuUpdatePage";
import NexusModsPage from "./pages/NexusModsPage";
import IncompatibilityPage from "./pages/IncompatibilityPage";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "actus", element: <ActuUpdatePage /> },
      { path: "nexus-mods", element: <NexusModsPage /> },
      { path: "incompatibility", element: <IncompatibilityPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
