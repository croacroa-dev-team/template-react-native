/**
 * @fileoverview Permission-gated content component
 * Renders children only when a specific permission is granted,
 * otherwise shows a configurable permission request UI.
 * @module components/ui/PermissionGate
 */

import { ReactNode } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { usePermission } from "@/hooks/usePermission";
import { useTheme } from "@/hooks";
import { Button } from "@/components/ui/Button";
import type {
  PermissionType,
  PermissionConfig,
} from "@/services/permissions/types";

interface PermissionGateProps {
  /** The permission type required to show children */
  type: PermissionType;
  /** Optional custom permission config to override defaults */
  config?: Partial<PermissionConfig>;
  /** Content to render when permission is granted */
  children: ReactNode;
  /** Custom fallback to render when permission is not granted */
  fallback?: ReactNode;
}

/**
 * Component that gates content behind a permission check.
 * Shows children when the permission is granted, otherwise displays
 * a permission request UI (or a custom fallback).
 *
 * @example
 * ```tsx
 * // Basic usage
 * <PermissionGate type="camera">
 *   <CameraView />
 * </PermissionGate>
 * ```
 *
 * @example
 * ```tsx
 * // With custom config
 * <PermissionGate
 *   type="location"
 *   config={{
 *     title: "Find Nearby Places",
 *     message: "Allow location access to discover restaurants near you.",
 *   }}
 * >
 *   <MapView />
 * </PermissionGate>
 * ```
 *
 * @example
 * ```tsx
 * // With custom fallback
 * <PermissionGate
 *   type="notifications"
 *   fallback={<Text>Notifications are disabled</Text>}
 * >
 *   <NotificationsList />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  type,
  config: customConfig,
  children,
  fallback,
}: PermissionGateProps) {
  const { isGranted, isBlocked, isLoading, config, request, openSettings } =
    usePermission(type, customConfig);
  const { isDark } = useTheme();
  const { t } = useTranslation();

  // Show loading state while checking permission
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
        <ActivityIndicator
          size="large"
          color={isDark ? "#f8fafc" : "#0f172a"}
        />
      </View>
    );
  }

  // Permission is granted — render children
  if (isGranted) {
    return <>{children}</>;
  }

  // Permission not granted — show fallback or default UI
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <View className="flex-1 items-center justify-center px-8 bg-background-light dark:bg-background-dark">
      <View className="w-full items-center rounded-2xl bg-surface-light dark:bg-surface-dark p-8">
        {/* Icon */}
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
          <Ionicons
            name={config.icon as keyof typeof Ionicons.glyphMap}
            size={36}
            color={isDark ? "#34d399" : "#059669"}
          />
        </View>

        {/* Title */}
        <Text className="mb-3 text-center text-xl font-bold text-text-light dark:text-text-dark">
          {config.title}
        </Text>

        {/* Message */}
        <Text className="mb-8 text-center text-base leading-6 text-muted-light dark:text-muted-dark">
          {config.message}
        </Text>

        {/* Action Button */}
        {isBlocked ? (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onPress={openSettings}
          >
            {t("permissions.openSettings")}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onPress={request}
          >
            {t("permissions.allowAccess")}
          </Button>
        )}

        {/* Secondary hint for blocked state */}
        {isBlocked && (
          <Text className="mt-4 text-center text-sm text-muted-light dark:text-muted-dark">
            Permission was denied. Please enable it in your device settings.
          </Text>
        )}
      </View>
    </View>
  );
}
