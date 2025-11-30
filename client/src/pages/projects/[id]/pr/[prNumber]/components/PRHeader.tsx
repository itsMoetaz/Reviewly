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
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 max-w-7xl">
        <div className="flex flex-col gap-4">
          {/* Top row: Back + State Icon + Title + Badge */}
          <div className="flex items-start gap-2 sm:gap-4 min-w-0">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/projects/${projectId}`)}
              className="shrink-0 h-8 w-8 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* State Icon */}
            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl shrink-0 ${stateConfig.className}`}>
              <StateIcon className={`w-4 h-4 sm:w-6 sm:h-6 ${stateConfig.iconColor}`} />
            </div>

            {/* PR Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start sm:items-center gap-2 flex-wrap mb-1">
                <h1 className="text-base sm:text-xl font-bold tracking-tight line-clamp-2 sm:line-clamp-1">
                  {prDetails.title}
                </h1>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${stateConfig.className}`}>
                    {stateConfig.label}
                  </Badge>
                  {prDetails.work_in_progress && (
                    <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-500/30">
                      WIP
                    </Badge>
                  )}
                </div>
              </div>

              {/* Branch info - hidden on very small screens */}
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                <span className="font-mono">#{prDetails.number}</span>
                {" · "}
                <code className="px-1 sm:px-1.5 py-0.5 rounded bg-muted text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-none inline-block align-middle">
                  {prDetails.source_branch}
                </code>
                {" → "}
                <code className="px-1 sm:px-1.5 py-0.5 rounded bg-muted text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-none inline-block align-middle">
                  {prDetails.target_branch}
                </code>
              </p>

              {/* Meta Info */}
              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1 sm:gap-1.5">
                  {prDetails.author.avatar_url ? (
                    <img 
                      src={prDetails.author.avatar_url} 
                      alt={prDetails.author.username}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full"
                    />
                  ) : (
                    <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                  <span className="font-medium truncate max-w-[100px] sm:max-w-none">{prDetails.author.username}</span>
                </span>
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">opened</span> {timeAgo(prDetails.created_at)}
                </span>
                {prDetails.merged_at && (
                  <span className="flex items-center gap-1 sm:gap-1.5 text-purple-600">
                    <GitMerge className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">merged</span> {timeAgo(prDetails.merged_at)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions - Full width on mobile */}
          {prUrl && (
            <div className="flex items-center gap-2 ml-10 sm:ml-14 lg:ml-0 lg:absolute lg:right-6 lg:top-6">
              <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
                <a href={prUrl} target="_blank" rel="noopener noreferrer" className="gap-1.5 sm:gap-2">
                  <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">View on {platform === "GITLAB" ? "GitLab" : "GitHub"}</span>
                  <span className="xs:hidden">{platform === "GITLAB" ? "GitLab" : "GitHub"}</span>
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

PRHeader.displayName = "PRHeader";
