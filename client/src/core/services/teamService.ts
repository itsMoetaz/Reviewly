import { teamApi } from "../api/teamApi";
import type { ServiceResponse, ApiError } from "../interfaces/auth.interface";
import type {
  ProjectMemberResponse,
  ProjectInvitationResponse,
  ProjectMemberRole,
  InviteMemberRequest,
} from "../interfaces/team.interface";

export const teamService = {

  getMembers: async (projectId: number): Promise<ServiceResponse<ProjectMemberResponse[]>> => {
    try {
      const response = await teamApi.getMembers(projectId);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to fetch team members",
      };
    }
  },

  inviteMember: async (
    projectId: number,
    email: string,
    role: ProjectMemberRole
  ): Promise<ServiceResponse<ProjectInvitationResponse>> => {
    try {
      const data: InviteMemberRequest = { email, role };
      const response = await teamApi.inviteMember(projectId, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to invite member",
      };
    }
  },

  updateMemberRole: async (
    projectId: number,
    memberUserId: number,
    newRole: ProjectMemberRole
  ): Promise<ServiceResponse<ProjectMemberResponse>> => {
    try {
      const response = await teamApi.updateMemberRole(projectId, memberUserId, { role: newRole });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to update member role",
      };
    }
  },

  removeMember: async (
    projectId: number,
    memberUserId: number
  ): Promise<ServiceResponse<void>> => {
    try {
      await teamApi.removeMember(projectId, memberUserId);
      return { success: true };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to remove member",
      };
    }
  },


  getInvitations: async (
    projectId: number
  ): Promise<ServiceResponse<ProjectInvitationResponse[]>> => {
    try {
      const response = await teamApi.getInvitations(projectId);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to fetch invitations",
      };
    }
  },

  cancelInvitation: async (
    projectId: number,
    invitationId: number
  ): Promise<ServiceResponse<void>> => {
    try {
      await teamApi.cancelInvitation(projectId, invitationId);
      return { success: true };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to cancel invitation",
      };
    }
  },

  acceptInvitation: async (token: string): Promise<ServiceResponse<ProjectMemberResponse>> => {
    try {
      const response = await teamApi.acceptInvitation({ token });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to accept invitation",
      };
    }
  },

  declineInvitation: async (token: string): Promise<ServiceResponse<void>> => {
    try {
      await teamApi.declineInvitation({ token });
      return { success: true };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to decline invitation",
      };
    }
  },

  // ==================== Permission Helpers ====================

  /**
   * Check if a user has a specific permission based on their role
   */
  hasPermission: (
    userRole: ProjectMemberRole,
    permission: "delete_project" | "manage_members" | "manage_settings" | "review" | "comment" | "view"
  ): boolean => {
    const roleHierarchy: Record<ProjectMemberRole, string[]> = {
      OWNER: ["delete_project", "manage_members", "manage_settings", "review", "comment", "view"],
      ADMIN: ["manage_members", "manage_settings", "review", "comment", "view"],
      REVIEWER: ["review", "comment", "view"],
    };

    return roleHierarchy[userRole]?.includes(permission) || false;
  },

  /**
   * Check if user can edit another member's role
   */
  canEditMember: (
    currentUserRole: ProjectMemberRole,
    targetMemberRole: ProjectMemberRole
  ): boolean => {
    const roleWeight: Record<ProjectMemberRole, number> = {
      OWNER: 4,
      ADMIN: 3,
      REVIEWER: 2,
    };

    // Can only edit members with lower role weight
    // Owners can edit anyone except other owners
    // Admins can edit reviewers and viewers
    return roleWeight[currentUserRole] > roleWeight[targetMemberRole];
  },
};
