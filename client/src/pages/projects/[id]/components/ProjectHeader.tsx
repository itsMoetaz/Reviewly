import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Github, Gitlab, ExternalLink, ArrowLeft, RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectResponseWithStats } from "@/core/interfaces/project.interface";

interface ProjectHeaderProps {
  project?: ProjectResponseWithStats;
  isLoading: boolean;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const ProjectHeader = memo(({ 
  project, 
  isLoading, 
  onRefresh,
  isRefreshing = false 
}: ProjectHeaderProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-6 py-6 max-w-7xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const isGitHub = project.platform === "GITHUB";

  return (
    <div className="border-b border-border bg-card/50">
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          {/* Left: Back + Project Info */}
          <div className="flex items-start gap-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/home")}
              className="shrink-0 mt-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* Platform Icon */}
            <div
              className={`p-3 rounded-xl shrink-0 ${
                isGitHub
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  : "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-500"
              }`}
            >
              {isGitHub ? (
                <Github className="w-6 h-6" />
              ) : (
                <Gitlab className="w-6 h-6" />
              )}
            </div>

            {/* Project Details */}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight truncate">
                  {project.name}
                </h1>
                <Badge
                  variant={project.is_active ? "default" : "secondary"}
                  className={
                    project.is_active
                      ? "bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-500/20"
                      : "bg-gray-500/15 text-gray-600 dark:text-gray-400"
                  }
                >
                  {project.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <p className="text-muted-foreground line-clamp-1">
                {project.description || "No description provided"}
              </p>

              {/* Quick Stats */}
              <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="font-medium">{project.stats?.branches_count || 0}</span>
                  branches
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="font-medium text-green-600">{project.stats?.open_prs_count || 0}</span>
                  open PRs
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="font-medium">{project.stats?.total_prs_count || 0}</span>
                  total PRs
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 lg:shrink-0 ml-14 lg:ml-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href={project.repository_url}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View Repo
              </a>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/projects/${project.id}/settings`)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

ProjectHeader.displayName = "ProjectHeader";
