import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthStore {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateProfile: (patch: Partial<AuthUser>) => void;
}

/**
 * Client-side auth state persisted to localStorage via Zustand's `persist`
 * middleware. This means a page refresh no longer wipes the session — users
 * who logged in stay logged in until they explicitly sign out, exactly like
 * a real auth-cookie-backed session would behave from the UI's perspective.
 *
 * `avatarUrl` is a `blob:` or `data:` URL generated from the user's local
 * file picker — no server upload is required for the demo.
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (user) => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
      updateProfile: (patch) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : state.user,
        })),
    }),
    {
      name: "querypro-auth",
      // Only persist the fields we want to survive a refresh.
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
