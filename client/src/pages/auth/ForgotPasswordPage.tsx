import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthLayout } from "./components/AuthLayout";
import GradientButton from "@/components/ui/gradient-button";
import { Mail, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";
import { authApi } from "@/core/api/authApi";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      await authApi.forgotPassword(email);
      setIsSuccess(true);
      // Navigate to verify code page after a short delay
      setTimeout(() => {
        navigate("/verify-code", { state: { email } });
      }, 1500);
    } catch (err: any) {
      // We always show success for security (prevent email enumeration)
      // But handle actual errors gracefully
      if (err.response?.status === 429) {
        setError("Too many requests. Please wait a moment before trying again.");
      } else {
        // Still show success even if email doesn't exist (security)
        setIsSuccess(true);
        setTimeout(() => {
          navigate("/verify-code", { state: { email } });
        }, 1500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="No worries, we'll send you reset instructions"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {isSuccess && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-500">Check your email</p>
              <p className="text-sm text-green-500/80 mt-1">
                We've sent a 6-digit code to your email address.
              </p>
            </div>
          </div>
        )}

        {!isSuccess && (
          <>
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface border border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-foreground placeholder:text-muted-foreground"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            {/* Submit Button */}
            <GradientButton
              type="submit"
              className="w-full h-12 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </div>
              ) : (
                "Send reset code"
              )}
            </GradientButton>
          </>
        )}

        {/* Back to Login Link */}
        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
