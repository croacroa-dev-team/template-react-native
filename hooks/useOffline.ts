import { useEffect, useState } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

interface UseOfflineOptions {
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
 * Hook for pending mutations count
 * Useful to show sync indicator
 */
export function usePendingMutations() {
  const [pendingCount, setPendingCount] = useState(0);

  // This would need to be integrated with mutation cache
  // For now, return 0 as a placeholder
  return {
    pendingCount,
    hasPending: pendingCount > 0,
  };
}
