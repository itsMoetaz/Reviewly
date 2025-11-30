// ==================== Role Types ====================

export type ProjectMemberRole = "OWNER" | "ADMIN" | "REVIEWER";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export interface RoleConfig {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  permissions: string[];
}

export const ROLE_CONFIG: Record<ProjectMemberRole, RoleConfig> = {
  OWNER: {
    label: "Owner",
    description: "Full access, can delete project",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
    permissions: ["delete_project", "manage_members", "manage_settings", "review", "comment", "view"],
  },
  ADMIN: {
    label: "Admin",
    description: "Can manage members and settings",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    permissions: ["manage_members", "manage_settings", "review", "comment", "view"],
  },
  REVIEWER: {
    label: "Reviewer",
    description: "Can review code and comment",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10",
    permissions: ["review", "comment", "view"],
  },
};

// ==================== Request Interfaces ====================

export interface InviteMemberRequest {
  email: string;
  role: ProjectMemberRole;
}

export interface UpdateMemberRoleRequest {
  role: ProjectMemberRole;
}

export interface AcceptInvitationRequest {
  token: string;
}

// ==================== Response Interfaces ====================

export interface ProjectMemberUser {
  id: number;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

export interface ProjectMemberResponse {
  id: number;
  user_id: number;
  project_id: number;
  role: ProjectMemberRole;
  joined_at: string;
  user: ProjectMemberUser;
}

export interface ProjectInvitationResponse {
  id: number;
  project_id: number;
  email: string;
  role: ProjectMemberRole;
  status: InvitationStatus;
  invited_by: number;
  invited_at: string;
  expires_at: string;
  inviter_name?: string;
}

// ==================== UI Helper Types ====================

export interface TeamMemberWithActions extends ProjectMemberResponse {
  canEdit: boolean;
  canRemove: boolean;
}
