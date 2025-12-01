import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Users,
  LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { teamService } from "@/core/services/teamService";
import { useAuthStore } from "@/store/authStore";

type InvitationState = "loading" | "success" | "error" | "login-required";

const AcceptInvitationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const [state, setState] = useState<InvitationState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [projectName] = useState<string>("");
  
  const token = searchParams.get("token");

  const acceptInvitation = useCallback(async () => {
    if (!token) {
      setState("error");
      setErrorMessage("Invalid invitation link. No token provided.");
      return;
    }

    if (!isAuthenticated) {
      setState("login-required");
      return;
    }

    setState("loading");
    
    const result = await teamService.acceptInvitation(token);
    
    if (result.success) {
      setState("success");
      // We don't have project name from the response, but we can redirect
    } else {
      setState("error");
      setErrorMessage(result.error || "Failed to accept invitation");
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    acceptInvitation();
  }, [acceptInvitation]);

  const handleDecline = async () => {
    if (!token) return;
    
    setState("loading");
    const result = await teamService.declineInvitation(token);
    
    if (result.success) {
      navigate("/home");
    } else {
      setState("error");
      setErrorMessage(result.error || "Failed to decline invitation");
    }
  };

  const handleLoginRedirect = () => {
    // Store the invitation URL to redirect back after login
    const returnUrl = window.location.href;
    localStorage.setItem("invitation_return_url", returnUrl);
    navigate("/auth/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a project
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Loading State */}
          {state === "loading" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Processing invitation...</p>
            </div>
          )}

          {/* Login Required State */}
          {state === "login-required" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <LogIn className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="text-center">
                <p className="font-medium mb-1">Login Required</p>
                <p className="text-sm text-muted-foreground">
                  Please log in to accept this invitation. Make sure to use the email address the invitation was sent to.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>
                  Cancel
                </Button>
                <Button className="flex-1 gap-2" onClick={handleLoginRedirect}>
                  <LogIn className="h-4 w-4" />
                  Log In
                </Button>
              </div>
            </div>
          )}

          {/* Success State */}
          {state === "success" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-medium mb-1">Welcome to the team!</p>
                <p className="text-sm text-muted-foreground">
                  You've successfully joined{projectName ? ` ${projectName}` : " the project"}. 
                  You can now access and collaborate on this project.
                </p>
              </div>
              <Button className="w-full" onClick={() => navigate("/home")}>
                Go to Dashboard
              </Button>
            </div>
          )}

          {/* Error State */}
          {state === "error" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="p-3 rounded-full bg-red-500/10">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-center">
                <p className="font-medium mb-1">Unable to Accept Invitation</p>
                <p className="text-sm text-muted-foreground">
                  {errorMessage}
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/home")}>
                  Go to Dashboard
                </Button>
                <Button className="flex-1" onClick={acceptInvitation}>
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Decline Option (only show when login required) */}
          {state === "login-required" && (
            <div className="pt-4 border-t">
              <p className="text-xs text-center text-muted-foreground">
                Don't want to join?{" "}
                <button 
                  onClick={handleDecline}
                  className="text-primary hover:underline"
                >
                  Decline invitation
                </button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitationPage;
