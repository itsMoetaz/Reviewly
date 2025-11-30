import axiosInstance from "../../utils/axiosConfig";
import type {
  Comment,
  InlineCommentCreateRequest,
  ReactionCreateRequest,
  CommentsQueryParams,
} from "../interfaces/comment.interface";

const BASE_PATH = "/comments";

export const commentApi = {
  
  getComments: (projectId: number, prNumber: number, params?: CommentsQueryParams) =>
    axiosInstance.get(`${BASE_PATH}/projects/${projectId}/pull-requests/${prNumber}`, { params }),

  createComment: (projectId: number, prNumber: number, data: Comment) =>
    axiosInstance.post(`${BASE_PATH}/projects/${projectId}/pull-requests/${prNumber}`, data),

  createInlineComment: (projectId: number, prNumber: number, data: InlineCommentCreateRequest) =>
    axiosInstance.post(`${BASE_PATH}/projects/${projectId}/pull-requests/${prNumber}/inline`, data),

  updateComment: (commentId: number, data: Comment) =>
    axiosInstance.put(`${BASE_PATH}/${commentId}`, data),

  deleteComment: (commentId: number) =>
    axiosInstance.delete(`${BASE_PATH}/${commentId}`),
  
  addReaction: (commentId: number, data: ReactionCreateRequest) =>
    axiosInstance.post(`${BASE_PATH}/${commentId}/reactions`, data),

  removeReaction: (commentId: number, reactionType: string) =>
    axiosInstance.delete(`${BASE_PATH}/${commentId}/reactions/${reactionType}`),

  getReactions: (commentId: number) =>
    axiosInstance.get(`${BASE_PATH}/${commentId}/reactions`),
  
};
