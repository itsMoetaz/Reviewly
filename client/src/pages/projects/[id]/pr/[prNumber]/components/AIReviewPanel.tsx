import { memo, useState, useMemo } from "react";
import { 
  Sparkles, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Filter,
  FileCode,
  Trash2,
  RefreshCw,
  AlertTriangle,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/components/lib/utils";
import { IssueCard } from "./IssueCard";
import { AIReviewTrigger } from "./AIReviewTrigger";
import type { AIReviewResponse, AIReviewWithIssues, ReviewIssue, IssueSeverity } from "@/core/interfaces/aiReview.interface";
import { SEVERITY_CONFIG } from "@/core/interfaces/aiReview.interface";

interface AIReviewPanelProps {
  reviews: AIReviewResponse[];
  selectedReview: AIReviewWithIssues | null;
  onCreateReview: (reviewType?: string) => void;
  onDeleteReview: (reviewId: number) => void;
  isCreating: boolean;
  isDeleting: boolean;
  isLoading: boolean;
  onNavigateToFile?: (filename: string, line: number) => void;
}

type SeverityFilter = IssueSeverity | "all";

export const AIReviewPanel = memo(({
  reviews,
  selectedReview,
  onCreateReview,
  onDeleteReview,
  isCreating,
  isDeleting,
  isLoading,
  onNavigateToFile,
}: AIReviewPanelProps) => {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [fileFilter, setFileFilter] = useState<string>("all");
  const [selectedIssue, setSelectedIssue] = useState<ReviewIssue | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  // Get unique files from issues
  const uniqueFiles = useMemo(() => {
    if (!selectedReview?.issues) return [];
    const files = new Set(
      selectedReview.issues
        .map((i: ReviewIssue) => i.file_path)
        .filter(Boolean) as string[]
    );
    return Array.from(files);
  }, [selectedReview]);

  // Filter issues
  const filteredIssues = useMemo((): ReviewIssue[] => {
    if (!selectedReview?.issues) return [];
    
    return selectedReview.issues.filter((issue: ReviewIssue) => {
      const matchesSeverity = severityFilter === "all" || issue.severity === severityFilter;
      const matchesFile = fileFilter === "all" || issue.file_path === fileFilter;
      return matchesSeverity && matchesFile;
    });
  }, [selectedReview, severityFilter, fileFilter]);

  // Count issues by severity
  const severityCounts = useMemo((): Record<string, number> => {
    if (!selectedReview?.issues) return {};
    
    return selectedReview.issues.reduce((acc: Record<string, number>, issue: ReviewIssue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [selectedReview]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500/15 text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
      case "processing":
        return (
          <Badge className="bg-yellow-500/15 text-yellow-600">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/15 text-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const hasReviews = reviews.length > 0;
  const latestReview = reviews[0];
  const isPending = latestReview?.status === "pending" || latestReview?.status === "processing";
  const isFailed = selectedReview?.status === "failed";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold flex items-center gap-2 text-sm shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Review
            {selectedReview && (
              <span className="text-muted-foreground font-normal">#{selectedReview.id}</span>
            )}
          </h3>
          <div className="flex-1" />
          <AIReviewTrigger
            onTrigger={onCreateReview}
            isLoading={isCreating}
            hasExistingReview={hasReviews}
            reviewStatus={latestReview?.status}
          />
        </div>
      </div>

      {/* Content */}
      {!hasReviews ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h4 className="font-medium mb-2">No AI Reviews Yet</h4>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            Request an AI-powered code review to get instant feedback on this pull request.
          </p>
          <Button
            onClick={() => onCreateReview()}
            disabled={isCreating}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Start Review
          </Button>
        </div>
      ) : isPending ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <h4 className="font-medium mb-2">Analyzing Code...</h4>
          <p className="text-sm text-muted-foreground max-w-xs">
            Our AI is reviewing your code. This usually takes 15-30 seconds.
          </p>
        </div>
      ) : isFailed && selectedReview ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-full bg-red-500/10 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h4 className="font-medium mb-2">Review Failed</h4>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            {selectedReview.error_message || "An unexpected error occurred while analyzing the code."}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => onCreateReview()}
              disabled={isCreating}
              className="gap-2"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Retry Review
            </Button>
            <Button
              variant="outline"
              onClick={() => onDeleteReview(selectedReview.id)}
              disabled={isDeleting}
              className="gap-2 text-red-600 hover:text-red-700"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      ) : selectedReview ? (
        <>
          {/* Review Status & Actions */}
          <div className="p-3 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              {getStatusBadge(selectedReview.status)}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7" aria-label="Review actions menu">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onCreateReview()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-run Review
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDeleteReview(selectedReview.id)}
                    disabled={isDeleting}
                    className="text-red-600"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    {isDeleting ? "Deleting..." : "Delete Review"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Summary Stats & Filters on same row */}
            {selectedReview.issues && selectedReview.issues.length > 0 && (
              <div className="flex items-center gap-2">
                {/* Severity badges on the left */}
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.entries(SEVERITY_CONFIG).map(([severity, config]) => {
                    const count = severityCounts[severity] || 0;
                    if (count === 0) return null;
                    return (
                      <Badge
                        key={severity}
                        className={cn("text-xs cursor-pointer", config.bg, config.color)}
                        onClick={() => setSeverityFilter(severity as IssueSeverity)}
                      >
                        {count} {config.label}
                      </Badge>
                    );
                  })}
                </div>
                
                {/* Spacer */}
                <div className="flex-1" />
                
                {/* Filters on the right */}
                <div className="flex items-center gap-2 shrink-0">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  
                  {/* Severity Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs" aria-label="Filter issues by severity">
                        {severityFilter === "all" ? "All Severities" : SEVERITY_CONFIG[severityFilter].label}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSeverityFilter("all")}>
                        All Severities
                      </DropdownMenuItem>
                      {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                        <DropdownMenuItem 
                          key={key}
                          onClick={() => setSeverityFilter(key as IssueSeverity)}
                        >
                          {config.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* File Filter */}
                  {uniqueFiles.length > 1 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs min-w-0 max-w-[140px]" aria-label="Filter issues by file">
                          <FileCode className="h-3 w-3 mr-1 shrink-0" />
                          <span className="truncate">
                            {fileFilter === "all" ? "All Files" : fileFilter.split("/").pop()}
                          </span>
                          <ChevronDown className="h-3 w-3 ml-1 shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setFileFilter("all")}>
                          All Files
                        </DropdownMenuItem>
                        {uniqueFiles.map((file) => (
                          <DropdownMenuItem 
                            key={file}
                            onClick={() => setFileFilter(file)}
                          >
                            {file.split("/").pop()}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Issues List */}
          <div className="flex-1 overflow-y-auto p-3 min-h-0">
            {filteredIssues.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <p className="font-medium">Looking Good!</p>
                <p className="text-sm text-muted-foreground">
                  {selectedReview.issues?.length === 0
                    ? "No issues found in this review"
                    : "No issues match the current filters"}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-2">
                  {filteredIssues.map((issue: ReviewIssue, index: number) => (
                    <motion.div
                      key={issue.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <IssueCard
                        issue={issue}
                        isSelected={selectedIssue?.id === issue.id}
                        onSelect={setSelectedIssue}
                        onNavigateToFile={onNavigateToFile}
                      />
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>

          {/* Collapsible Summary */}
          {selectedReview.summary && (
            <div className="border-t border-border">
              <button
                onClick={() => setShowSummary(!showSummary)}
                className="w-full p-2 flex items-center justify-between hover:bg-muted/50 transition-colors"
                aria-expanded={showSummary}
                aria-label={showSummary ? "Hide review summary" : "Show review summary"}
              >
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Summary
                </span>
                {showSummary ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <AnimatePresence>
                {showSummary && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 max-h-32 overflow-y-auto">
                      <p className="text-sm text-muted-foreground">{selectedReview.summary}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
});

AIReviewPanel.displayName = "AIReviewPanel";
