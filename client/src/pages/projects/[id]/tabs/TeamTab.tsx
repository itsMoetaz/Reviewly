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
  Loader2
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
import type { ProjectMemberResponse, ProjectMemberRole } from "@/core/interfaces/team.interface";
import { ROLE_CONFIG } from "@/core/interfaces/team.interface";

interface TeamTabProps {
  members: ProjectMemberResponse[];
  isLoading: boolean;
  currentUserId: number;
  currentUserRole?: ProjectMemberRole;
  onInviteMember: () => void;
  onUpdateRole: (memberId: number, userId: number, newRole: ProjectMemberRole) => void;
  onRemoveMember: (memberId: number, userId: number) => void;
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
  const roleConfig = ROLE_CONFIG[member.role];
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleChange = async (newRole: ProjectMemberRole) => {
    setIsUpdating(true);
    try {
      await onUpdateRole(newRole);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Member Info */}
        <div className="flex items-center gap-3 min-w-0">
          {member.user.avatar_url ? (
            <img
              src={member.user.avatar_url}
              alt={member.user.username}
              className="w-10 h-10 rounded-full ring-2 ring-background"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
              {member.user.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{member.user.full_name}</span>
              {isCurrentUser && (
                <Badge variant="outline" className="text-xs">You</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              @{member.user.username}
            </p>
          </div>
        </div>

        {/* Role Badge & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge 
            variant="secondary" 
            className={`gap-1 ${roleConfig.bgColor} ${roleConfig.color}`}
          >
            {getRoleIcon(member.role)}
            {roleConfig.label}
          </Badge>

          {canEdit && member.role !== "OWNER" && (
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
                  disabled={member.role === "ADMIN"}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Make Admin
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleRoleChange("REVIEWER")}
                  disabled={member.role === "REVIEWER"}
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
        <span className="flex items-center gap-1">
          <Mail className="h-3.5 w-3.5" />
          {member.user.email}
        </span>
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

export const TeamTab = memo(({
  members,
  isLoading,
  currentUserId,
  currentUserRole,
  onInviteMember,
  onUpdateRole,
  onRemoveMember,
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
    </div>
  );
});

TeamTab.displayName = "TeamTab";
