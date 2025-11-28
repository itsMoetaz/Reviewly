import axiosInstance from "../../utils/axiosConfig";
import type { ProjectCreateGitHub, ProjectCreateGitLab, ProjectUpdate } from "../interfaces/project.interface";

export const projectApi = {

    createGitHub: (data: ProjectCreateGitHub) => 
        axiosInstance.post("/projects/github", data),

    createGitLab: (data: ProjectCreateGitLab) => 
        axiosInstance.post("/projects/gitlab", data),

    updateProject: (id: number, data: ProjectUpdate) => 
        axiosInstance.put(`/projects/${id}`, data),

    deleteProject: (id: number) => 
        axiosInstance.delete(`/projects/${id}`),

    getProject: (id: number) => 
        axiosInstance.get(`/projects/${id}`),

    getAllProjects: (params: { 
        page?: number; 
        per_page?: number;
        is_active?: boolean;
        platform?: "GITHUB" | "GITLAB";
    }) => 
        axiosInstance.get("/projects", { params })

};
