import { useEffect, useState, useCallback } from "react";
import * as Updates from "expo-updates";
import { Alert, AppState, AppStateStatus } from "react-native";
import { IS_DEV } from "@/constants/config";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error"
  | "no-update";

interface UpdateInfo {
  /**
   * Whether an update is available
   */
  isAvailable: boolean;

  /**
   * Current update status
   */
  status: UpdateStatus;

  /**
   * Download progress (0-100)
   */
  progress: number;

  /**
   * Error message if status is 'error'
   */
  error: string | null;

  /**
   * Update manifest info
   */
  manifest: Updates.Manifest | null;
}

interface UseUpdatesOptions {
  /**
   * Check for updates on mount
   * @default true
   */
  checkOnMount?: boolean;

  /**
   * Check for updates when app returns to foreground
   * @default true
   */
  checkOnForeground?: boolean;

  /**
   * Show alert when update is available
   * @default true
   */
  showAlert?: boolean;

  /**
   * Auto download and apply updates
   * @default false
   */
  autoUpdate?: boolean;

  /**
   * Callback when update is available
   */
  onUpdateAvailable?: (manifest: Updates.Manifest) => void;

  /**
   * Callback when update is downloaded and ready
   */
  onUpdateReady?: () => void;

  /**
   * Callback on error
   */
  onError?: (error: Error) => void;
}

interface UseUpdatesReturn extends UpdateInfo {
  /**
   * Manually check for updates
   */
  checkForUpdate: () => Promise<boolean>;

  /**
   * Download the available update
   */
  downloadUpdate: () => Promise<void>;

  /**
   * Apply the downloaded update (restarts the app)
   */
  applyUpdate: () => Promise<void>;

  /**
   * Reset update state
   */
  reset: () => void;
}

/**
 * Hook for managing OTA updates with expo-updates
 *
 * @example
 * ```tsx
 * function App() {
 *   const { status, isAvailable, checkForUpdate, applyUpdate } = useUpdates({
 *     checkOnMount: true,
 *     showAlert: true,
 *   });
 *
 *   if (status === 'ready') {
 *     return (
 *       <Button onPress={applyUpdate}>
 *         Restart to update
 *       </Button>
 *     );
 *   }
 *
 *   return <App />;
 * }
 * ```
 */
export function useUpdates(options: UseUpdatesOptions = {}): UseUpdatesReturn {
  const {
    checkOnMount = true,
    checkOnForeground = true,
    showAlert = true,
    autoUpdate = false,
    onUpdateAvailable,
    onUpdateReady,
    onError,
  } = options;

  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<Updates.Manifest | null>(null);

  const isAvailable =
    status === "available" || status === "downloading" || status === "ready";

  /**
   * Download the available update
   */
  const downloadUpdate = useCallback(async (): Promise<void> => {
    if (IS_DEV || !Updates.isEnabled) {
      return;
    }

    try {
      setStatus("downloading");
      setProgress(0);

      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90));
      }, 200);

      await Updates.fetchUpdateAsync();

      clearInterval(progressInterval);
      setProgress(100);
      setStatus("ready");
      onUpdateReady?.();
    } catch (e) {
      const err = e as Error;
      setStatus("error");
      setError(err.message);
      onError?.(err);
    }
  }, [onUpdateReady, onError]);

  /**
   * Apply the downloaded update (restarts the app)
   */
  const applyUpdate = useCallback(async (): Promise<void> => {
    if (IS_DEV || !Updates.isEnabled) {
      return;
    }

    try {
      await Updates.reloadAsync();
    } catch (e) {
      const err = e as Error;
      setStatus("error");
      setError(err.message);
      onError?.(err);
    }
  }, [onError]);

  /**
   * Check for available updates
   */
  const checkForUpdate = useCallback(async (): Promise<boolean> => {
    // Skip in development
    if (IS_DEV || !Updates.isEnabled) {
      return false;
    }

    try {
      setStatus("checking");
      setError(null);

      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        setStatus("available");
        setManifest(update.manifest);
        onUpdateAvailable?.(update.manifest);

        if (showAlert && !autoUpdate) {
          Alert.alert(
            "Update Available",
            "A new version of the app is available. Would you like to update now?",
            [
              { text: "Later", style: "cancel" },
              {
                text: "Update",
                onPress: () => downloadUpdate(),
              },
            ]
          );
        }

        if (autoUpdate) {
          await downloadUpdate();
        }

        return true;
      } else {
        setStatus("no-update");
        return false;
      }
    } catch (e) {
      const err = e as Error;
      setStatus("error");
      setError(err.message);
      onError?.(err);
      return false;
    }
  }, [
    showAlert,
    autoUpdate,
    onUpdateAvailable,
    onError,
    downloadUpdate,
    applyUpdate,
  ]);

  /**
   * Reset update state
   */
  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
    setManifest(null);
  }, []);

  // Check on mount
  useEffect(() => {
    if (checkOnMount) {
      checkForUpdate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkOnMount]);

  // Check when app returns to foreground
  useEffect(() => {
    if (!checkOnForeground) return;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        checkForUpdate();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription.remove();
  }, [checkOnForeground, checkForUpdate]);

  return {
    isAvailable,
    status,
    progress,
    error,
    manifest,
    checkForUpdate,
    downloadUpdate,
    applyUpdate,
    reset,
  };
}

/**
 * Get current update info
 */
export function getUpdateInfo(): {
  isEnabled: boolean;
  channel: string | null;
  runtimeVersion: string | null;
  updateId: string | null;
  createdAt: Date | null;
} {
  if (IS_DEV || !Updates.isEnabled) {
    return {
      isEnabled: false,
      channel: null,
      runtimeVersion: null,
      updateId: null,
      createdAt: null,
    };
  }

  return {
    isEnabled: Updates.isEnabled,
    channel: Updates.channel,
    runtimeVersion: Updates.runtimeVersion,
    updateId: Updates.updateId,
    createdAt: Updates.createdAt,
  };
}

/**
 * Force check and apply update (useful for settings screen)
 */
export async function forceUpdate(): Promise<void> {
  if (IS_DEV || !Updates.isEnabled) {
    Alert.alert(
      "Development Mode",
      "Updates are not available in development."
    );
    return;
  }

  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      Alert.alert("Updating...", "Downloading the latest version.");
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } else {
      Alert.alert("Up to Date", "You're running the latest version.");
    }
  } catch {
    Alert.alert(
      "Update Failed",
      "Could not check for updates. Please try again."
    );
  }
}
