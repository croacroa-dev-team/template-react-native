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
  ENABLE_SOCIAL_LOGIN: true,
  ENABLE_PAYMENTS: false,
} as const;

// Export individual flags for convenience
export const ENABLE_ANALYTICS = FEATURES.ENABLE_ANALYTICS;
export const ENABLE_CRASH_REPORTING = FEATURES.ENABLE_CRASH_REPORTING;
export const ENABLE_PUSH_NOTIFICATIONS = FEATURES.ENABLE_PUSH_NOTIFICATIONS;
export const ENABLE_BIOMETRIC_AUTH = FEATURES.ENABLE_BIOMETRIC_AUTH;
export const ENABLE_PERFORMANCE_MONITORING =
  FEATURES.ENABLE_PERFORMANCE_MONITORING;
export const ENABLE_SOCIAL_LOGIN = FEATURES.ENABLE_SOCIAL_LOGIN;
export const ENABLE_PAYMENTS = FEATURES.ENABLE_PAYMENTS;

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
  PERMISSION_PREFIX: "@permission_asked_",
  ANALYTICS_USER_ID: "@analytics_user_id",
} as const;

// Social Auth Configuration
export const socialAuth = {
  google: {
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "",
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
  },
} as const;

// Security Configuration
export const SECURITY = {
  /**
   * SSL Pinning configuration for enhanced network security.
   * Add your API server's certificate public key hashes here.
   *
   * To generate a pin from your certificate:
   * 1. Get your server's certificate: openssl s_client -connect api.yourapp.com:443
   * 2. Extract public key: openssl x509 -pubkey -noout -in cert.pem
   * 3. Generate hash: openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
   *
   * @example
   * SSL_PINS: {
   *   "api.yourapp.com": [
   *     "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=", // Primary cert
   *     "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=", // Backup cert
   *   ],
   * }
   */
  SSL_PINS: {
    // TODO: Add your production API certificate pins
    // "api.yourapp.com": [
    //   "sha256/YOUR_CERTIFICATE_HASH_HERE=",
    // ],
  } as Record<string, string[]>,

  /**
   * Enable SSL pinning in production
   * Set to true once you've configured the SSL_PINS above
   */
  ENABLE_SSL_PINNING: IS_PROD && false, // Enable when pins are configured

  /**
   * Request signing configuration
   * Used to sign API requests for added security
   */
  REQUEST_SIGNING: {
    ENABLED: false,
    ALGORITHM: "sha256",
    HEADER_NAME: "X-Request-Signature",
  },
} as const;
