import { projectApi } from "../api/projectApi";
import type { ProjectCreateGitHub, ProjectCreateGitLab, ProjectUpdate, ProjectListResponse, ProjectResponse, ProjectResponseWithStats } from "../interfaces/project.interface";
import type { ServiceResponse, ApiError } from "../interfaces/auth.interface";

export const projectService = {
    createGitHub: async (data: ProjectCreateGitHub): Promise<ServiceResponse<ProjectResponse>> => {
        try {
            const response = await projectApi.createGitHub(data);
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            const apiError = error as ApiError;
            return {
                success: false,
                error: apiError.response?.data?.detail || "Failed to create GitHub project",
            };
        }
    },
    createGitLab: async (data: ProjectCreateGitLab): Promise<ServiceResponse<ProjectResponse>> => {
        try {
            const response = await projectApi.createGitLab(data);
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            const apiError = error as ApiError;
            return {
                success: false,
                error: apiError.response?.data?.detail || "Failed to create GitLab project",
            };
        }
    },
    update: async (id: number, data: ProjectUpdate): Promise<ServiceResponse<ProjectResponse>> => {
        try {
            const response = await projectApi.updateProject(id, data);
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            const apiError = error as ApiError;
            return {
                success: false,
                error: apiError.response?.data?.detail || "Failed to update project",
            };
        }
    },
    delete: async (id: number): Promise<ServiceResponse<void>> => {
        try {
            await projectApi.deleteProject(id);
            return { success: true };
        } catch (error) {
            const apiError = error as ApiError;
            return {
                success: false,
                error: apiError.response?.data?.detail || "Failed to delete project",
            };
        }
    },
    getUserProjects: async (params?: { page?: number; per_page?: number; platform?: "GITHUB" | "GITLAB"; is_active?: boolean }): Promise<ServiceResponse<ProjectListResponse>> => {
        try {
            const response = await projectApi.getAllProjects(params || {});
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            const apiError = error as ApiError;
            return {
                success: false,
                error: apiError.response?.data?.detail || "Failed to get user projects",
            };
        }
    },
    getById: async (id: number): Promise<ServiceResponse<ProjectResponseWithStats>> => {
        try {
            const response = await projectApi.getProject(id);
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            const apiError = error as ApiError;
            return {
                success: false,
                error: apiError.response?.data?.detail || "Failed to get project",
            };
        }
    },
};