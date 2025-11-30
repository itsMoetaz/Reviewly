export interface ProjectBase {
    name: string;
    description?: string;
    platform: "GITHUB" | "GITLAB";
    repository_url: string;
}

export interface ProjectCreateGitHub extends ProjectBase {
    platform: "GITHUB";
    github_token: string;
    github_repo_owner: string;
    github_repo_name: string;
}

export interface ProjectCreateGitLab extends ProjectBase {
    platform: "GITLAB";
    gitlab_project_id: string;
    gitlab_token: string;
}

export interface ProjectUpdate {
    name?: string;
    description?: string;
    repository_url?: string;
    github_token?: string;
    gitlab_token?: string;
    is_active?: boolean;
}

export interface ProjectResponse extends ProjectBase {
    id: number;
    user_id: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    github_repo_owner?: string | null;
    github_repo_name?: string | null;
    gitlab_project_id?: string | null;
}

export interface ProjectStats {
    branches_count: number;
    open_prs_count: number;
    closed_prs_count: number;
    total_prs_count: number;
    last_activity?: string | null;
}

export interface ProjectResponseWithStats extends ProjectResponse {
    stats: ProjectStats;
}

export interface ProjectListResponse {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    projects: ProjectResponse[];
}

