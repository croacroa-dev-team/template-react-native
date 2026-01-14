import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AppState {
  // App-wide loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Onboarding
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;

  // Feature flags (example)
  featureFlags: Record<string, boolean>;
  setFeatureFlag: (key: string, value: boolean) => void;

  // Reset all state
  reset: () => void;
}

const initialState = {
  isLoading: false,
  hasCompletedOnboarding: false,
  featureFlags: {},
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setIsLoading: (loading) => set({ isLoading: loading }),

      setHasCompletedOnboarding: (completed) =>
        set({ hasCompletedOnboarding: completed }),

      setFeatureFlag: (key, value) =>
        set((state) => ({
          featureFlags: { ...state.featureFlags, [key]: value },
        })),

      reset: () => set(initialState),
    }),
    {
      name: "app-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        featureFlags: state.featureFlags,
      }),
    }
  )
);
