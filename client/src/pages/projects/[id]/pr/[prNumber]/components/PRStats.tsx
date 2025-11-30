import { memo } from "react";
import { GitCommit, FileCode, Plus, Minus, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PullRequestStats } from "@/core/interfaces/repository.interface";

interface PRStatsProps {
  stats?: PullRequestStats;
  isLoading: boolean;
}

export const PRStats = memo(({ stats, isLoading }: PRStatsProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-6 p-4 rounded-xl border border-border bg-card">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-24" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="flex items-center gap-6 p-4 rounded-xl border border-border bg-card flex-wrap">
      {/* Commits */}
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <GitCommit className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-lg font-bold">{stats.total_commits}</p>
          <p className="text-xs text-muted-foreground">Commits</p>
        </div>
      </div>

      {/* Files Changed */}
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-purple-500/10">
          <FileCode className="h-4 w-4 text-purple-600" />
        </div>
        <div>
          <p className="text-lg font-bold">{stats.changed_files}</p>
          <p className="text-xs text-muted-foreground">Files</p>
        </div>
      </div>

      {/* Additions */}
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-green-500/10">
          <Plus className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <p className="text-lg font-bold text-green-600">+{stats.total_additions}</p>
          <p className="text-xs text-muted-foreground">Additions</p>
        </div>
      </div>

      {/* Deletions */}
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-red-500/10">
          <Minus className="h-4 w-4 text-red-600" />
        </div>
        <div>
          <p className="text-lg font-bold text-red-600">-{stats.total_deletions}</p>
          <p className="text-xs text-muted-foreground">Deletions</p>
        </div>
      </div>

      {/* Total Changes */}
      <div className="flex items-center gap-2 ml-auto">
        <div className="p-2 rounded-lg bg-muted">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-lg font-bold">{stats.total_changes}</p>
          <p className="text-xs text-muted-foreground">Total Changes</p>
        </div>
      </div>
    </div>
  );
});

PRStats.displayName = "PRStats";
