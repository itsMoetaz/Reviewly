import { createBrowserRouter } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import { DashboardPage } from "@/pages/home/HomePage";
import { ProfilePage } from "@/pages/profile";
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
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  ...authRoutes,
]);
