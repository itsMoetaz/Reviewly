import { userApi } from "../api/userApi";
import type { User, ApiError, ServiceResponse, UpdateProfileData } from "../interfaces/auth.interface";

export const userService = {
  getProfile: async (): Promise<ServiceResponse<User>> => {
    try {
      const response = await userApi.getProfile();
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to get profile",
      };
    }
  },

  updateProfile: async (data: UpdateProfileData): Promise<ServiceResponse<User>> => {
    try {
      const response = await userApi.updateProfile(data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to update profile",
      };
    }
  },

  uploadAvatar: async (file: File): Promise<ServiceResponse<User>> => {
    try {
      const response = await userApi.uploadAvatar(file);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to upload avatar",
      };
    }
  },

  deleteAvatar: async (): Promise<ServiceResponse<User>> => {
    try {
      const response = await userApi.deleteAvatar();
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to delete avatar",
      };
    }
  },

  deleteAccount: async (): Promise<ServiceResponse<void>> => {
    try {
      await userApi.deleteAccount();
      return { success: true };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Failed to delete account",
      };
    }
  },
};
