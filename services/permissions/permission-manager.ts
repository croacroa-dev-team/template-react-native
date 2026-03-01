/**
 * @fileoverview Centralized permission management service
 * Provides a unified API for checking, requesting, and tracking permissions
 * across different Expo modules.
 * @module services/permissions/permission-manager
 */

import { Platform, Linking } from "react-native";
import { Camera } from "expo-camera";
import * as Location from "expo-location";
import * as Contacts from "expo-contacts";
import * as MediaLibrary from "expo-media-library";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/constants/config";
import { Logger } from "@/services/logger/logger-adapter";
import type {
  PermissionType,
  PermissionResult,
  PermissionStatus,
} from "./types";

const log = Logger.withContext({ module: "Permissions" });

/** AsyncStorage key prefix for tracking asked permissions */
const PERMISSION_ASKED_PREFIX = STORAGE_KEYS.PERMISSION_PREFIX;

/**
 * Normalize native Expo permission status to our unified PermissionStatus.
 * Handles the various status strings returned by different Expo modules.
 *
 * @param nativeStatus - The status string from an Expo permission response
 * @param canAskAgain - Whether the system allows re-requesting the permission
 * @returns Normalized PermissionStatus
 */
export function normalizeStatus(
  nativeStatus: string,
  canAskAgain: boolean
): PermissionStatus {
  switch (nativeStatus) {
    case "granted":
      return "granted";
    case "undetermined":
      return "undetermined";
    case "denied":
      return canAskAgain ? "denied" : "blocked";
    default:
      return "undetermined";
  }
}

/**
 * Permission handler interface for each permission type.
 * Each handler provides check and request methods that return
 * a normalized PermissionResult.
 */
interface PermissionHandler {
  check: () => Promise<PermissionResult>;
  request: () => Promise<PermissionResult>;
}

/**
 * Map of permission handlers for each supported PermissionType.
 * Each handler wraps the corresponding Expo module's permission API.
 */
const permissionHandlers: Record<PermissionType, PermissionHandler> = {
  camera: {
    check: async () => {
      const result = await Camera.getCameraPermissionsAsync();
      return {
        status: normalizeStatus(result.status, result.canAskAgain),
        canAskAgain: result.canAskAgain,
      };
    },
    request: async () => {
      const result = await Camera.requestCameraPermissionsAsync();
      return {
        status: normalizeStatus(result.status, result.canAskAgain),
        canAskAgain: result.canAskAgain,
      };
    },
  },

  location: {
    check: async () => {
      const result = await Location.getForegroundPermissionsAsync();
      return {
        status: normalizeStatus(result.status, result.canAskAgain),
        canAskAgain: result.canAskAgain,
      };
    },
    request: async () => {
      const result = await Location.requestForegroundPermissionsAsync();
      return {
        status: normalizeStatus(result.status, result.canAskAgain),
        canAskAgain: result.canAskAgain,
      };
    },
  },

  locationAlways: {
    check: async () => {
      const result = await Location.getBackgroundPermissionsAsync();
      return {
        status: normalizeStatus(result.status, result.canAskAgain),
        canAskAgain: result.canAskAgain,
      };
    },
    request: async () => {
      const result = await Location.requestBackgroundPermissionsAsync();
      return {
        status: normalizeStatus(result.status, result.canAskAgain),
        canAskAgain: result.canAskAgain,
      };
    },
  },

  contacts: {
    check: async () => {
      const result = await Contacts.getPermissionsAsync();
      return {
        status: normalizeStatus(result.status, result.canAskAgain),
        canAskAgain: result.canAskAgain,
      };
    },
    request: async () => {
      const result = await Contacts.requestPermissionsAsync();
      return {
        status: normalizeStatus(result.status, result.canAskAgain),
        canAskAgain: result.canAskAgain,
      };
    },
  },

  mediaLibrary: {
    check: async () => {
      const result = await MediaLibrary.getPermissionsAsync();
      return {
        status: normalizeStatus(result.status, result.canAskAgain),
        canAskAgain: result.canAskAgain,
      };
    },
    request: async () => {
      const result = await MediaLibrary.requestPermissionsAsync();
      return {
        status: normalizeStatus(result.status, result.canAskAgain),
        canAskAgain: result.canAskAgain,
      };
    },
  },

  microphone: {
    check: async () => {
      const result = await Camera.getMicrophonePermissionsAsync();
      return {
        status: normalizeStatus(result.status, result.canAskAgain),
        canAskAgain: result.canAskAgain,
      };
    },
    request: async () => {
      const result = await Camera.requestMicrophonePermissionsAsync();
      return {
        status: normalizeStatus(result.status, result.canAskAgain),
        canAskAgain: result.canAskAgain,
      };
    },
  },

  notifications: {
    check: async () => {
      const result = await Notifications.getPermissionsAsync();
      return {
        status: normalizeStatus(result.status, result.canAskAgain),
        canAskAgain: result.canAskAgain,
      };
    },
    request: async () => {
      const result = await Notifications.requestPermissionsAsync();
      return {
        status: normalizeStatus(result.status, result.canAskAgain),
        canAskAgain: result.canAskAgain,
      };
    },
  },
};

/**
 * Centralized permission manager.
 * Provides a unified API for all permission operations across the app.
 *
 * @example
 * ```ts
 * import { PermissionManager } from '@/services/permissions/permission-manager';
 *
 * // Check camera permission
 * const result = await PermissionManager.check('camera');
 * if (result.status === 'granted') {
 *   // Camera is available
 * }
 *
 * // Request notification permission
 * const notifResult = await PermissionManager.request('notifications');
 * if (notifResult.status === 'blocked') {
 *   await PermissionManager.openSettings();
 * }
 * ```
 */
export const PermissionManager = {
  /**
   * Check the current status of a permission without requesting it.
   *
   * @param type - The permission type to check
   * @returns The current permission result
   */
  async check(type: PermissionType): Promise<PermissionResult> {
    try {
      const handler = permissionHandlers[type];
      return await handler.check();
    } catch (error) {
      log.error(`Failed to check ${type}`, error as Error);
      return { status: "undetermined", canAskAgain: true };
    }
  },

  /**
   * Request a permission from the user.
   * Records that the permission has been asked in AsyncStorage.
   *
   * @param type - The permission type to request
   * @returns The permission result after the request
   */
  async request(type: PermissionType): Promise<PermissionResult> {
    try {
      const handler = permissionHandlers[type];
      const result = await handler.request();

      // Track that we've asked for this permission
      await AsyncStorage.setItem(`${PERMISSION_ASKED_PREFIX}${type}`, "true");

      return result;
    } catch (error) {
      log.error(`Failed to request ${type}`, error as Error);
      return { status: "undetermined", canAskAgain: true };
    }
  },

  /**
   * Open the device settings so the user can manually change permissions.
   * On iOS, opens the app-specific settings page.
   * On Android, uses Linking.openSettings() to open app info.
   */
  async openSettings(): Promise<void> {
    try {
      if (Platform.OS === "ios") {
        await Linking.openURL("app-settings:");
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      log.error("Failed to open settings", error as Error);
    }
  },

  /**
   * Check whether a permission has been previously asked.
   * Useful for determining whether to show a pre-permission explanation
   * before the system dialog.
   *
   * @param type - The permission type to check
   * @returns Whether the permission has been previously requested
   */
  async hasBeenAsked(type: PermissionType): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(
        `${PERMISSION_ASKED_PREFIX}${type}`
      );
      return value === "true";
    } catch (error) {
      log.error(`Failed to check if ${type} was asked`, error as Error);
      return false;
    }
  },
};
