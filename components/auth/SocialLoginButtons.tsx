/**
 * @fileoverview Social login buttons component
 * Renders styled Google and Apple sign-in buttons with loading states.
 * Apple button is only shown on iOS devices.
 * @module components/auth/SocialLoginButtons
 */

import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  useColorScheme,
  type ViewProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  SocialAuth,
  isAppleSignInAvailable,
} from "@/services/auth/social/social-auth";
import type { SocialAuthResult } from "@/services/auth/social/types";
import { cn } from "@/utils/cn";

// ============================================================================
// Types
// ============================================================================

interface SocialLoginButtonsProps extends ViewProps {
  /** Callback when social sign-in succeeds */
  onSuccess: (result: SocialAuthResult) => void;
  /** Callback when social sign-in fails */
  onError?: (error: Error) => void;
  /** Disable all buttons (e.g., while another form is submitting) */
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Social login buttons for Google and Apple Sign-In.
 *
 * - Google button is always shown
 * - Apple button is only shown on iOS
 * - Each button has its own loading state
 * - Supports dark mode via NativeWind
 *
 * @example
 * ```tsx
 * <SocialLoginButtons
 *   onSuccess={(result) => {
 *     // Send result.idToken to your backend
 *   }}
 *   onError={(error) => {
 *     Alert.alert('Error', error.message);
 *   }}
 * />
 * ```
 */
export function SocialLoginButtons({
  onSuccess,
  onError,
  disabled = false,
  className,
  ...viewProps
}: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  const showApple = isAppleSignInAvailable();
  const isLoading = loadingProvider !== null;
  const isDark = colorScheme === "dark";

  const handleSignIn = async (provider: "google" | "apple") => {
    if (isLoading || disabled) return;

    setLoadingProvider(provider);

    try {
      const result = await SocialAuth.signIn(provider);

      if (result) {
        onSuccess(result);
      }
    } catch (error) {
      const authError =
        error instanceof Error ? error : new Error("Social sign-in failed");
      onError?.(authError);
    } finally {
      setLoadingProvider(null);
    }
  };

  // Apple button colors are inverted in dark mode
  const appleIconColor = isDark ? "#000000" : "#FFFFFF";
  const appleSpinnerColor = isDark ? "#000000" : "#FFFFFF";

  return (
    <View className={cn("gap-3", className)} {...viewProps}>
      {/* Google Sign-In Button */}
      <Pressable
        onPress={() => handleSignIn("google")}
        disabled={isLoading || disabled}
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        className={cn(
          "flex-row items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3.5",
          "dark:border-gray-600 dark:bg-gray-100",
          "active:bg-gray-50 dark:active:bg-gray-200",
          (isLoading || disabled) && "opacity-50"
        )}
      >
        {loadingProvider === "google" ? (
          <ActivityIndicator size="small" color="#4285F4" />
        ) : (
          <>
            <Ionicons
              name="logo-google"
              size={20}
              color="#4285F4"
              style={{ marginRight: 12 }}
            />
            <Text className="text-base font-semibold text-gray-700">
              Continue with Google
            </Text>
          </>
        )}
      </Pressable>

      {/* Apple Sign-In Button (iOS only) */}
      {showApple && (
        <Pressable
          onPress={() => handleSignIn("apple")}
          disabled={isLoading || disabled}
          accessibilityRole="button"
          accessibilityLabel="Continue with Apple"
          className={cn(
            "flex-row items-center justify-center rounded-xl bg-black px-4 py-3.5",
            "dark:bg-white",
            "active:opacity-80",
            (isLoading || disabled) && "opacity-50"
          )}
        >
          {loadingProvider === "apple" ? (
            <ActivityIndicator size="small" color={appleSpinnerColor} />
          ) : (
            <>
              <Ionicons
                name="logo-apple"
                size={20}
                color={appleIconColor}
                style={{ marginRight: 12 }}
              />
              <Text className="text-base font-semibold text-white dark:text-black">
                Continue with Apple
              </Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}
