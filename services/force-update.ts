/**
 * @fileoverview Force update service for mandatory native app updates
 * Checks a remote endpoint for the minimum required app version and
 * determines whether the user must update before continuing.
 * @module services/force-update
 */

// ============================================================================
// Types
// ============================================================================

export interface ForceUpdateConfig {
  /** API endpoint that returns { minimumVersion, storeUrl } */
  checkUrl: string;
  /** The currently running app version (e.g. "1.2.3") */
  currentVersion: string;
}

export interface ForceUpdateResponse {
  /** Minimum version the server requires */
  minimumVersion: string;
  /** App Store or Play Store URL for the update */
  storeUrl: string;
}

export interface ForceUpdateResult {
  /** Whether the user must update before using the app */
  isUpdateRequired: boolean;
  /** The version currently running */
  currentVersion: string;
  /** The minimum version required by the server */
  minimumVersion: string;
  /** Store URL to open for the update */
  storeUrl: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Compare two semver-style version strings segment by segment.
 * Returns true when `current` is older than `minimum`.
 *
 * @example
 * isVersionLessThan("1.2.3", "1.3.0") // true
 * isVersionLessThan("2.0.0", "1.9.9") // false
 * isVersionLessThan("1.2.3", "1.2.3") // false
 */
export function isVersionLessThan(current: string, minimum: string): boolean {
  const currentParts = current.split(".").map(Number);
  const minimumParts = minimum.split(".").map(Number);

  const length = Math.max(currentParts.length, minimumParts.length);

  for (let i = 0; i < length; i++) {
    const curr = currentParts[i] ?? 0;
    const min = minimumParts[i] ?? 0;

    if (curr < min) return true;
    if (curr > min) return false;
  }

  return false;
}

// ============================================================================
// Main
// ============================================================================

const NO_UPDATE_RESULT: ForceUpdateResult = {
  isUpdateRequired: false,
  currentVersion: "",
  minimumVersion: "",
  storeUrl: "",
};

/**
 * Check whether the app needs a mandatory native update.
 *
 * Fetches the `checkUrl`, compares the server-provided `minimumVersion`
 * against `currentVersion` using semver-style comparison, and returns the
 * result.
 *
 * - If `FORCE_UPDATE.ENABLED` is false or `CHECK_URL` is empty the caller
 *   should skip the call entirely (handled in the hook).
 * - Network / parsing errors are swallowed and return `isUpdateRequired: false`
 *   so the app is never blocked by a transient failure.
 *
 * @param config - The force update configuration
 * @returns The result of the version check
 *
 * @example
 * ```ts
 * const result = await checkForUpdate({
 *   checkUrl: "https://api.example.com/app/version",
 *   currentVersion: "1.0.0",
 * });
 *
 * if (result.isUpdateRequired) {
 *   // Show force-update screen
 * }
 * ```
 */
export async function checkForUpdate(
  config: ForceUpdateConfig
): Promise<ForceUpdateResult> {
  const { checkUrl, currentVersion } = config;

  if (!checkUrl) {
    return NO_UPDATE_RESULT;
  }

  try {
    const response = await fetch(checkUrl);

    if (!response.ok) {
      return NO_UPDATE_RESULT;
    }

    const data: ForceUpdateResponse = await response.json();
    const { minimumVersion, storeUrl } = data;

    if (!minimumVersion || !storeUrl) {
      return NO_UPDATE_RESULT;
    }

    const isUpdateRequired = isVersionLessThan(currentVersion, minimumVersion);

    return {
      isUpdateRequired,
      currentVersion,
      minimumVersion,
      storeUrl,
    };
  } catch {
    // Network errors, JSON parse errors, etc. — never block the app.
    return NO_UPDATE_RESULT;
  }
}
