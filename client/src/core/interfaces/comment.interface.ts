// ==================== Reaction Types ====================

export type ReactionType = 
  | "thumbs_up"
  | "thumbs_down"
  | "heart"
  | "rocket"
  | "eyes"
  | "party";

export interface ReactionConfig {
  emoji: string;
  label: string;
}

export const REACTION_CONFIG: Record<ReactionType, ReactionConfig> = {
  thumbs_up: { emoji: "👍", label: "Like" },
  thumbs_down: { emoji: "👎", label: "Dislike" },
  heart: { emoji: "❤️", label: "Love" },
  rocket: { emoji: "🚀", label: "Rocket" },
  eyes: { emoji: "👀", label: "Looking" },
  party: { emoji: "🎉", label: "Celebrate" },
};

// ==================== Request Interfaces ====================

export interface Comment {
  comment_text: string;
}

export interface InlineCommentCreateRequest {
  comment_text: string;
  commit_sha: string;
  file_path: string;
  line_number: number;
  line_end?: number;
}

export interface ReactionCreateRequest {
  reaction_type: ReactionType;
}

// ==================== Response Interfaces ====================

export interface ReactionsSummary {
  thumbs_up: number;
  thumbs_down: number;
  heart: number;
  rocket: number;
  eyes: number;
  party: number;
  user_reactions: ReactionType[];
}

export interface ReactionResponse {
  id: number;
  comment_id: number;
  user_id: number;
  reaction_type: ReactionType;
  created_at: string;
}

export interface CommentResponse {
  id: number;
  project_id: number;
  pr_number: number;
  user_id: number;
  comment_text: string;
  github_comment_id?: number;
  gitlab_note_id?: number;
  is_deleted: boolean;
  file_path?: string;
  line_number?: number;
  line_end?: number;
  created_at: string;
  updated_at?: string;
  reactions_summary?: ReactionsSummary;
}

export interface CommentsListResponse {
  comments: CommentResponse[];
  total: number;
  page: number;
  per_page: number;
}

// ==================== Query Params ====================

export interface CommentsQueryParams {
  page?: number;
  per_page?: number;
}
