import { ExpoConfig, ConfigContext } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) return "com.yourcompany.yourapp.dev";
  if (IS_PREVIEW) return "com.yourcompany.yourapp.preview";
  return "com.yourcompany.yourapp";
};

const getAppName = () => {
  if (IS_DEV) return "YourApp (Dev)";
  if (IS_PREVIEW) return "YourApp (Preview)";
  return "YourApp";
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "react-native-template",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "yourapp",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: getUniqueIdentifier(),
    infoPlist: {
      UIBackgroundModes: ["remote-notification", "fetch", "processing"],
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription: "This app uses the camera to take photos.",
      NSPhotoLibraryUsageDescription:
        "This app accesses your photo library to select images.",
      NSLocationWhenInUseUsageDescription:
        "This app uses your location to show nearby results.",
      NSContactsUsageDescription:
        "This app accesses your contacts to find friends.",
      NSMicrophoneUsageDescription:
        "This app uses the microphone to record audio.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: getUniqueIdentifier(),
    permissions: [
      "NOTIFICATIONS",
      "RECEIVE_BOOT_COMPLETED",
      "FOREGROUND_SERVICE",
      "CAMERA",
      "READ_CONTACTS",
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "READ_MEDIA_IMAGES",
      "READ_MEDIA_VIDEO",
      "RECORD_AUDIO",
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
    // PWA Configuration
    name: getAppName(),
    shortName: "YourApp",
    description: "A production-ready React Native application",
    lang: "en",
    themeColor: "#3b82f6",
    backgroundColor: "#ffffff",
    display: "standalone",
    orientation: "portrait",
    startUrl: "/",
    scope: "/",
    // PWA Icons for different sizes
    icons: [
      {
        src: "./assets/images/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "./assets/images/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    // Enable service worker for offline support
    serviceWorker: {
      enabled: true,
    },
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-image-picker",
    "@sentry/react-native",
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: "#ffffff",
      },
    ],
    [
      "expo-background-fetch",
      {
        ios: {
          backgroundModes: ["fetch"],
        },
      },
    ],
    "expo-task-manager",
    "expo-sqlite",
    [
      "expo-camera",
      {
        cameraPermission: "This app uses the camera to take photos.",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "e683c5b3-fb16-4a31-b578-01f3fca1e67a",
    },
  },
});
