// ==================== Enums ====================

export type ReviewStatus = "pending" | "processing" | "completed" | "failed";

export type IssueSeverity = "critical" | "high" | "medium" | "low" | "info";

export type IssueCategory = 
  | "security"
  | "bug"
  | "performance"
  | "code_quality"
  | "best_practices"
  | "maintainability"
  | "documentation"
  | "testing"
  | "accessibility"
  | "other";

// ==================== Request Interfaces ====================

export interface AIReviewCreateRequest {
  include_context: boolean;
  focus_areas?: string[];
}

// ==================== Response Interfaces ====================

export interface ReviewIssue {
  id: number;
  file_path: string;
  line_number?: number;
  line_end?: number;
  severity: IssueSeverity;
  category: string;
  title: string;
  description: string;
  suggestion?: string;
  code_snippet?: string;
}

export interface AIReviewResponse {
  id: number;
  project_id: number;
  pr_number: number;
  status: ReviewStatus;
  overall_rating?: string;
  summary?: string;
  files_analyzed: number;
  issues_found: number;
  ai_model: string;
  tokens_used: number;
  processing_time_seconds?: number;
  requested_by: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface AIReviewWithIssues extends AIReviewResponse {
  issues: ReviewIssue[];
  project_name: string;
  requester_username: string;
}

export interface ReviewListResponse {
  reviews: AIReviewResponse[];
  total: number;
  page: number;
  per_page: number;
}

// ==================== UI Helper Types ====================

export interface SeverityConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export const SEVERITY_CONFIG: Record<IssueSeverity, SeverityConfig> = {
  critical: {
    label: "Critical",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    icon: "AlertOctagon",
  },
  high: {
    label: "High",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    icon: "AlertTriangle",
  },
  medium: {
    label: "Medium",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    icon: "AlertCircle",
  },
  low: {
    label: "Low",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    icon: "Info",
  },
  info: {
    label: "Info",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/30",
    icon: "MessageCircle",
  },
};
