import { authApi } from "../api/authApi";
import type {
  LoginRequest,
  RegisterRequest,
  User,
  ApiError,
  ServiceResponse,
  AuthResponse,
} from "../interfaces/auth.interface";

export const authService = {
  login: async (credentials: LoginRequest): Promise<ServiceResponse<AuthResponse>> => {
    try {
      const response = await authApi.login(
        credentials.email,
        credentials.password
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Login failed",
      };
    }
  },

  register: async (data: RegisterRequest): Promise<ServiceResponse<User>> => {
    try {
      const response = await authApi.register(data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.detail || "Registration failed",
      };
    }
  },

  logout: async (): Promise<ServiceResponse<void>> => {
    try {
      await authApi.logout();
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  },

  getCurrentUser: async (token: string): Promise<User | null> => {
    try {
      const response = await authApi.getCurrentUser(token);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  refreshToken: async (): Promise<ServiceResponse<AuthResponse>> => {
    try {
      const response = await authApi.refreshToken();
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return { success: false };
    }
  },
};
