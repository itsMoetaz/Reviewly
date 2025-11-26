import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "@/core/services/authService";
import type { User, AuthState } from "@/core/interfaces/auth.interface";

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; username: string; full_name: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  refreshToken: () => Promise<void>;
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        const result = await authService.login({ email, password });

        if (result.success && result.data) {
          set({
            accessToken: result.data.access_token,
            isAuthenticated: true,
          });
          await get().fetchUser();
          set({ isLoading: false });
          return { success: true };
        }

        set({ isLoading: false });
        return { success: false, error: result.error };
      },

      register: async (data) => {
        set({ isLoading: true });
        const result = await authService.register(data);

        if (result.success && result.data) {
          set({ isLoading: false });
          return { success: true };
        }

        set({ isLoading: false });
        return { success: false, error: result.error };
      },

      logout: async () => {
        try {
          await authService.logout();
        } finally {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
          localStorage.removeItem("auth-storage");
        }
      },

      fetchUser: async () => {
        const token = get().accessToken;
        if (!token) return;

        const user = await authService.getCurrentUser(token);
        if (user) {
          set({ user });
        }
      },

      refreshToken: async () => {
        const result = await authService.refreshToken();
        if (result.success && result.data) {
          set({ accessToken: result.data.access_token });
        } else {
          get().logout();
        }
      },

      initialize: async () => {
        const token = get().accessToken;
        
        if (!token) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true });

        try {
          const user = await authService.getCurrentUser(token);
          if (user) {
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
