/**
 * @fileoverview Offline detection and handling
 * Provides hooks for tracking network connectivity with React Query integration.
 * @module hooks/useOffline
 */

import { useEffect, useState, useCallback } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import { toast } from "@/utils/toast";
import { Logger } from "@/services/logger/logger-adapter";

/**
 * Options for the useOffline hook
 */
interface UseOfflineOptions {
  /**
   * Whether to show toast notifications when connectivity changes
   * @default true
   */
  showToast?: boolean;
}

/**
 * Hook to track online/offline status
 * Integrates with TanStack Query's online manager
 */
export function useOffline(options: UseOfflineOptions = {}) {
  const { showToast = true } = options;
  const [isOnline, setIsOnline] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then((state) => {
      const online = !!state.isConnected;
      setIsOnline(online);
      setIsInitialized(true);
      onlineManager.setOnline(online);
    });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = !!state.isConnected;
      const wasOnline = isOnline;

      setIsOnline(online);
      onlineManager.setOnline(online);

      // Show toast on status change (after initialization)
      if (showToast && isInitialized) {
        if (!online && wasOnline) {
          toast.info("You're offline", "Some features may be limited");
        } else if (online && !wasOnline) {
          toast.success("Back online", "Syncing data...");
        }
      }
    });

    return () => unsubscribe();
  }, [isOnline, isInitialized, showToast]);

  return {
    isOnline,
    isOffline: !isOnline,
    isInitialized,
  };
}

/**
 * Hook for tracking pending mutations count.
 * Integrates with the backgroundSync mutation queue.
 *
 * @param pollingInterval - How often to check the queue (default: 5000ms)
 * @returns Object with pendingCount, hasPending flag, and refresh function
 *
 * @example
 * ```tsx
 * function SyncIndicator() {
 *   const { hasPending, pendingCount } = usePendingMutations();
 *
 *   if (!hasPending) return null;
 *
 *   return (
 *     <Badge>
 *       {pendingCount} pending
 *     </Badge>
 *   );
 * }
 * ```
 */
export function usePendingMutations(pollingInterval = 5000) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { getMutationQueue } = await import("@/services/backgroundSync");
      const queue = await getMutationQueue();
      setPendingCount(queue.length);
    } catch (error) {
      Logger.error(
        "[usePendingMutations] Failed to get queue:",
        error as Error
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    refresh();

    // Poll for updates
    const interval = setInterval(refresh, pollingInterval);

    return () => clearInterval(interval);
  }, [refresh, pollingInterval]);

  return {
    pendingCount,
    hasPending: pendingCount > 0,
    isLoading,
    refresh,
  };
}
