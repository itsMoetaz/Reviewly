import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  GitPullRequest, 
  GitMerge, 
  GitPullRequestClosed,
  ExternalLink,
  Clock,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PullRequestDetails } from "@/core/interfaces/repository.interface";

interface PRHeaderProps {
  prDetails?: PullRequestDetails;
  projectId: number;
  platform?: "GITHUB" | "GITLAB";
  repositoryUrl?: string;
  isLoading: boolean;
}

const getPRStateConfig = (state: string) => {
  switch (state.toLowerCase()) {
    case "open":
    case "opened":
      return {
        icon: GitPullRequest,
        label: "Open",
        className: "bg-green-500/15 text-green-600 border-green-500/20",
        iconColor: "text-green-600",
      };
    case "merged":
      return {
        icon: GitMerge,
        label: "Merged",
        className: "bg-purple-500/15 text-purple-600 border-purple-500/20",
        iconColor: "text-purple-600",
      };
    case "closed":
      return {
        icon: GitPullRequestClosed,
        label: "Closed",
        className: "bg-red-500/15 text-red-600 border-red-500/20",
        iconColor: "text-red-600",
      };
    default:
      return {
        icon: GitPullRequest,
        label: state,
        className: "bg-gray-500/15 text-gray-600",
        iconColor: "text-gray-600",
      };
  }
};

export const PRHeader = memo(({ 
  prDetails, 
  projectId, 
  platform,
  repositoryUrl,
  isLoading 
}: PRHeaderProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-6 py-6 max-w-7xl">
          <div className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!prDetails) return null;

  const stateConfig = getPRStateConfig(prDetails.state);
  const StateIcon = stateConfig.icon;

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const prUrl = repositoryUrl 
    ? `${repositoryUrl}/${platform === "GITLAB" ? "-/merge_requests" : "pull"}/${prDetails.number}`
    : null;

  return (
    <div className="border-b border-border bg-card/50">
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          {/* Left: Back + PR Info */}
          <div className="flex items-start gap-4 min-w-0 flex-1">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/projects/${projectId}`)}
              className="shrink-0 mt-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* State Icon */}
            <div className={`p-3 rounded-xl shrink-0 ${stateConfig.className}`}>
              <StateIcon className={`w-6 h-6 ${stateConfig.iconColor}`} />
            </div>

            {/* PR Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-xl font-bold tracking-tight">
                  {prDetails.title}
                </h1>
                <Badge className={stateConfig.className}>
                  {stateConfig.label}
                </Badge>
                {prDetails.work_in_progress && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-500/30">
                    WIP
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                <span className="font-mono">#{prDetails.number}</span>
                {" · "}
                <code className="px-1.5 py-0.5 rounded bg-muted text-xs">
                  {prDetails.source_branch}
                </code>
                {" → "}
                <code className="px-1.5 py-0.5 rounded bg-muted text-xs">
                  {prDetails.target_branch}
                </code>
              </p>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5">
                  {prDetails.author.avatar_url ? (
                    <img 
                      src={prDetails.author.avatar_url} 
                      alt={prDetails.author.username}
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="font-medium">{prDetails.author.username}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  opened {timeAgo(prDetails.created_at)}
                </span>
                {prDetails.merged_at && (
                  <span className="flex items-center gap-1.5 text-purple-600">
                    <GitMerge className="w-4 h-4" />
                    merged {timeAgo(prDetails.merged_at)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 ml-14 lg:ml-0 shrink-0">
            {prUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={prUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View on {platform === "GITLAB" ? "GitLab" : "GitHub"}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

PRHeader.displayName = "PRHeader";
