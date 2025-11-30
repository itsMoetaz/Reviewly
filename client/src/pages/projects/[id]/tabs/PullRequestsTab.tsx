import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  GitPullRequest, 
  GitMerge, 
  GitPullRequestClosed,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PullRequestSummary } from "@/core/interfaces/repository.interface";
import type { PRState } from "../hooks/usePullRequests";

interface PullRequestsTabProps {
  projectId: number;
  pullRequests: PullRequestSummary[];
  isLoading: boolean;
  isFetching: boolean;
  state: PRState;
  page: number;
  totalPages: number;
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onStateChange: (state: PRState) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
}

const stateFilters: { value: PRState; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "merged", label: "Merged" },
  { value: "all", label: "All" },
];

const getPRStateIcon = (state: string) => {
  switch (state.toLowerCase()) {
    case "open":
    case "opened":
      return <GitPullRequest className="h-4 w-4 text-green-600" />;
    case "merged":
      return <GitMerge className="h-4 w-4 text-purple-600" />;
    case "closed":
      return <GitPullRequestClosed className="h-4 w-4 text-red-600" />;
    default:
      return <GitPullRequest className="h-4 w-4" />;
  }
};

const getPRStateBadge = (state: string) => {
  switch (state.toLowerCase()) {
    case "open":
    case "opened":
      return (
        <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-500/20">
          Open
        </Badge>
      );
    case "merged":
      return (
        <Badge className="bg-purple-500/15 text-purple-600 hover:bg-purple-500/25 border-purple-500/20">
          Merged
        </Badge>
      );
    case "closed":
      return (
        <Badge className="bg-red-500/15 text-red-600 hover:bg-red-500/25 border-red-500/20">
          Closed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{state}</Badge>;
  }
};

const PRListItem = memo(({ 
  pr, 
  onClick 
}: { 
  pr: PullRequestSummary; 
  onClick: () => void;
}) => {
  const timeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }, []);

  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-left group"
    >
      <div className="flex items-start gap-4">
        {/* State Icon */}
        <div className="pt-1">
          {getPRStateIcon(pr.state)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {pr.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                #{pr.number} opened {timeAgo(pr.created_at)} by{" "}
                <span className="font-medium">{pr.author}</span>
              </p>
            </div>
            {getPRStateBadge(pr.state)}
          </div>

          {/* Branches */}
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <code className="px-1.5 py-0.5 rounded bg-muted font-mono">
              {pr.source_branch}
            </code>
            <span>→</span>
            <code className="px-1.5 py-0.5 rounded bg-muted font-mono">
              {pr.target_branch}
            </code>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            {pr.commits_count !== undefined && (
              <span className="flex items-center gap-1">
                <GitMerge className="h-3.5 w-3.5" />
                {pr.commits_count} commits
              </span>
            )}
            {pr.changed_files_count !== undefined && (
              <span className="flex items-center gap-1">
                <FolderOpen className="h-3.5 w-3.5" />
                {pr.changed_files_count} files
              </span>
            )}
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {pr.comments_count} comments
            </span>
            {(pr.additions !== undefined || pr.deletions !== undefined) && (
              <span>
                <span className="text-green-600">+{pr.additions || 0}</span>
                {" / "}
                <span className="text-red-600">-{pr.deletions || 0}</span>
              </span>
            )}
          </div>
        </div>

        {/* Author Avatar */}
        {pr.author_avatar && (
          <img
            src={pr.author_avatar}
            alt={pr.author}
            className="w-8 h-8 rounded-full ring-2 ring-background"
          />
        )}
      </div>
    </button>
  );
});

PRListItem.displayName = "PRListItem";

export const PullRequestsTab = memo(({
  projectId,
  pullRequests,
  isLoading,
  isFetching,
  state,
  page,
  totalPages,
  total,
  hasNextPage,
  hasPreviousPage,
  onStateChange,
  onNextPage,
  onPreviousPage,
}: PullRequestsTabProps) => {
  const navigate = useNavigate();

  const handlePRClick = useCallback((prNumber: number) => {
    navigate(`/projects/${projectId}/pr/${prNumber}`);
  }, [navigate, projectId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-20" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {stateFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={state === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => onStateChange(filter.value)}
              className="h-8"
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {isFetching && !isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating...
          </div>
        )}
      </div>

      {/* PR List */}
      {pullRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border rounded-xl bg-muted/20">
          <div className="p-4 rounded-full bg-muted mb-4">
            <GitPullRequest className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium mb-2">No pull requests found</p>
          <p className="text-sm text-muted-foreground text-center">
            {state === "open" 
              ? "There are no open pull requests at the moment."
              : `No ${state} pull requests found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pullRequests.map((pr) => (
            <PRListItem 
              key={pr.number} 
              pr={pr} 
              onClick={() => handlePRClick(pr.number)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Showing page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPreviousPage}
              disabled={!hasPreviousPage}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={!hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

PullRequestsTab.displayName = "PullRequestsTab";
