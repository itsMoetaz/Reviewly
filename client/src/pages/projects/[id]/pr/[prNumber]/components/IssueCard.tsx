import { memo } from "react";
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  XCircle,
  FileCode,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/lib/utils";
import type { ReviewIssue } from "@/core/interfaces/aiReview.interface";
import { SEVERITY_CONFIG } from "@/core/interfaces/aiReview.interface";

interface IssueCardProps {
  issue: ReviewIssue;
  isSelected?: boolean;
  onSelect?: (issue: ReviewIssue) => void;
  onNavigateToFile?: (filename: string, line: number) => void;
}

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case "critical":
      return <XCircle className="h-4 w-4" />;
    case "high":
      return <AlertTriangle className="h-4 w-4" />;
    case "medium":
      return <AlertCircle className="h-4 w-4" />;
    case "low":
      return <Info className="h-4 w-4" />;
    case "info":
    default:
      return <CheckCircle className="h-4 w-4" />;
  }
};

export const IssueCard = memo(({ 
  issue, 
  isSelected,
  onSelect,
  onNavigateToFile 
}: IssueCardProps) => {
  const config = SEVERITY_CONFIG[issue.severity];
  const filename = issue.file_path?.split("/").pop() || issue.file_path;

  const handleClick = () => {
    onSelect?.(issue);
  };

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (issue.file_path && issue.line_number) {
      onNavigateToFile?.(issue.file_path, issue.line_number);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "p-3 rounded-lg border transition-all cursor-pointer",
        isSelected
          ? "ring-2 ring-primary border-primary/50 bg-primary/5"
          : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <div className={cn("p-1 rounded shrink-0", config.bg)}>
          <span className={config.color}>
            {getSeverityIcon(issue.severity)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-medium text-sm">{issue.title}</h4>
            <Badge className={cn("text-[10px] px-1 py-0 shrink-0", config.bg, config.color)}>
              {config.label}
            </Badge>
          </div>
        </div>
        <ChevronRight className={cn(
          "h-4 w-4 text-muted-foreground transition-transform shrink-0 mt-0.5",
          isSelected && "rotate-90"
        )} />
      </div>

      {/* Description - always visible but truncated unless selected */}
      <p className={cn(
        "text-xs text-muted-foreground mb-2",
        !isSelected && "line-clamp-2"
      )}>
        {issue.description}
      </p>

      {/* Extra details - shown when selected */}
      {isSelected && (
        <div className="space-y-2 mt-3">
          {issue.suggestion && (
            <div className="p-2 rounded-md bg-green-500/10 border border-green-500/20">
              <p className="text-[10px] font-medium text-green-600 mb-0.5">💡 Suggestion:</p>
              <p className="text-xs text-muted-foreground">{issue.suggestion}</p>
            </div>
          )}

          {issue.code_snippet && (
            <div className="p-2 rounded-md bg-muted">
              <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Code:</p>
              <pre className="text-[10px] font-mono overflow-x-auto whitespace-pre-wrap">
                {issue.code_snippet}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* File Location */}
      {issue.file_path && (
        <button
          onClick={handleNavigate}
          className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <FileCode className="h-3 w-3 shrink-0" />
          <span className="truncate">{filename}</span>
          {issue.line_number && (
            <span className="shrink-0 text-primary">
              :{issue.line_number}
              {issue.line_end && issue.line_end !== issue.line_number && `-${issue.line_end}`}
            </span>
          )}
          <ExternalLink className="h-2.5 w-2.5 ml-auto shrink-0" />
        </button>
      )}
    </div>
  );
});

IssueCard.displayName = "IssueCard";
