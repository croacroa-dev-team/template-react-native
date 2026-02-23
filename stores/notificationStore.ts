import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

interface NotificationState {
  pushToken: string | null;
  isEnabled: boolean;
  lastNotification: Notifications.Notification | null;
  setPushToken: (token: string | null) => void;
  setIsEnabled: (enabled: boolean) => void;
  toggleNotifications: () => void;
  setLastNotification: (
    notification: Notifications.Notification | null
  ) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      pushToken: null,
      isEnabled: true,
      lastNotification: null,

      setPushToken: (token) => set({ pushToken: token }),

      setIsEnabled: (enabled) => set({ isEnabled: enabled }),

      toggleNotifications: () => set({ isEnabled: !get().isEnabled }),

      setLastNotification: (notification) =>
        set({ lastNotification: notification }),
    }),
    {
      name: "notification-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isEnabled: state.isEnabled,
      }),
    }
  )
);
