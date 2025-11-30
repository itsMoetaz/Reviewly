import { memo, useState } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  FileCode,
  Plus,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/lib/utils";
import { useDiffParser, getFileLanguage } from "../hooks/useDiffParser";
import type { FileChange } from "@/core/interfaces/repository.interface";
import type { ReviewIssue } from "@/core/interfaces/aiReview.interface";

interface DiffViewerProps {
  file: FileChange | null;
  issues?: ReviewIssue[];
  onAddComment?: (lineNumber: number, filePath: string) => void;
  isLoading: boolean;
}

interface DiffLineProps {
  line: {
    type: "added" | "removed" | "context" | "header" | "info";
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
    lineIndex: number;
  };
  issues?: ReviewIssue[];
  onAddComment?: () => void;
}

const DiffLine = memo(({ line, issues = [], onAddComment }: DiffLineProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const lineIssues = issues.filter(
    (issue) =>
      (issue.line_number === line.newLineNumber || issue.line_number === line.oldLineNumber) ||
      (issue.line_number && issue.line_end && 
        ((line.newLineNumber && line.newLineNumber >= issue.line_number && line.newLineNumber <= issue.line_end) ||
         (line.oldLineNumber && line.oldLineNumber >= issue.line_number && line.oldLineNumber <= issue.line_end)))
  );

  const hasIssues = lineIssues.length > 0;

  const getLineClasses = () => {
    switch (line.type) {
      case "added":
        return "bg-green-500/10 border-l-2 border-l-green-500";
      case "removed":
        return "bg-red-500/10 border-l-2 border-l-red-500";
      case "header":
        return "bg-blue-500/10 text-blue-600 font-mono text-xs";
      case "info":
        return "bg-muted text-muted-foreground italic text-xs";
      default:
        return "";
    }
  };

  if (line.type === "header" || line.type === "info") {
    return (
      <div className={cn("px-4 py-1 select-none", getLineClasses())}>
        <span className="font-mono text-xs">{line.content}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex text-sm font-mono hover:bg-muted/50 transition-colors relative",
        getLineClasses(),
        hasIssues && "ring-1 ring-inset ring-yellow-500/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Line Numbers */}
      <div className="flex shrink-0 select-none text-muted-foreground text-xs border-r border-border">
        <span className="w-12 px-2 py-0.5 text-right bg-muted/30">
          {line.oldLineNumber || ""}
        </span>
        <span className="w-12 px-2 py-0.5 text-right bg-muted/30">
          {line.newLineNumber || ""}
        </span>
      </div>

      {/* Sign */}
      <span className={cn(
        "w-6 text-center shrink-0 py-0.5",
        line.type === "added" && "text-green-600",
        line.type === "removed" && "text-red-600"
      )}>
        {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
      </span>

      {/* Content */}
      <pre className="flex-1 py-0.5 pr-4 overflow-x-auto whitespace-pre">
        {line.content || " "}
      </pre>

      {/* Add Comment Button */}
      {isHovered && onAddComment && (
        <button
          onClick={onAddComment}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`Add comment on line ${line.newLineNumber || line.oldLineNumber}`}
        >
          <Plus className="h-3 w-3" />
        </button>
      )}

      {/* Issue Indicator */}
      {hasIssues && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {lineIssues.map((issue) => (
            <span
              key={issue.id}
              className={cn(
                "w-2 h-2 rounded-full",
                issue.severity === "critical" && "bg-red-500",
                issue.severity === "high" && "bg-orange-500",
                issue.severity === "medium" && "bg-yellow-500",
                issue.severity === "low" && "bg-blue-500",
                issue.severity === "info" && "bg-gray-500"
              )}
              title={issue.title}
            />
          ))}
        </div>
      )}
    </div>
  );
});

DiffLine.displayName = "DiffLine";

export const DiffViewer = memo(({ 
  file, 
  issues = [],
  onAddComment,
  isLoading 
}: DiffViewerProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const patch = file?.patch || file?.diff || "";
  const { hunks, additions, deletions } = useDiffParser(patch);
  
  const language = file ? getFileLanguage(file.filename) : "text";
  const fileIssues = issues.filter(i => i.file_path === file?.filename);

  const handleCopyPath = async () => {
    if (file) {
      await navigator.clipboard.writeText(file.filename);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border overflow-hidden">
        <Skeleton className="h-12 w-full" />
        <div className="p-4 space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center py-16">
        <FileCode className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">Select a file to view</p>
        <p className="text-sm text-muted-foreground">
          Choose a file from the tree to see its changes
        </p>
      </div>
    );
  }

  const filename = file.filename.split("/").pop() || file.filename;

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      {/* File Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-muted transition-colors"
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? "Expand file diff" : "Collapse file diff"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{filename}</span>
              <Badge variant="outline" className="text-xs shrink-0">
                {language}
              </Badge>
              {fileIssues.length > 0 && (
                <Badge className="text-xs bg-yellow-500/15 text-yellow-600 shrink-0">
                  {fileIssues.length} issues
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{file.filename}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-green-600 font-medium">+{additions || file.additions}</span>
          <span className="text-xs text-red-600 font-medium">-{deletions || file.deletions}</span>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCopyPath}
            aria-label={copied ? "Path copied" : "Copy file path"}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Diff Content */}
      {!isCollapsed && (
        <div className="overflow-x-auto">
          {hunks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No diff available for this file</p>
              <p className="text-xs mt-1">The file may be binary or too large to display</p>
            </div>
          ) : (
            hunks.map((hunk, hunkIndex) => (
              <div key={hunkIndex} className={hunkIndex > 0 ? "border-t border-border" : ""}>
                {hunk.lines.map((line) => (
                  <DiffLine
                    key={line.lineIndex}
                    line={line}
                    issues={fileIssues}
                    onAddComment={
                      onAddComment && line.newLineNumber
                        ? () => onAddComment(line.newLineNumber!, file.filename)
                        : undefined
                    }
                  />
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});

DiffViewer.displayName = "DiffViewer";
