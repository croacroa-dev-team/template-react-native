import Constants from "expo-constants";

// Environment detection
export const IS_DEV = __DEV__;
export const IS_PREVIEW =
  Constants.expoConfig?.extra?.APP_VARIANT === "preview";
export const IS_PROD = !IS_DEV && !IS_PREVIEW;

// API Configuration
// TODO: Replace with your actual API URLs
export const API_URL = IS_PROD
  ? "https://api.yourapp.com"
  : IS_PREVIEW
    ? "https://staging-api.yourapp.com"
    : "http://localhost:3000";

// App Configuration
export const APP_NAME = Constants.expoConfig?.name || "YourApp";
export const APP_VERSION = Constants.expoConfig?.version || "1.0.0";
export const APP_SCHEME = Constants.expoConfig?.scheme || "yourapp";

// Feature Flags
export const FEATURES = {
  ENABLE_ANALYTICS: IS_PROD,
  ENABLE_CRASH_REPORTING: IS_PROD,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_BIOMETRIC_AUTH: true,
  ENABLE_PERFORMANCE_MONITORING: IS_DEV || IS_PREVIEW,
} as const;

// Export individual flags for convenience
export const ENABLE_ANALYTICS = FEATURES.ENABLE_ANALYTICS;
export const ENABLE_CRASH_REPORTING = FEATURES.ENABLE_CRASH_REPORTING;
export const ENABLE_PUSH_NOTIFICATIONS = FEATURES.ENABLE_PUSH_NOTIFICATIONS;
export const ENABLE_BIOMETRIC_AUTH = FEATURES.ENABLE_BIOMETRIC_AUTH;
export const ENABLE_PERFORMANCE_MONITORING =
  FEATURES.ENABLE_PERFORMANCE_MONITORING;

// Timing Constants
export const TIMING = {
  DEBOUNCE_MS: 300,
  ANIMATION_DURATION_MS: 200,
  TOAST_DURATION_MS: 3000,
  API_TIMEOUT_MS: 30000,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER: "auth_user",
  THEME: "theme_mode",
  ONBOARDING_COMPLETED: "onboarding_completed",
  PUSH_TOKEN: "push_token",
} as const;
