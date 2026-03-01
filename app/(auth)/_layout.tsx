import { useEffect } from "react";
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { SessionTimeoutModal } from "@/components/ui/SessionTimeoutModal";
import { View, ActivityIndicator } from "react-native";

export default function AuthLayout() {
  const { isAuthenticated, isLoading, signOut } = useAuth();
  const { isDark } = useTheme();
  const { isWarning, isExpired, remainingSeconds, extend } =
    useSessionTimeout();

  useEffect(() => {
    if (isExpired) {
      signOut();
    }
  }, [isExpired, signOut]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(public)/login" />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
          },
        }}
      >
        <Stack.Screen name="home" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
      </Stack>
      <SessionTimeoutModal
        visible={isWarning}
        remainingSeconds={remainingSeconds}
        onContinue={extend}
        onLogout={signOut}
      />
    </>
  );
}
