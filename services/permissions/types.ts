/**
 * @fileoverview Permission types and default configurations
 * Centralized type definitions for the permission management system.
 * @module services/permissions/types
 */

/**
 * Supported permission types across the app.
 * Maps to corresponding Expo permission modules.
 */
export type PermissionType =
  | "camera"
  | "location"
  | "locationAlways"
  | "contacts"
  | "mediaLibrary"
  | "microphone"
  | "notifications";

/**
 * Normalized permission status across platforms.
 * - 'undetermined': Permission has not been requested yet
 * - 'granted': Permission has been granted
 * - 'denied': Permission was denied but can be requested again
 * - 'blocked': Permission was denied and cannot be requested again (must open Settings)
 */
export type PermissionStatus =
  | "undetermined"
  | "granted"
  | "denied"
  | "blocked";

/**
 * Result of a permission check or request
 */
export interface PermissionResult {
  /** Normalized permission status */
  status: PermissionStatus;
  /** Whether the system will show the permission dialog if requested again */
  canAskAgain: boolean;
}

/**
 * Configuration for permission request UI
 */
export interface PermissionConfig {
  /** Title shown in the permission request UI */
  title: string;
  /** Descriptive message explaining why the permission is needed */
  message: string;
  /** Ionicons icon name to display */
  icon: string;
}

/**
 * Default UI configurations for each permission type.
 * These can be overridden per-usage via the usePermission hook or PermissionGate component.
 */
export const DEFAULT_PERMISSION_CONFIGS: Record<
  PermissionType,
  PermissionConfig
> = {
  camera: {
    title: "Camera Access",
    message: "We need access to your camera to take photos and scan codes.",
    icon: "camera-outline",
  },
  location: {
    title: "Location Access",
    message:
      "We need access to your location to provide location-based features.",
    icon: "location-outline",
  },
  locationAlways: {
    title: "Background Location",
    message:
      "We need background location access to provide continuous location-based services.",
    icon: "navigate-outline",
  },
  contacts: {
    title: "Contacts Access",
    message:
      "We need access to your contacts to help you connect with friends.",
    icon: "people-outline",
  },
  mediaLibrary: {
    title: "Photo Library Access",
    message:
      "We need access to your photo library to let you select and save photos.",
    icon: "images-outline",
  },
  microphone: {
    title: "Microphone Access",
    message:
      "We need access to your microphone for audio recording and voice features.",
    icon: "mic-outline",
  },
  notifications: {
    title: "Push Notifications",
    message:
      "We need permission to send you notifications about important updates and messages.",
    icon: "notifications-outline",
  },
};
