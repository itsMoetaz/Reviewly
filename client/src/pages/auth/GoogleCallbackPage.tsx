import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export const GoogleCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAccessToken, fetchUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      setAccessToken(token);
      fetchUser().then(() => {
        navigate("/dashboard");
      });
    } else {
      navigate("/login");
    }
  }, [searchParams, navigate, setAccessToken, fetchUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};
