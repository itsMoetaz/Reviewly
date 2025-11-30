import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { repositoryService } from "@/core/services/repositoryService";
import type { PullRequestsQueryParams } from "@/core/interfaces/repository.interface";

export type PRState = "open" | "closed" | "merged" | "all";

interface UsePullRequestsOptions {
  initialState?: PRState;
  initialPage?: number;
  perPage?: number;
}

/**
 * Hook for fetching and managing pull requests with filtering and pagination
 */
export const usePullRequests = (
  projectId: number,
  options: UsePullRequestsOptions = {}
) => {
  const { initialState = "open", initialPage = 1, perPage = 20 } = options;

  const [state, setState] = useState<PRState>(initialState);
  const [page, setPage] = useState(initialPage);

  const queryParams: PullRequestsQueryParams = {
    state,
    page,
    per_page: perPage,
  };

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["project", projectId, "pull-requests", queryParams],
    queryFn: async () => {
      const result = await repositoryService.getPullRequests(projectId, queryParams);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data!;
    },
    enabled: !!projectId && projectId > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes (PRs change more often)
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });

  // Filter handlers
  const handleStateChange = useCallback((newState: PRState) => {
    setState(newState);
    setPage(1); // Reset to first page on filter change
  }, []);

  // Pagination handlers
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const goToNextPage = useCallback(() => {
    if (data && page < Math.ceil(data.total / perPage)) {
      setPage((p) => p + 1);
    }
  }, [data, page, perPage]);

  const goToPreviousPage = useCallback(() => {
    if (page > 1) {
      setPage((p) => p - 1);
    }
  }, [page]);

  return {
    // Data
    pullRequests: data?.pull_requests || [],
    total: data?.total || 0,
    
    // Pagination
    page,
    perPage,
    totalPages: data ? Math.ceil(data.total / perPage) : 0,
    hasNextPage: data ? page < Math.ceil(data.total / perPage) : false,
    hasPreviousPage: page > 1,
    
    // Filter state
    state,
    
    // Loading states
    isLoading,
    isFetching,
    error: error as Error | null,
    
    // Actions
    setState: handleStateChange,
    setPage: handlePageChange,
    goToNextPage,
    goToPreviousPage,
    refetch,
  };
};
