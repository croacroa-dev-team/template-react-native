/**
 * @fileoverview Haptic feedback hook wrapping expo-haptics
 * @module hooks/useHaptics
 */

import { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

/**
 * Provides haptic feedback methods with platform safety.
 * All methods are no-ops on platforms that don't support haptics (web, some simulators).
 */
export function useHaptics() {
  const isAvailable = useMemo(
    () => Platform.OS === "ios" || Platform.OS === "android",
    []
  );

  const impact = useCallback(
    async (style: "light" | "medium" | "heavy" = "medium") => {
      if (!isAvailable) return;
      const map: Record<string, Haptics.ImpactFeedbackStyle> = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      await Haptics.impactAsync(map[style]);
    },
    [isAvailable]
  );

  const notification = useCallback(
    async (type: "success" | "warning" | "error" = "success") => {
      if (!isAvailable) return;
      const map: Record<string, Haptics.NotificationFeedbackType> = {
        success: Haptics.NotificationFeedbackType.Success,
        warning: Haptics.NotificationFeedbackType.Warning,
        error: Haptics.NotificationFeedbackType.Error,
      };
      await Haptics.notificationAsync(map[type]);
    },
    [isAvailable]
  );

  const selection = useCallback(async () => {
    if (!isAvailable) return;
    await Haptics.selectionAsync();
  }, [isAvailable]);

  return { impact, notification, selection, isAvailable };
}
