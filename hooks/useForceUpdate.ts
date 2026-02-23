/**
 * @fileoverview Hook for app force-update checks
 * Checks on mount whether the running app version satisfies the server's
 * minimum version requirement and exposes the result to the UI.
 * @module hooks/useForceUpdate
 */

import { useEffect, useState } from "react";
import Constants from "expo-constants";

import { FORCE_UPDATE } from "@/constants/config";
import { checkForUpdate } from "@/services/force-update";
import type { ForceUpdateResult } from "@/services/force-update";

// ============================================================================
// Types
// ============================================================================

export interface UseForceUpdateReturn extends ForceUpdateResult {
  /** Whether the check is still in progress */
  isChecking: boolean;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Check on mount whether the app requires a mandatory native update.
 *
 * Uses `Constants.expoConfig?.version` as the current version and the
 * `FORCE_UPDATE` configuration from `constants/config.ts`.
 *
 * When `FORCE_UPDATE.ENABLED` is `false` or `FORCE_UPDATE.CHECK_URL` is
 * empty the hook returns immediately with `isUpdateRequired: false`.
 *
 * @returns Force-update state including loading indicator
 *
 * @example
 * ```tsx
 * function App() {
 *   const { isUpdateRequired, isChecking, storeUrl, currentVersion, minimumVersion } =
 *     useForceUpdate();
 *
 *   if (isChecking) return <SplashScreen />;
 *
 *   if (isUpdateRequired) {
 *     return (
 *       <ForceUpdateScreen
 *         storeUrl={storeUrl}
 *         currentVersion={currentVersion}
 *         minimumVersion={minimumVersion}
 *       />
 *     );
 *   }
 *
 *   return <MainApp />;
 * }
 * ```
 */
export function useForceUpdate(): UseForceUpdateReturn {
  const [isChecking, setIsChecking] = useState(true);
  const [result, setResult] = useState<ForceUpdateResult>({
    isUpdateRequired: false,
    currentVersion: "",
    minimumVersion: "",
    storeUrl: "",
  });

  useEffect(() => {
    // Skip the check entirely when force-update is disabled or unconfigured
    if (!FORCE_UPDATE.ENABLED || !FORCE_UPDATE.CHECK_URL) {
      setIsChecking(false);
      return;
    }

    const currentVersion =
      Constants.expoConfig?.version ?? "1.0.0";

    checkForUpdate({
      checkUrl: FORCE_UPDATE.CHECK_URL,
      currentVersion,
    })
      .then(setResult)
      .finally(() => setIsChecking(false));
  }, []);

  return {
    ...result,
    isChecking,
  };
}
