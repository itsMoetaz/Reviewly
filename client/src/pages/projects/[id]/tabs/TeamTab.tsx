import { memo, useState } from "react";
import { 
  Users, 
  UserPlus, 
  Crown, 
  Shield, 
  Eye, 
  Edit2, 
  Mail,
  Clock,
  MoreVertical,
  Trash2,
  Loader2,
  X,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProjectMemberResponse, ProjectMemberRole, ProjectInvitationResponse } from "@/core/interfaces/team.interface";
import { ROLE_CONFIG } from "@/core/interfaces/team.interface";

const API_URL = import.meta.env.VITE_API_URL;
interface TeamTabProps {
  members: ProjectMemberResponse[];
  pendingInvitations?: ProjectInvitationResponse[];
  isLoading: boolean;
  isInvitationsLoading?: boolean;
  currentUserId: number;
  currentUserRole?: ProjectMemberRole;
  onInviteMember: () => void;
  onUpdateRole: (memberId: number, userId: number, newRole: ProjectMemberRole) => void;
  onRemoveMember: (memberId: number, userId: number) => void;
  onCancelInvitation?: (invitationId: number) => void;
}

const getRoleIcon = (role: ProjectMemberRole) => {
  switch (role) {
    case "OWNER":
      return <Crown className="h-3.5 w-3.5" />;
    case "ADMIN":
      return <Shield className="h-3.5 w-3.5" />;
    case "REVIEWER":
      return <Edit2 className="h-3.5 w-3.5" />;
    default:
      return <Eye className="h-3.5 w-3.5" />;
  }
};

const MemberCard = memo(({
  member,
  isCurrentUser,
  canEdit,
  onUpdateRole,
  onRemove,
}: {
  member: ProjectMemberResponse;
  isCurrentUser: boolean;
  canEdit: boolean;
  onUpdateRole: (newRole: ProjectMemberRole) => void;
  onRemove: () => void;
}) => {
  // Normalize role to uppercase to match ROLE_CONFIG keys
  const normalizedRole = (member.role?.toString().toUpperCase() || 'REVIEWER') as ProjectMemberRole;
  const roleConfig = ROLE_CONFIG[normalizedRole] || ROLE_CONFIG.REVIEWER;
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleChange = async (newRole: ProjectMemberRole) => {
    setIsUpdating(true);
    try {
      await onUpdateRole(newRole);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle case where user data is not loaded
  const user = member.user;
  if (!user) {
    return (
      <div className="p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-3 w-16 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  const displayName = user.full_name || user.username || 'Unknown User';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Member Info */}
        <div className="flex items-center gap-3 min-w-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url.startsWith('http') ? user.avatar_url : `${API_URL}${user.avatar_url}`} 
              alt="User Avatar"
              className="w-10 h-10 rounded-full ring-2 ring-background"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
              {avatarInitial}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{displayName}</span>
              {isCurrentUser && (
                <Badge variant="outline" className="text-xs">You</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              @{user.username || 'unknown'}
            </p>
          </div>
        </div>

        {/* Role Badge & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge 
            variant="secondary" 
            className={`gap-1 ${roleConfig.bgColor} ${roleConfig.color}`}
          >
            {getRoleIcon(normalizedRole)}
            {roleConfig.label}
          </Badge>

          {canEdit && normalizedRole !== "OWNER" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isUpdating}>
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => handleRoleChange("ADMIN")}
                  disabled={normalizedRole === "ADMIN"}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Make Admin
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleRoleChange("REVIEWER")}
                  disabled={normalizedRole === "REVIEWER"}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Make Reviewer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onRemove}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove from project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        {user.email && (
          <span className="flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            {user.email}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          Joined {new Date(member.joined_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
});

MemberCard.displayName = "MemberCard";

// ==================== Pending Invitation Card ====================

const PendingInvitationCard = memo(({
  invitation,
  onCancel,
  canCancel,
}: {
  invitation: ProjectInvitationResponse;
  onCancel: () => void;
  canCancel: boolean;
}) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const normalizedRole = (invitation.role?.toString().toUpperCase() || 'REVIEWER') as ProjectMemberRole;
  const roleConfig = ROLE_CONFIG[normalizedRole] || ROLE_CONFIG.REVIEWER;

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancel();
    } finally {
      setIsCancelling(false);
    }
  };

  const expiresAt = new Date(invitation.expires_at);
  const now = new Date();
  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="p-4 rounded-xl border border-dashed border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Invitation Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600">
            <Send className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{invitation.email}</span>
              <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-500/30">
                Pending
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Invitation sent
            </p>
          </div>
        </div>

        {/* Role & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge 
            variant="secondary" 
            className={`gap-1 ${roleConfig.bgColor} ${roleConfig.color}`}
          >
            {getRoleIcon(normalizedRole)}
            {roleConfig.label}
          </Badge>

          {canCancel && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleCancel}
              disabled={isCancelling}
              title="Cancel invitation"
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Expiry Info */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-yellow-500/20 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {daysRemaining > 0 
            ? `Expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`
            : 'Expires today'
          }
        </span>
        {invitation.inviter_name && (
          <span className="flex items-center gap-1">
            Invited by {invitation.inviter_name}
          </span>
        )}
      </div>
    </div>
  );
});

PendingInvitationCard.displayName = "PendingInvitationCard";

// ==================== Team Tab ====================

export const TeamTab = memo(({
  members,
  pendingInvitations = [],
  isLoading,
  isInvitationsLoading = false,
  currentUserId,
  currentUserRole,
  onInviteMember,
  onUpdateRole,
  onRemoveMember,
  onCancelInvitation,
}: TeamTabProps) => {
  const canManageMembers = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  // Sort: Owner first, then by role weight, then by join date
  const sortedMembers = [...members].sort((a, b) => {
    const roleWeight: Record<ProjectMemberRole, number> = {
      OWNER: 3,
      ADMIN: 2,
      REVIEWER: 1,
    };
    
    if (roleWeight[a.role] !== roleWeight[b.role]) {
      return roleWeight[b.role] - roleWeight[a.role];
    }
    
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{members.length} Team Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage who has access to this project
          </p>
        </div>
        {canManageMembers && (
          <Button onClick={onInviteMember} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Member List */}
      {sortedMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border rounded-xl bg-muted/20">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium mb-2">No team members</p>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Start by inviting collaborators to your project.
          </p>
          {canManageMembers && (
            <Button onClick={onInviteMember} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sortedMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isCurrentUser={member.user_id === currentUserId}
              canEdit={canManageMembers && member.user_id !== currentUserId}
              onUpdateRole={(newRole) => onUpdateRole(member.id, member.user_id, newRole)}
              onRemove={() => onRemoveMember(member.id, member.user_id)}
            />
          ))}
        </div>
      )}

      {/* Pending Invitations Section */}
      {canManageMembers && (pendingInvitations.length > 0 || isInvitationsLoading) && (
        <div className="space-y-3 mt-8">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-yellow-600" />
            <h4 className="font-medium">Pending Invitations</h4>
            <Badge variant="outline" className="text-yellow-600 border-yellow-500/30">
              {pendingInvitations.length}
            </Badge>
          </div>
          
          {isInvitationsLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {pendingInvitations.map((invitation) => (
                <PendingInvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  onCancel={() => onCancelInvitation?.(invitation.id)}
                  canCancel={canManageMembers}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

TeamTab.displayName = "TeamTab";
