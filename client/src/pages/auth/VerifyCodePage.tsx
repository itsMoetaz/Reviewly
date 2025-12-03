import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { AuthLayout } from "./components/AuthLayout";
import GradientButton from "@/components/ui/gradient-button";
import { AlertCircle, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";
import { authApi } from "@/core/api/authApi";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

const VerifyCodePage = () => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  // Handle resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);

    try {
      await authApi.verifyResetCode(email, code);
      setIsSuccess(true);
      // Navigate to reset password page after a short delay
      setTimeout(() => {
        navigate("/reset-password", { state: { email, code } });
      }, 1000);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError("Too many attempts. Please wait a moment before trying again.");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.detail || "Invalid or expired code. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setCode("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    setError("");

    try {
      await authApi.forgotPassword(email);
      setResendCooldown(60); // 60 second cooldown
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError("Too many requests. Please wait a moment before trying again.");
      }
    } finally {
      setIsResending(false);
    }
  };

  // Auto-submit when code is complete
  useEffect(() => {
    if (code.length === 6 && !isLoading) {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
  }, [code]);

  if (!email) {
    return null;
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`Enter the 6-digit code sent to ${email}`}
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
              <p className="text-sm font-medium text-green-500">Code verified!</p>
              <p className="text-sm text-green-500/80 mt-1">
                Redirecting to set your new password...
              </p>
            </div>
          </div>
        )}

        {!isSuccess && (
          <>
            {/* OTP Input */}
            <div className="flex flex-col items-center space-y-4">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => setCode(value)}
                disabled={isLoading}
              >
                <InputOTPGroup>
                  <InputOTPSlot 
                    index={0} 
                    className="w-12 h-14 text-xl bg-surface border-border text-foreground"
                  />
                  <InputOTPSlot 
                    index={1} 
                    className="w-12 h-14 text-xl bg-surface border-border text-foreground"
                  />
                  <InputOTPSlot 
                    index={2} 
                    className="w-12 h-14 text-xl bg-surface border-border text-foreground"
                  />
                </InputOTPGroup>
                <InputOTPSeparator className="text-muted-foreground" />
                <InputOTPGroup>
                  <InputOTPSlot 
                    index={3} 
                    className="w-12 h-14 text-xl bg-surface border-border text-foreground"
                  />
                  <InputOTPSlot 
                    index={4} 
                    className="w-12 h-14 text-xl bg-surface border-border text-foreground"
                  />
                  <InputOTPSlot 
                    index={5} 
                    className="w-12 h-14 text-xl bg-surface border-border text-foreground"
                  />
                </InputOTPGroup>
              </InputOTP>

              <p className="text-sm text-muted-foreground text-center">
                Didn't receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isResending}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    "Resend code"
                  )}
                </button>
              </p>
            </div>

            {/* Submit Button */}
            <GradientButton
              type="submit"
              className="w-full h-12 text-base"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </div>
              ) : (
                "Verify code"
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

export default VerifyCodePage;
