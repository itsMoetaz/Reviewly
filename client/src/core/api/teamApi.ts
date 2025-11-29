import axiosInstance from "../../utils/axiosConfig";
import type {
  InviteMemberRequest,
  UpdateMemberRoleRequest,
  AcceptInvitationRequest,
} from "../interfaces/team.interface";

const BASE_PATH = "/projects";

export const teamApi = {

  getMembers: (projectId: number) =>
    axiosInstance.get(`${BASE_PATH}/${projectId}/members`),

  inviteMember: (projectId: number, data: InviteMemberRequest) =>
    axiosInstance.post(`${BASE_PATH}/${projectId}/members/invite`, data),

  updateMemberRole: (projectId: number, memberUserId: number, data: UpdateMemberRoleRequest) =>
    axiosInstance.patch(`${BASE_PATH}/${projectId}/members/${memberUserId}`, data),

  removeMember: (projectId: number, memberUserId: number) =>
    axiosInstance.delete(`${BASE_PATH}/${projectId}/members/${memberUserId}`),

  getInvitations: (projectId: number) =>
    axiosInstance.get(`${BASE_PATH}/${projectId}/invitations`),

  cancelInvitation: (projectId: number, invitationId: number) =>
    axiosInstance.delete(`${BASE_PATH}/${projectId}/invitations/${invitationId}`),

  acceptInvitation: (data: AcceptInvitationRequest) =>
    axiosInstance.post(`${BASE_PATH}/invitations/accept`, data),

  declineInvitation: (data: AcceptInvitationRequest) =>
    axiosInstance.post(`${BASE_PATH}/invitations/decline`, data),
};
