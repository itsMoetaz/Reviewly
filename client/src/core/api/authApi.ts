import axios from "axios";
import type { RegisterRequest } from "../interfaces/auth.interface";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const authApi = {
  login: async (email: string, password: string) => {
    const formData = new FormData();
    formData.append("username", email); 
    formData.append("password", password);

    return axios.post(`${API_URL}/auth/login`, formData);
  },

  register: async (data: RegisterRequest) => {
    return axios.post(`${API_URL}/auth/register`, data);
  },

  logout: async () => {
    return axios.post(`${API_URL}/auth/logout`);
  },

  getCurrentUser: async (token: string) => {
    return axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  refreshToken: async () => {
    return axios.post(`${API_URL}/auth/refresh`);
  },

  getGoogleLoginUrl: () => {
    return `${API_URL}/auth/google/login`;
  },

  // Password Reset APIs
  forgotPassword: async (email: string) => {
    return axios.post(`${API_URL}/auth/forgot-password`, { email });
  },

  verifyResetCode: async (email: string, code: string) => {
    return axios.post(`${API_URL}/auth/verify-reset-code`, { email, code });
  },

  resetPassword: async (email: string, code: string, newPassword: string) => {
    return axios.post(`${API_URL}/auth/reset-password`, { 
      email, 
      code, 
      new_password: newPassword 
    });
  },

  changePassword: async (token: string, currentPassword: string, newPassword: string) => {
    return axios.post(
      `${API_URL}/auth/change-password`, 
      { current_password: currentPassword, new_password: newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },
};
