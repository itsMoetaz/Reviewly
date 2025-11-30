import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "./ProtectedRoute";
import { authRoutes } from "./authRoutes";

const LandingPage = lazy(() => import("@/pages/LandingPage"));
const HomePage = lazy(() => import("@/pages/home/HomePage"));
const ProfilePage = lazy(() => import("@/pages/profile/ProfilePage"));
const ProjectDetailsPage = lazy(() => import("@/pages/projects/[id]/ProjectDetailsPage"));
const PullRequestDetailPage = lazy(() => import("@/pages/projects/[id]/pr/[prNumber]/PullRequestDetailPage"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);
export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<PageLoader />}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: "/home",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <HomePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ProfilePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ProjectDetailsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/:id/pr/:prNumber",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <PullRequestDetailPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  ...authRoutes,
]);