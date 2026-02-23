/**
 * @fileoverview React hook for centralized permission management
 * Provides a reactive interface for checking and requesting permissions
 * with automatic refresh when returning from device Settings.
 * @module hooks/usePermission
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

import { PermissionManager } from "@/services/permissions/permission-manager";
import {
  DEFAULT_PERMISSION_CONFIGS,
  type PermissionType,
  type PermissionStatus,
  type PermissionConfig,
} from "@/services/permissions/types";

/**
 * Return type for the usePermission hook
 */
export interface UsePermissionReturn {
  /** Current normalized permission status */
  status: PermissionStatus;
  /** Whether the permission is granted */
  isGranted: boolean;
  /** Whether the permission is blocked (must open Settings to change) */
  isBlocked: boolean;
  /** Whether the permission status is being loaded */
  isLoading: boolean;
  /** UI configuration for this permission (merged defaults + custom) */
  config: PermissionConfig;
  /** Request the permission from the user and return the resulting status */
  request: () => Promise<PermissionStatus>;
  /** Open device settings for this app */
  openSettings: () => Promise<void>;
  /** Manually refresh the permission status */
  refresh: () => Promise<void>;
}

/**
 * Hook for managing a single permission type.
 * Checks the permission on mount and re-checks when the app returns
 * from the background (e.g., after the user changes settings).
 *
 * @param type - The permission type to manage
 * @param customConfig - Optional partial config to override defaults
 * @returns Permission state and control functions
 *
 * @example
 * ```tsx
 * function CameraScreen() {
 *   const { status, isGranted, isBlocked, request, openSettings } = usePermission('camera');
 *
 *   if (!isGranted) {
 *     return (
 *       <View>
 *         <Text>Camera access required</Text>
 *         {isBlocked ? (
 *           <Button onPress={openSettings}>Open Settings</Button>
 *         ) : (
 *           <Button onPress={request}>Allow Camera</Button>
 *         )}
 *       </View>
 *     );
 *   }
 *
 *   return <CameraView />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom config
 * const permission = usePermission('location', {
 *   title: 'Share Your Location',
 *   message: 'We use your location to find nearby restaurants.',
 * });
 * ```
 */
export function usePermission(
  type: PermissionType,
  customConfig?: Partial<PermissionConfig>
): UsePermissionReturn {
  const [status, setStatus] = useState<PermissionStatus>("undetermined");
  const [isLoading, setIsLoading] = useState(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Merge custom config with defaults
  const config: PermissionConfig = {
    ...DEFAULT_PERMISSION_CONFIGS[type],
    ...customConfig,
  };

  /**
   * Check the current permission status
   */
  const checkPermission = useCallback(async () => {
    try {
      const result = await PermissionManager.check(type);
      setStatus(result.status);
    } catch (error) {
      console.error(`[usePermission] Failed to check ${type}:`, error);
    }
  }, [type]);

  /**
   * Refresh permission status (public API)
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await checkPermission();
    setIsLoading(false);
  }, [checkPermission]);

  /**
   * Request the permission
   */
  const request = useCallback(async (): Promise<PermissionStatus> => {
    setIsLoading(true);
    try {
      const result = await PermissionManager.request(type);
      setStatus(result.status);
      return result.status;
    } catch (error) {
      console.error(`[usePermission] Failed to request ${type}:`, error);
      return "undetermined";
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  /**
   * Open device settings
   */
  const openSettings = useCallback(async () => {
    await PermissionManager.openSettings();
  }, []);

  // Check permission on mount
  useEffect(() => {
    let isMounted = true;

    const initialCheck = async () => {
      await checkPermission();
      if (isMounted) {
        setIsLoading(false);
      }
    };

    initialCheck();

    return () => {
      isMounted = false;
    };
  }, [checkPermission]);

  // Re-check when app comes back from background (e.g., returning from Settings)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        checkPermission();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [checkPermission]);

  return {
    status,
    isGranted: status === "granted",
    isBlocked: status === "blocked",
    isLoading,
    config,
    request,
    openSettings,
    refresh,
  };
}
