"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setAccessToken, type UserSummary } from "./api";

interface AuthState {
  user: UserSummary | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: UserSummary, accessToken: string, refreshToken: string) => void;
  updateUser: (user: UserSummary) => void;
  clearAuth: () => void;
  getRefreshToken: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        setAccessToken(accessToken);
        set({ user, refreshToken, isAuthenticated: true });
      },

      updateUser: (user) => set({ user }),

      clearAuth: () => {
        setAccessToken(null);
        set({ user: null, refreshToken: null, isAuthenticated: false });
      },

      getRefreshToken: () => get().refreshToken,
    }),
    {
      name: "edu-auth",
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
