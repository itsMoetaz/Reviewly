import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const GoogleCallbackPage = lazy(() => import("@/pages/auth/GoogleCallbackPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const VerifyCodePage = lazy(() => import("@/pages/auth/VerifyCodePage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));

const AuthLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);
export const authRoutes: RouteObject[] = [
  {
    path: "/login",
    element: (
      <Suspense fallback={<AuthLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: "/register",
    element: (
      <Suspense fallback={<AuthLoader />}>
        <RegisterPage />
      </Suspense>
    ),
  },
  {
    path: "/auth/callback",
    element: (
      <Suspense fallback={<GoogleCallbackPage />}>
        <GoogleCallbackPage />
      </Suspense>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <Suspense fallback={<AuthLoader />}>
        <ForgotPasswordPage />
      </Suspense>
    ),
  },
  {
    path: "/verify-code",
    element: (
      <Suspense fallback={<AuthLoader />}>
        <VerifyCodePage />
      </Suspense>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <Suspense fallback={<AuthLoader />}>
        <ResetPasswordPage />
      </Suspense>
    ),
  },
];