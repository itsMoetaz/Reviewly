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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:items-center gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 rounded-xl border border-border bg-card">
      {/* Commits */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10">
          <GitCommit className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-base sm:text-lg font-bold">{stats.total_commits}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Commits</p>
        </div>
      </div>

      {/* Files Changed */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/10">
          <FileCode className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
        </div>
        <div>
          <p className="text-base sm:text-lg font-bold">{stats.changed_files}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Files</p>
        </div>
      </div>

      {/* Additions */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10">
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
        </div>
        <div>
          <p className="text-base sm:text-lg font-bold text-green-600">+{stats.total_additions}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Additions</p>
        </div>
      </div>

      {/* Deletions */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/10">
          <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600" />
        </div>
        <div>
          <p className="text-base sm:text-lg font-bold text-red-600">-{stats.total_deletions}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Deletions</p>
        </div>
      </div>

      {/* Total Changes */}
      <div className="flex items-center gap-2 col-span-2 sm:col-span-1 lg:ml-auto">
        <div className="p-1.5 sm:p-2 rounded-lg bg-muted">
          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-base sm:text-lg font-bold">{stats.total_changes}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Total Changes</p>
        </div>
      </div>
    </div>
  );
});

PRStats.displayName = "PRStats";
