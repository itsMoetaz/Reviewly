import { useMemo } from "react";

export interface ParsedDiffLine {
  type: "added" | "removed" | "context" | "header" | "info";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
  lineIndex: number;
}

export interface ParsedDiffHunk {
  header: string;
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: ParsedDiffLine[];
}

export interface ParsedFileDiff {
  filename: string;
  hunks: ParsedDiffHunk[];
  additions: number;
  deletions: number;
}

/**
 * Hook to parse unified diff format into structured data
 */
export const useDiffParser = (patch: string | undefined) => {
  const parsedDiff = useMemo(() => {
    if (!patch) {
      return { hunks: [], additions: 0, deletions: 0 };
    }

    const lines = patch.split("\n");
    const hunks: ParsedDiffHunk[] = [];
    let currentHunk: ParsedDiffHunk | null = null;
    let oldLineNum = 0;
    let newLineNum = 0;
    let lineIndex = 0;
    let totalAdditions = 0;
    let totalDeletions = 0;

    for (const line of lines) {
      // Parse hunk header: @@ -oldStart,oldCount +newStart,newCount @@
      const hunkMatch = line.match(/^@@\s*-(\d+)(?:,(\d+))?\s*\+(\d+)(?:,(\d+))?\s*@@(.*)$/);
      
      if (hunkMatch) {
        if (currentHunk) {
          hunks.push(currentHunk);
        }
        
        const oldStart = parseInt(hunkMatch[1], 10);
        const oldCount = parseInt(hunkMatch[2] || "1", 10);
        const newStart = parseInt(hunkMatch[3], 10);
        const newCount = parseInt(hunkMatch[4] || "1", 10);
        
        currentHunk = {
          header: line,
          oldStart,
          oldCount,
          newStart,
          newCount,
          lines: [],
        };
        
        oldLineNum = oldStart;
        newLineNum = newStart;
        
        // Add header line
        currentHunk.lines.push({
          type: "header",
          content: line,
          lineIndex: lineIndex++,
        });
        
        continue;
      }

      if (!currentHunk) continue;

      if (line.startsWith("+")) {
        // Added line
        currentHunk.lines.push({
          type: "added",
          content: line.substring(1),
          newLineNumber: newLineNum++,
          lineIndex: lineIndex++,
        });
        totalAdditions++;
      } else if (line.startsWith("-")) {
        // Removed line
        currentHunk.lines.push({
          type: "removed",
          content: line.substring(1),
          oldLineNumber: oldLineNum++,
          lineIndex: lineIndex++,
        });
        totalDeletions++;
      } else if (line.startsWith(" ") || line === "") {
        // Context line
        currentHunk.lines.push({
          type: "context",
          content: line.substring(1) || "",
          oldLineNumber: oldLineNum++,
          newLineNumber: newLineNum++,
          lineIndex: lineIndex++,
        });
      } else if (line.startsWith("\\")) {
        // Info line (e.g., "\ No newline at end of file")
        currentHunk.lines.push({
          type: "info",
          content: line,
          lineIndex: lineIndex++,
        });
      }
    }

    if (currentHunk) {
      hunks.push(currentHunk);
    }

    return {
      hunks,
      additions: totalAdditions,
      deletions: totalDeletions,
    };
  }, [patch]);

  return parsedDiff;
};

/**
 * Get file extension for syntax highlighting
 */
export const getFileLanguage = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  
  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    mjs: "javascript",
    cjs: "javascript",
    
    // Python
    py: "python",
    pyw: "python",
    pyx: "python",
    
    // Web
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    
    // Data
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    toml: "toml",
    
    // Shell
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    ps1: "powershell",
    
    // Other languages
    java: "java",
    kt: "kotlin",
    kts: "kotlin",
    go: "go",
    rs: "rust",
    rb: "ruby",
    php: "php",
    c: "c",
    h: "c",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    hpp: "cpp",
    cs: "csharp",
    swift: "swift",
    m: "objectivec",
    mm: "objectivec",
    r: "r",
    R: "r",
    sql: "sql",
    graphql: "graphql",
    gql: "graphql",
    
    // Markup
    md: "markdown",
    mdx: "markdown",
    rst: "rest",
    tex: "latex",
    
    // Config
    dockerfile: "dockerfile",
    makefile: "makefile",
    cmake: "cmake",
    gradle: "groovy",
    groovy: "groovy",
    
    // Default
    txt: "text",
  };

  return languageMap[ext] || "text";
};
