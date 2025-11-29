import axiosInstance from "../../utils/axiosConfig";
import type { AIReviewCreateRequest } from "../interfaces/aiReview.interface";

const BASE_PATH = "/ai-reviews";

export const aiReviewApi = {

  createReview: (projectId: number, prNumber: number, data?: AIReviewCreateRequest) =>
    axiosInstance.post(`${BASE_PATH}/projects/${projectId}/pull-requests/${prNumber}`, data || {}),

  getReview: (reviewId: number) =>
    axiosInstance.get(`${BASE_PATH}/${reviewId}`),

  getReviewsForPR: (projectId: number, prNumber: number) =>
    axiosInstance.get(`${BASE_PATH}/projects/${projectId}/pull-requests/${prNumber}`),

  deleteReview: (reviewId: number) =>
    axiosInstance.delete(`${BASE_PATH}/${reviewId}`),
};
