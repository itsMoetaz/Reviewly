import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useEffect, useRef } from "react";
import { aiReviewService } from "@/core/services/aiReviewService";
import type { AIReviewCreateRequest, AIReviewResponse, AIReviewWithIssues, ReviewStatus } from "@/core/interfaces/aiReview.interface";

/**
 * Hook for managing AI reviews for a pull request
 */
export const useAIReview = (projectId: number, prNumber: number) => {
  const queryClient = useQueryClient();
  const [pollingReviewId, setPollingReviewId] = useState<number | null>(null);
  const [isRerunning, setIsRerunning] = useState(false);
  // Flag to prevent auto-select during rerun
  const isRerunningRef = useRef(false);

  // Fetch existing reviews for this PR
  const {
    data: reviews,
    isLoading: isLoadingReviews,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ["project", projectId, "pr", prNumber, "ai-reviews"],
    queryFn: async () => {
      const result = await aiReviewService.getReviewsForPR(projectId, prNumber);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data!;
    },
    enabled: !!projectId && projectId > 0 && !!prNumber && prNumber > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Fetch a specific review with issues (for detailed view)
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  
  const {
    data: selectedReview,
    isLoading: isLoadingSelectedReview,
    refetch: refetchSelectedReview,
  } = useQuery({
    queryKey: ["ai-review", selectedReviewId],
    queryFn: async () => {
      if (!selectedReviewId) return null;
      const result = await aiReviewService.getReview(selectedReviewId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data!;
    },
    enabled: !!selectedReviewId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    // Poll if review is processing
    refetchInterval: (query) => {
      const data = query.state.data as AIReviewWithIssues | null | undefined;
      if (data && (data.status === "pending" || data.status === "processing")) {
        return 3000; // Poll every 3 seconds
      }
      return false;
    },
  });

  // Create new review mutation
  const createReviewMutation = useMutation({
    mutationFn: async (options?: AIReviewCreateRequest) => {
      const result = await aiReviewService.createReview(projectId, prNumber, options);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data!;
    },
    onSuccess: (data) => {
      // Start polling the new review
      setSelectedReviewId(data.id);
      setPollingReviewId(data.id);
      // Invalidate reviews list
      queryClient.invalidateQueries({ 
        queryKey: ["project", projectId, "pr", prNumber, "ai-reviews"] 
      });
    },
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      const result = await aiReviewService.deleteReview(reviewId);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["project", projectId, "pr", prNumber, "ai-reviews"] 
      });
      if (selectedReviewId) {
        setSelectedReviewId(null);
      }
    },
  });

  // Re-run review (delete old one first, then create new)
  const rerunReview = useCallback(async (_existingReview?: AIReviewResponse | null, options?: AIReviewCreateRequest) => {
    setIsRerunning(true);
    isRerunningRef.current = true;
    
    try {
      // First, clear selected review to stop polling
      setSelectedReviewId(null);
      setPollingReviewId(null);
      
      // Fetch the latest reviews to make sure we have current data
      const latestReviewsResult = await aiReviewService.getReviewsForPR(projectId, prNumber);
      const latestReviews = latestReviewsResult.success ? latestReviewsResult.data || [] : [];
      
      // Cancel and remove all existing review queries BEFORE deleting from backend
      // This stops any polling that might be happening
      for (const review of latestReviews) {
        await queryClient.cancelQueries({ queryKey: ["ai-review", review.id] });
        queryClient.removeQueries({ queryKey: ["ai-review", review.id] });
      }
      
      // Clear the reviews list cache immediately to prevent useEffect from re-selecting old reviews
      queryClient.setQueryData(["project", projectId, "pr", prNumber, "ai-reviews"], []);
      
      // Delete ALL reviews for this PR sequentially and wait for each to complete
      // The backend will only allow deleting reviews owned by the current user
      for (const review of latestReviews) {
        const deleteResult = await aiReviewService.deleteReview(review.id);
        if (deleteResult.success) {
        } else {
          // Log but continue - this review might belong to another user
          console.warn(`Could not delete review ${review.id}: ${deleteResult.error}`);
        }
      }
      
      // Wait for backend to fully process the deletes before creating new review
      await new Promise(resolve => setTimeout(resolve, 300));

      // Create new review
      const createResult = await aiReviewService.createReview(projectId, prNumber, options);
      if (!createResult.success) {
        throw new Error(createResult.error);
      }

      // Start polling the new review and auto-select it
      setSelectedReviewId(createResult.data!.id);
      setPollingReviewId(createResult.data!.id);
      
      // Invalidate reviews list to fetch fresh data
      queryClient.invalidateQueries({ 
        queryKey: ["project", projectId, "pr", prNumber, "ai-reviews"] 
      });

      return createResult.data!;
    } finally {
      setIsRerunning(false);
      isRerunningRef.current = false;
    }
  }, [projectId, prNumber, queryClient]);

  // Select the latest review automatically
  const latestReview = reviews?.length ? reviews[0] : null;

  // Auto-select the latest review when reviews are loaded and nothing is selected
  // Skip during rerun to prevent selecting deleted reviews
  useEffect(() => {
    if (isRerunningRef.current) return;
    if (latestReview && !selectedReviewId) {
      setSelectedReviewId(latestReview.id);
    }
  }, [latestReview, selectedReviewId]);

  // Helper to select a review
  const selectReview = useCallback((reviewId: number | null) => {
    setSelectedReviewId(reviewId);
  }, []);

  // Get review status for UI
  const getReviewStatus = useCallback((status: ReviewStatus) => {
    switch (status) {
      case "pending":
        return { label: "Pending", color: "text-yellow-600", bgColor: "bg-yellow-500/10" };
      case "processing":
        return { label: "Processing", color: "text-blue-600", bgColor: "bg-blue-500/10" };
      case "completed":
        return { label: "Completed", color: "text-green-600", bgColor: "bg-green-500/10" };
      case "failed":
        return { label: "Failed", color: "text-red-600", bgColor: "bg-red-500/10" };
      default:
        return { label: status, color: "text-gray-600", bgColor: "bg-gray-500/10" };
    }
  }, []);

  return {
    // Reviews list
    reviews: reviews || [],
    isLoadingReviews,
    refetchReviews,
    latestReview,

    // Selected review
    selectedReview,
    selectedReviewId,
    isLoadingSelectedReview,
    selectReview,
    refetchSelectedReview,

    // Mutations
    createReview: createReviewMutation.mutate,
    isCreatingReview: createReviewMutation.isPending,
    createReviewError: createReviewMutation.error,

    deleteReview: deleteReviewMutation.mutate,
    isDeletingReview: deleteReviewMutation.isPending,

    // Re-run review (delete + create)
    rerunReview,
    isRerunning,

    // Helpers
    getReviewStatus,
    isPolling: pollingReviewId !== null && 
      (selectedReview?.status === "pending" || selectedReview?.status === "processing"),
  };
};
