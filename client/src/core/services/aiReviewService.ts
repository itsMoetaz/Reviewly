import { aiReviewApi } from "../api/aiReviewApi";
import type { ServiceResponse, ApiError } from "../interfaces/auth.interface";
import type {
  AIReviewCreateRequest,
  AIReviewResponse,
  AIReviewWithIssues,
} from "../interfaces/aiReview.interface";

export const aiReviewService = {

  createReview: async (
    projectId: number,
    prNumber: number,
    options?: AIReviewCreateRequest
  ): Promise<ServiceResponse<AIReviewResponse>> => {
    try {
      const response = await aiReviewApi.createReview(projectId, prNumber, options);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to create AI review",
      };
    }
  },

  getReview: async (reviewId: number): Promise<ServiceResponse<AIReviewWithIssues>> => {
    try {
      const response = await aiReviewApi.getReview(reviewId);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to fetch AI review",
      };
    }
  },

  getReviewsForPR: async (
    projectId: number,
    prNumber: number
  ): Promise<ServiceResponse<AIReviewResponse[]>> => {
    try {
      const response = await aiReviewApi.getReviewsForPR(projectId, prNumber);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to fetch AI reviews",
      };
    }
  },

  deleteReview: async (reviewId: number): Promise<ServiceResponse<void>> => {
    try {
      await aiReviewApi.deleteReview(reviewId);
      return { success: true };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to delete AI review",
      };
    }
  },

  // ==================== Polling Helper ====================

  /**
   * Poll for review completion
   * Useful when waiting for AI processing to finish
   */
  pollReviewUntilComplete: async (
    reviewId: number,
    options?: {
      maxAttempts?: number;
      intervalMs?: number;
      onProgress?: (review: AIReviewWithIssues) => void;
    }
  ): Promise<ServiceResponse<AIReviewWithIssues>> => {
    const { maxAttempts = 30, intervalMs = 2000, onProgress } = options || {};
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await aiReviewService.getReview(reviewId);
      
      if (!result.success) {
        return result;
      }

      const review = result.data!;
      
      if (onProgress) {
        onProgress(review);
      }

      if (review.status === "completed" || review.status === "failed") {
        return result;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return {
      success: false,
      error: "Review processing timed out. Please check back later.",
    };
  },
};
