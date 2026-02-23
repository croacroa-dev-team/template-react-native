/**
 * @fileoverview Device diagnostic information utility
 * @module utils/deviceInfo
 */

import * as Device from "expo-device";
import * as Application from "expo-application";
import { Dimensions, Platform } from "react-native";

export interface DeviceDiagnostics {
  os: string;
  osVersion: string;
  deviceModel: string;
  appVersion: string;
  buildNumber: string;
  locale: string;
  timezone: string;
  isEmulator: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
}

/**
 * Collects device diagnostic information for debugging and crash reports.
 */
export async function getDeviceDiagnostics(): Promise<DeviceDiagnostics> {
  const { width, height } = Dimensions.get("window");
  const pixelRatio = Dimensions.get("window").scale ?? 1;

  return {
    os: Platform.OS,
    osVersion: Platform.Version?.toString() ?? "unknown",
    deviceModel: Device.modelName ?? "unknown",
    appVersion: Application.nativeApplicationVersion ?? "unknown",
    buildNumber: Application.nativeBuildVersion ?? "unknown",
    locale: Platform.select({ ios: "en", android: "en", default: "en" }),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isEmulator: !Device.isDevice,
    screenWidth: width,
    screenHeight: height,
    pixelRatio,
  };
}
