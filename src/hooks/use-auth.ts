"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/types";
import api from "@/lib/api";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      fetchUser: async () => {
        try {
          const { data } = await api.get("/auth/me");
          set({ user: data.data, isLoading: false });
        } catch {
          set({ user: null, isLoading: false });
        }
      },
      logout: async () => {
        try {
          await api.post("/auth/logout");
        } finally {
          set({ user: null });
        }
      },
    }),
    {
      name: "medimate-auth",
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state?.user) {
          state.setLoading(false);
        }
      },
    }
  )
);

export function useAuth() {
  const { user, isLoading, setUser, setLoading, fetchUser, logout } = useAuthStore();
  return { user, isLoading, setUser, setLoading, fetchUser, logout, isAuthenticated: !!user };
}
