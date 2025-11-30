import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { projectService } from "../../core/services/projectService";
import { useAuthStore } from "../../store/authStore";

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  githubProjects: number;
  gitlabProjects: number;
  lastActivity: string | null;
}

export const useDashboardData = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthLoading = useAuthStore((state) => state.isLoading);

  const { 
    data: projectsResponse, 
    isLoading: isLoadingProjects, 
    error: projectsError,
    refetch: refetchProjects
  } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.getUserProjects({ per_page: 100 }),
  });

  const projects = projectsResponse?.data?.projects || [];

  // Derive stats from projects - memoized to prevent recalculation on every render
  const stats: DashboardStats = useMemo(() => {
    const sortedByDate = [...projects].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.is_active).length,
      githubProjects: projects.filter(p => p.platform === "GITHUB").length,
      gitlabProjects: projects.filter(p => p.platform === "GITLAB").length,
      lastActivity: sortedByDate.length > 0 ? sortedByDate[0].updated_at : null
    };
  }, [projects]);

  const isLoading = isAuthLoading || isLoadingProjects;
  const error = projectsError;

  return {
    user,
    projects,
    stats,
    isLoading,
    error,
    refetch: refetchProjects
  };
};
