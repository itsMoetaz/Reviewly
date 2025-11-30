import { repositoryApi } from "../api/repositoryApi";
import type { ServiceResponse, ApiError } from "../interfaces/auth.interface";
import type {
  BranchListResponse,
  PullRequestListResponse,
  PullRequestDetailsResponse,
  FileContentResponse,
  FileDiffResponse,
  PullRequestsQueryParams,
  FileContentQueryParams,
  FileDiffQueryParams,
} from "../interfaces/repository.interface";

export const repositoryService = {

  getBranches: async (projectId: number): Promise<ServiceResponse<BranchListResponse>> => {
    try {
      const response = await repositoryApi.getBranches(projectId);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to fetch branches",
      };
    }
  },

  getPullRequests: async (
    projectId: number,
    params?: PullRequestsQueryParams
  ): Promise<ServiceResponse<PullRequestListResponse>> => {
    try {
      const response = await repositoryApi.getPullRequests(projectId, params);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to fetch pull requests",
      };
    }
  },

  getPullRequestDetails: async (
    projectId: number,
    prNumber: number
  ): Promise<ServiceResponse<PullRequestDetailsResponse>> => {
    try {
      const response = await repositoryApi.getPullRequestDetails(projectId, prNumber);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to fetch pull request details",
      };
    }
  },


  getFileContent: async (
    projectId: number,
    params: FileContentQueryParams
  ): Promise<ServiceResponse<FileContentResponse>> => {
    try {
      const response = await repositoryApi.getFileContent(projectId, params);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to fetch file content",
      };
    }
  },

  getFileDiff: async (
    projectId: number,
    prNumber: number,
    params: FileDiffQueryParams
  ): Promise<ServiceResponse<FileDiffResponse>> => {
    try {
      const response = await repositoryApi.getFileDiff(projectId, prNumber, params);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to fetch file diff",
      };
    }
  },
};
