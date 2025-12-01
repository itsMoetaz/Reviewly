import { memo, useState, useCallback } from "react";
import { Mail, UserPlus, Shield, Edit2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ProjectMemberRole } from "@/core/interfaces/team.interface";

// Only ADMIN and REVIEWER can be invited - OWNER is assigned at project creation
type InviteRole = Exclude<ProjectMemberRole, "OWNER">;

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: InviteRole) => Promise<boolean>;
  isLoading?: boolean;
}

export const InviteMemberDialog = memo(({
  open,
  onOpenChange,
  onInvite,
  isLoading = false,
}: InviteMemberDialogProps) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("REVIEWER");
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setEmail("");
    setRole("REVIEWER");
    setError(null);
  }, []);

  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  }, [onOpenChange, resetForm]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    const success = await onInvite(trimmedEmail, role);
    if (success) {
      handleClose(false);
    }
  }, [email, role, onInvite, handleClose]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to collaborate on this project. They'll receive an email with instructions to join.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className="pl-10"
                disabled={isLoading}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label>Role</Label>
            <RadioGroup
              value={role}
              onValueChange={(value: string) => setRole(value as InviteRole)}
              disabled={isLoading}
              className="space-y-2"
            >
              <label
                htmlFor="role-admin"
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  role === "ADMIN" 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="ADMIN" id="role-admin" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Admin</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Can manage members, settings, review code and comment
                  </p>
                </div>
              </label>

              <label
                htmlFor="role-reviewer"
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  role === "REVIEWER" 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="REVIEWER" id="role-reviewer" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Edit2 className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Reviewer</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Can review code and add comments
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Info Box */}
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <p>
              The invited user will receive an email with a link to join this project. 
              The invitation will expire in <strong>7 days</strong>.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

InviteMemberDialog.displayName = "InviteMemberDialog";
