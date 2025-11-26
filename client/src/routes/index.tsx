import { createBrowserRouter } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { authRoutes } from "./authRoutes";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  ...authRoutes,
]);
