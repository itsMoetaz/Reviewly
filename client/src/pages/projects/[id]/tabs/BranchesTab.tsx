import { memo, useMemo, useState } from "react";
import { GitBranch, Shield, Search, Clock, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Branch } from "@/core/interfaces/repository.interface";

interface BranchesTabProps {
  branches: Branch[];
  isLoading: boolean;
  defaultBranch?: string;
}

export const BranchesTab = memo(({ 
  branches, 
  isLoading,
  defaultBranch = "main"
}: BranchesTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showProtectedOnly, setShowProtectedOnly] = useState(false);

  const filteredBranches = useMemo(() => {
    let result = branches;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => b.name.toLowerCase().includes(query));
    }

    if (showProtectedOnly) {
      result = result.filter(b => b.protected);
    }

    // Sort: default branch first, then protected, then alphabetically
    return result.sort((a, b) => {
      if (a.name === defaultBranch) return -1;
      if (b.name === defaultBranch) return 1;
      if (a.protected && !b.protected) return -1;
      if (!a.protected && b.protected) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [branches, searchQuery, showProtectedOnly, defaultBranch]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1 max-w-sm" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const protectedCount = branches.filter(b => b.protected).length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search branches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Button
          variant={showProtectedOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowProtectedOnly(!showProtectedOnly)}
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          Protected ({protectedCount})
        </Button>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{filteredBranches.length} branches</span>
        {filteredBranches.length < branches.length && (
          <span>(filtered from {branches.length})</span>
        )}
      </div>

      {/* Branch List */}
      {filteredBranches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border rounded-xl bg-muted/20">
          <div className="p-4 rounded-full bg-muted mb-4">
            <GitBranch className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium mb-2">No branches found</p>
          <p className="text-sm text-muted-foreground text-center">
            {searchQuery 
              ? "Try a different search term."
              : "No branches available for this repository."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredBranches.map((branch) => {
            const isDefault = branch.name === defaultBranch;
            const commitDate = branch.commit.date 
              ? new Date(branch.commit.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : null;

            return (
              <div
                key={branch.name}
                className={`p-4 rounded-xl border bg-card transition-colors ${
                  isDefault 
                    ? 'border-primary/30 bg-primary/5' 
                    : 'border-border hover:border-primary/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg ${
                      isDefault 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <GitBranch className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{branch.name}</span>
                        {isDefault && (
                          <Badge variant="outline" className="text-xs">
                            default
                          </Badge>
                        )}
                        {branch.protected && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            protected
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                        {branch.commit.sha.slice(0, 7)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Commit Info */}
                {(branch.commit.message || commitDate) && (
                  <div className="mt-3 pt-3 border-t border-border space-y-1">
                    {branch.commit.message && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {branch.commit.message}
                      </p>
                    )}
                    {commitDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {commitDate}
                        {branch.commit.author && (
                          <span className="ml-1">by {branch.commit.author}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

BranchesTab.displayName = "BranchesTab";
