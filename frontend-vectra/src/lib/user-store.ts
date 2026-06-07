import { create } from "zustand";

import type { CurrentUser } from "@/lib/api-types";

type UserError = string | null;

interface UserState {
  user: CurrentUser | null;
  clerkUserId: string | null;
  isLoading: boolean;
  error: UserError;
}

interface UserActions {
  setUser: (user: CurrentUser | null) => void;
  setClerkUserId: (clerkUserId: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: UserError) => void;
  updateCredits: (currentCredit: number) => void;
  clearUser: () => void;
}

const initialState: UserState = {
  user: null,
  clerkUserId: null,
  isLoading: false,
  error: null,
};

export const useUserStore = create<UserState & UserActions>((set) => ({
  ...initialState,

  setUser: (user) =>
    set({
      user,
      clerkUserId: user?.clerk_user_id ?? null,
      error: null,
    }),

  setClerkUserId: (clerkUserId) => set({ clerkUserId }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  updateCredits: (currentCredit) =>
    set((state) => ({
      user: state.user
        ? { ...state.user, current_credit: currentCredit }
        : state.user,
    })),

  clearUser: () => set(initialState),
}));
