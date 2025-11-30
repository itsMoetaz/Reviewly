import { memo, useState, useMemo, useCallback } from "react";
import { 
  FileCode, 
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  FileEdit,
  FilePlus,
  FileMinus,
  FileSymlink,
  Search,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/lib/utils";
import type { FileChange } from "@/core/interfaces/repository.interface";

interface FileTreeProps {
  files: FileChange[];
  selectedFile: string | null;
  onSelectFile: (filename: string) => void;
  isLoading: boolean;
}

interface FileGroup {
  name: string;
  path: string;
  files: FileChange[];
}

const getFileIcon = (status: string) => {
  switch (status) {
    case "added":
      return <FilePlus className="h-4 w-4 text-green-600" />;
    case "removed":
      return <FileMinus className="h-4 w-4 text-red-600" />;
    case "renamed":
    case "copied":
      return <FileSymlink className="h-4 w-4 text-blue-600" />;
    case "modified":
    default:
      return <FileEdit className="h-4 w-4 text-yellow-600" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "added":
      return <Badge className="text-[10px] px-1 py-0 bg-green-500/15 text-green-600">A</Badge>;
    case "removed":
      return <Badge className="text-[10px] px-1 py-0 bg-red-500/15 text-red-600">D</Badge>;
    case "renamed":
      return <Badge className="text-[10px] px-1 py-0 bg-blue-500/15 text-blue-600">R</Badge>;
    case "modified":
    default:
      return <Badge className="text-[10px] px-1 py-0 bg-yellow-500/15 text-yellow-600">M</Badge>;
  }
};

export const FileTree = memo(({ 
  files, 
  selectedFile, 
  onSelectFile, 
  isLoading 
}: FileTreeProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set([""]));

  // Group files by directory - only recalculates when files or search changes
  // NOT when expandedDirs changes (optimization to prevent unnecessary re-renders)
  const groupedFiles = useMemo(() => {
    const groups: Record<string, FileGroup> = {};
    
    const filteredFiles = searchQuery.trim()
      ? files.filter(f => f.filename.toLowerCase().includes(searchQuery.toLowerCase()))
      : files;

    filteredFiles.forEach((file) => {
      const parts = file.filename.split("/");
      const dirPath = parts.slice(0, -1).join("/") || "(root)";
      
      if (!groups[dirPath]) {
        groups[dirPath] = {
          name: dirPath === "(root)" ? "Root" : parts.slice(-2, -1)[0] || dirPath,
          path: dirPath,
          files: [],
        };
      }
      groups[dirPath].files.push(file);
    });

    return Object.values(groups).sort((a, b) => a.path.localeCompare(b.path));
  }, [files, searchQuery]); // Removed expandedDirs dependency

  // Memoized toggle function to prevent child re-renders
  const toggleDir = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Summary stats
  const stats = useMemo(() => {
    return files.reduce(
      (acc, file) => ({
        added: acc.added + (file.status === "added" ? 1 : 0),
        modified: acc.modified + (file.status === "modified" ? 1 : 0),
        removed: acc.removed + (file.status === "removed" ? 1 : 0),
      }),
      { added: 0, modified: 0, removed: 0 }
    );
  }, [files]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Changed Files
          </h3>
          <span className="text-xs text-muted-foreground">{files.length} files</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs mb-3">
          <span className="flex items-center gap-1 text-green-600">
            <Plus className="h-3 w-3" />
            {stats.added}
          </span>
          <span className="flex items-center gap-1 text-yellow-600">
            <FileEdit className="h-3 w-3" />
            {stats.modified}
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <Minus className="h-3 w-3" />
            {stats.removed}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-8 text-xs"
            aria-label="Search changed files"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2">
        {groupedFiles.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No files found
          </p>
        ) : (
          <div className="space-y-1">
            {groupedFiles.map((group) => (
              <div key={group.path}>
                {/* Directory Header */}
                {group.path !== "(root)" && (
                  <button
                    onClick={() => toggleDir(group.path)}
                    className="w-full flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                    aria-expanded={expandedDirs.has(group.path)}
                    aria-label={`${expandedDirs.has(group.path) ? "Collapse" : "Expand"} ${group.path} folder`}
                  >
                    {expandedDirs.has(group.path) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    <span className="truncate">{group.path}</span>
                    <span className="ml-auto">{group.files.length}</span>
                  </button>
                )}

                {/* Files */}
                {(group.path === "(root)" || expandedDirs.has(group.path)) && (
                  <div className={cn(group.path !== "(root)" && "ml-3")}>
                    {group.files.map((file) => {
                      const filename = file.filename.split("/").pop() || file.filename;
                      const isSelected = selectedFile === file.filename;

                      return (
                        <button
                          key={file.filename}
                          onClick={() => onSelectFile(file.filename)}
                          aria-label={`View ${filename}, ${file.status}, ${file.additions} additions, ${file.deletions} deletions`}
                          aria-current={isSelected ? "true" : undefined}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors",
                            isSelected
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted text-foreground"
                          )}
                        >
                          {getFileIcon(file.status)}
                          <span className="truncate flex-1 text-left text-xs">
                            {filename}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {getStatusBadge(file.status)}
                            <span className="text-[10px] text-green-600">+{file.additions}</span>
                            <span className="text-[10px] text-red-600">-{file.deletions}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

FileTree.displayName = "FileTree";
