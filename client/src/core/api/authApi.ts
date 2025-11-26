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
};
