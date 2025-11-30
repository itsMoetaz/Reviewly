import axiosInstance from "../../utils/axiosConfig";
import type {
  PullRequestsQueryParams,
  FileContentQueryParams,
  FileDiffQueryParams,
} from "../interfaces/repository.interface";

export const repositoryApi = {

  getBranches: (projectId: number) =>
    axiosInstance.get(`/projects/${projectId}/branches`),

  getPullRequests: (projectId: number, params?: PullRequestsQueryParams) =>
    axiosInstance.get(`/projects/${projectId}/pull-requests`, { params }),

  getPullRequestDetails: (projectId: number, prNumber: number) =>
    axiosInstance.get(`/projects/${projectId}/pull-requests/${prNumber}`),

  getFileContent: (projectId: number, params: FileContentQueryParams) =>
    axiosInstance.get(`/projects/${projectId}/files`, { params }),

  getFileDiff: (projectId: number, prNumber: number, params: FileDiffQueryParams) =>
    axiosInstance.get(`/projects/${projectId}/pull-requests/${prNumber}/files/diff`, { params }),
};
