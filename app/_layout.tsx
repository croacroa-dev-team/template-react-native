import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import { useNotifications } from "@/hooks/useNotifications";
import { useOffline } from "@/hooks/useOffline";
import {
  queryClient,
  persistOptions,
  setupOnlineManager,
  setupFocusManager,
} from "@/services/queryClient";
import { initSentry } from "@/services/sentry";

// Initialize Sentry as early as possible
initSentry();

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Setup TanStack Query online/offline management
setupOnlineManager();

function RootLayoutContent() {
  const { isDark, isLoaded } = useTheme();
  const { registerForPushNotifications } = useNotifications();

  // Track offline status with toast notifications
  useOffline({ showToast: true });

  useEffect(() => {
    if (isLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isLoaded]);

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  // Setup focus manager (refetch on app focus)
  useEffect(() => {
    const cleanup = setupFocusManager();
    return cleanup;
  }, []);

  if (!isLoaded) {
    return null;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
          },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(public)" />
        <Stack.Screen name="(auth)" />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={persistOptions}
          >
            <ThemeProvider>
              <AuthProvider>
                <RootLayoutContent />
              </AuthProvider>
            </ThemeProvider>
          </PersistQueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
