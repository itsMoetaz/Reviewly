import { commentApi } from "../api/commentApi";
import type { ServiceResponse, ApiError } from "../interfaces/auth.interface";
import type {
  CommentResponse,
  CommentsListResponse,
  CommentsQueryParams,
  Comment,
  InlineCommentCreateRequest,
  ReactionResponse,
  ReactionsSummary,
  ReactionType,
} from "../interfaces/comment.interface";

export const commentService = {

  getComments: async (
    projectId: number,
    prNumber: number,
    params?: CommentsQueryParams
  ): Promise<ServiceResponse<CommentsListResponse>> => {
    try {
      const response = await commentApi.getComments(projectId, prNumber, params);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to fetch comments",
      };
    }
  },

  createComment: async (
    projectId: number,
    prNumber: number,
    commentText: string
  ): Promise<ServiceResponse<CommentResponse>> => {
    try {
      const data: Comment = { comment_text: commentText };
      const response = await commentApi.createComment(projectId, prNumber, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to create comment",
      };
    }
  },

  createInlineComment: async (
    projectId: number,
    prNumber: number,
    data: Omit<InlineCommentCreateRequest, "comment_text"> & { commentText: string }
  ): Promise<ServiceResponse<CommentResponse>> => {
    try {
      const payload: InlineCommentCreateRequest = {
        comment_text: data.commentText,
        commit_sha: data.commit_sha,
        file_path: data.file_path,
        line_number: data.line_number,
        line_end: data.line_end,
      };
      const response = await commentApi.createInlineComment(projectId, prNumber, payload);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to create inline comment",
      };
    }
  },

  updateComment: async (
    commentId: number,
    commentText: string
  ): Promise<ServiceResponse<CommentResponse>> => {
    try {
      const data: Comment = { comment_text: commentText };
      const response = await commentApi.updateComment(commentId, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to update comment",
      };
    }
  },

  deleteComment: async (commentId: number): Promise<ServiceResponse<void>> => {
    try {
      await commentApi.deleteComment(commentId);
      return { success: true };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to delete comment",
      };
    }
  },

  addReaction: async (
    commentId: number,
    reactionType: ReactionType
  ): Promise<ServiceResponse<ReactionResponse>> => {
    try {
      const response = await commentApi.addReaction(commentId, { reaction_type: reactionType });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to add reaction",
      };
    }
  },

  removeReaction: async (
    commentId: number,
    reactionType: ReactionType
  ): Promise<ServiceResponse<void>> => {
    try {
      await commentApi.removeReaction(commentId, reactionType);
      return { success: true };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to remove reaction",
      };
    }
  },

  toggleReaction: async (
    commentId: number,
    reactionType: ReactionType,
    currentUserReactions: ReactionType[]
  ): Promise<ServiceResponse<void>> => {
    const hasReaction = currentUserReactions.includes(reactionType);
    
    if (hasReaction) {
      return commentService.removeReaction(commentId, reactionType);
    } else {
      const result = await commentService.addReaction(commentId, reactionType);
      return { success: result.success, error: result.error };
    }
  },

  getReactions: async (commentId: number): Promise<ServiceResponse<ReactionsSummary>> => {
    try {
      const response = await commentApi.getReactions(commentId);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to fetch reactions",
      };
    }
  },
};
