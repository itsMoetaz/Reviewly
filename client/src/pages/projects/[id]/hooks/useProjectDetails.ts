import { useQuery } from "@tanstack/react-query";
import { projectService } from "@/core/services/projectService";
import { repositoryService } from "@/core/services/repositoryService";
import { teamService } from "@/core/services/teamService";

/**
 * Main hook for fetching project details and related data
 */
export const useProjectDetails = (projectId: number) => {
  // Fetch project details with stats
  const {
    data: projectData,
    isLoading: isProjectLoading,
    error: projectError,
    refetch: refetchProject,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const result = await projectService.getById(projectId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data!;
    },
    enabled: !!projectId && projectId > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch branches (lazy - only when project is loaded)
  const {
    data: branchesData,
    isLoading: isBranchesLoading,
    refetch: refetchBranches,
  } = useQuery({
    queryKey: ["project", projectId, "branches"],
    queryFn: async () => {
      const result = await repositoryService.getBranches(projectId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data!;
    },
    enabled: !!projectData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch team members
  const {
    data: membersData,
    isLoading: isMembersLoading,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ["project", projectId, "members"],
    queryFn: async () => {
      const result = await teamService.getMembers(projectId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data!;
    },
    enabled: !!projectData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const refetchAll = () => {
    refetchProject();
    refetchBranches();
    refetchMembers();
  };

  return {
    // Project
    project: projectData,
    isProjectLoading,
    projectError: projectError as Error | null,

    // Branches
    branches: branchesData?.branches || [],
    isBranchesLoading,

    // Members
    members: membersData || [],
    isMembersLoading,

    // Actions
    refetchProject,
    refetchBranches,
    refetchMembers,
    refetchAll,

    // Combined loading state
    isLoading: isProjectLoading,
  };
};
