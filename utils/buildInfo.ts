/**
 * @fileoverview Build metadata utility
 * @module utils/buildInfo
 */

import * as Application from "expo-application";
import { Platform } from "react-native";

export interface BuildInfo {
  version: string;
  buildNumber: string;
  bundleId: string;
  platform: string;
}

/**
 * Get static build metadata (synchronous).
 */
export function getBuildInfo(): BuildInfo {
  return {
    version: Application.nativeApplicationVersion ?? "unknown",
    buildNumber: Application.nativeBuildVersion ?? "unknown",
    bundleId: Application.applicationId ?? "unknown",
    platform: Platform.OS,
  };
}

/**
 * Get extended build info including install time (async).
 */
export async function getExtendedBuildInfo(): Promise<
  BuildInfo & { installTime: Date | null }
> {
  const base = getBuildInfo();
  let installTime: Date | null = null;

  if (Platform.OS === "ios") {
    installTime = await Application.getInstallationTimeAsync();
  }

  return { ...base, installTime };
}
