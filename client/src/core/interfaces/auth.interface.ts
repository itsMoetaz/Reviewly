export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: "USER" | "ADMIN";
  is_active: boolean;
  tier: "FREE" | "PLUS" | "PRO";
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  full_name: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
