import { memo } from "react";
import { 
  GitPullRequest, 
  GitBranch, 
  Clock, 
  Activity,
  TrendingUp,
  Users
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectResponseWithStats } from "@/core/interfaces/project.interface";
import type { Branch } from "@/core/interfaces/repository.interface";
import type { ProjectMemberResponse } from "@/core/interfaces/team.interface";

interface OverviewTabProps {
  project?: ProjectResponseWithStats;
  branches: Branch[];
  members: ProjectMemberResponse[];
  isLoading: boolean;
  onNavigateToPRs: () => void;
  onNavigateToBranches: () => void;
  onNavigateToTeam: () => void;
}

export const OverviewTab = memo(({
  project,
  branches,
  members,
  isLoading,
  onNavigateToPRs,
  onNavigateToBranches,
  onNavigateToTeam,
}: OverviewTabProps) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!project) return null;

  const stats = project.stats;
  const lastActivity = stats?.last_activity 
    ? new Date(stats.last_activity).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'No activity yet';

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Open PRs */}
        <button 
          onClick={onNavigateToPRs}
          className="p-6 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-green-500/10">
              <GitPullRequest className="h-5 w-5 text-green-600" />
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold">{stats?.open_prs_count || 0}</p>
            <p className="text-sm text-muted-foreground">Open Pull Requests</p>
          </div>
        </button>

        {/* Total PRs */}
        <button 
          onClick={onNavigateToPRs}
          className="p-6 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <GitPullRequest className="h-5 w-5 text-blue-600" />
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold">{stats?.total_prs_count || 0}</p>
            <p className="text-sm text-muted-foreground">Total Pull Requests</p>
          </div>
        </button>

        {/* Branches */}
        <button 
          onClick={onNavigateToBranches}
          className="p-6 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <GitBranch className="h-5 w-5 text-purple-600" />
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold">{branches.length || stats?.branches_count || 0}</p>
            <p className="text-sm text-muted-foreground">Branches</p>
          </div>
        </button>

        {/* Team Members */}
        <button 
          onClick={onNavigateToTeam}
          className="p-6 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold">{members.length}</p>
            <p className="text-sm text-muted-foreground">Team Members</p>
          </div>
        </button>
      </div>

      {/* Activity & Quick Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Recent Activity</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Last Activity</p>
                <p className="text-xs text-muted-foreground">{lastActivity}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <GitPullRequest className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Closed PRs</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.closed_prs_count || 0} pull requests merged/closed
                </p>
              </div>
            </div>

            <button 
              onClick={onNavigateToPRs}
              className="w-full p-3 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors text-sm text-muted-foreground hover:text-primary"
            >
              View all pull requests →
            </button>
          </div>
        </div>

        {/* Project Info */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Project Information</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Platform</span>
              <span className="text-sm font-medium">{project.platform}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={`text-sm font-medium ${project.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                {project.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm font-medium">
                {new Date(project.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Repository</span>
              <a 
                href={project.repository_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline truncate max-w-[200px]"
              >
                {project.github_repo_owner && project.github_repo_name 
                  ? `${project.github_repo_owner}/${project.github_repo_name}`
                  : 'View Repository'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

OverviewTab.displayName = "OverviewTab";
