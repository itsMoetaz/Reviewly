import { useQuery } from "@tanstack/react-query";
import { repositoryService } from "@/core/services/repositoryService";

/**
 * Hook for fetching pull request details
 */
export const usePRDetails = (projectId: number, prNumber: number) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["project", projectId, "pr", prNumber, "details"],
    queryFn: async () => {
      const result = await repositoryService.getPullRequestDetails(projectId, prNumber);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data!;
    },
    enabled: !!projectId && projectId > 0 && !!prNumber && prNumber > 0,
    staleTime: 1000 * 60 * 3, // 3 minutes
  });

  return {
    prDetails: data?.pull_request,
    platform: data?.platform,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
