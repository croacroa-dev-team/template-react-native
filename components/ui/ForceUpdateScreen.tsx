/**
 * @fileoverview Full-screen non-dismissible force update screen
 * Displayed when the running app version is below the server's minimum.
 * @module components/ui/ForceUpdateScreen
 */

import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useTranslation } from "react-i18next";
import { alertA11y, buttonA11y } from "@/utils/accessibility";

// ============================================================================
// Types
// ============================================================================

interface ForceUpdateScreenProps {
  /** Store URL to open when the user taps "Update Now" */
  storeUrl: string;
  /** The version currently running */
  currentVersion: string;
  /** The minimum version required by the server */
  minimumVersion: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Full-screen, non-dismissible view that blocks the app until the user
 * updates to the minimum required version.
 *
 * Renders as a top-level screen (not a Modal) so the user cannot navigate
 * around it. The "Update Now" button opens the appropriate store URL.
 *
 * @example
 * ```tsx
 * if (isUpdateRequired) {
 *   return (
 *     <ForceUpdateScreen
 *       storeUrl={storeUrl}
 *       currentVersion={currentVersion}
 *       minimumVersion={minimumVersion}
 *     />
 *   );
 * }
 * ```
 */
export function ForceUpdateScreen({
  storeUrl,
  currentVersion,
  minimumVersion,
}: ForceUpdateScreenProps) {
  const { t } = useTranslation();

  const handleUpdate = () => {
    Linking.openURL(storeUrl);
  };

  return (
    <View
      className="flex-1 items-center justify-center bg-white px-8 dark:bg-gray-900"
      {...alertA11y("App update required. Please update to continue.", {
        type: "warning",
      })}
    >
      {/* Icon */}
      <View className="mb-8 h-24 w-24 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
        <Ionicons name="cloud-download-outline" size={48} color="#3b82f6" />
      </View>

      {/* Title */}
      <Text className="mb-4 text-center text-2xl font-bold text-gray-900 dark:text-white">
        {t("forceUpdate.title")}
      </Text>

      {/* Message */}
      <Text className="mb-8 text-center text-base leading-6 text-gray-600 dark:text-gray-400">
        {t("forceUpdate.message")}
      </Text>

      {/* Version info */}
      <View className="mb-8 w-full rounded-xl bg-gray-100 p-4 dark:bg-gray-800">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {t("forceUpdate.currentVersion")}
          </Text>
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {currentVersion}
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {t("forceUpdate.minimumVersion")}
          </Text>
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {minimumVersion}
          </Text>
        </View>
      </View>

      {/* Update button */}
      <Pressable
        onPress={handleUpdate}
        className="w-full items-center rounded-xl bg-primary-600 px-6 py-4 active:bg-primary-700"
        {...buttonA11y("Update now", {
          hint: "Opens the app store to download the latest version",
        })}
      >
        <Text className="text-lg font-semibold text-white">
          {t("forceUpdate.button")}
        </Text>
      </Pressable>
    </View>
  );
}
