// ==================== Branch Interfaces ====================

export interface BranchCommit {
  sha: string;
  message?: string;
  author?: string;
  date?: string;
}

export interface Branch {
  name: string;
  commit: BranchCommit;
  protected: boolean;
}

export interface BranchListResponse {
  project_id: number;
  platform: "GITHUB" | "GITLAB";
  branches: Branch[];
}

// ==================== Pull Request Interfaces ====================

export interface PullRequestAuthor {
  username: string;
  avatar_url?: string;
}

export interface PullRequestSummary {
  number: number;
  title: string;
  state: string;
  author: string;
  author_avatar?: string;
  source_branch: string;
  target_branch: string;
  created_at: string;
  updated_at: string;
  comments_count: number;
  commits_count?: number;
  changed_files_count?: number;
  additions?: number;
  deletions?: number;
  upvotes?: number;
  downvotes?: number;
  work_in_progress?: boolean;
}

export interface PullRequestListResponse {
  project_id: number;
  platform: "GITHUB" | "GITLAB";
  total: number;
  page: number;
  per_page: number;
  pull_requests: PullRequestSummary[];
}

// ==================== Pull Request Details Interfaces ====================

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface FileChange {
  filename: string;
  status: "added" | "removed" | "modified" | "renamed" | "copied";
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  diff?: string;
  previous_filename?: string;
  previous_path?: string;
}

export interface PullRequestStats {
  total_commits: number;
  total_additions: number;
  total_deletions: number;
  total_changes: number;
  changed_files: number;
}

export interface PullRequestDetails {
  number: number;
  title: string;
  description: string;
  state: string;
  author: PullRequestAuthor;
  source_branch: string;
  target_branch: string;
  created_at: string;
  updated_at: string;
  merged_at?: string;
  mergeable?: boolean;
  work_in_progress?: boolean;
  commits: CommitInfo[];
  files: FileChange[];
  stats: PullRequestStats;
}

export interface PullRequestDetailsResponse {
  project_id: number;
  platform: "GITHUB" | "GITLAB";
  pull_request: PullRequestDetails;
}

// ==================== File Content Interfaces ====================

export interface FileContent {
  path: string;
  name: string;
  size: number;
  sha: string;
  encoding: string;
  content: string;
  branch: string;
  download_url?: string;
}

export interface FileContentResponse {
  project_id: number;
  platform: "GITHUB" | "GITLAB";
  file: FileContent;
}

// ==================== File Diff Interfaces ====================

export interface FileDiff {
  path: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  diff?: string;
  previous_filename?: string;
  previous_path?: string;
}

export interface FileDiffResponse {
  project_id: number;
  pr_number: number;
  platform: "GITHUB" | "GITLAB";
  file: FileDiff;
}

// ==================== Query Params ====================

export interface PullRequestsQueryParams {
  state?: "open" | "opened" | "closed" | "merged" | "all";
  page?: number;
  per_page?: number;
}

export interface FileContentQueryParams {
  path: string;
  branch?: string;
}

export interface FileDiffQueryParams {
  path: string;
}
