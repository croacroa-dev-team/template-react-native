import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { onlineManager, focusManager } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";
import type { AppStateStatus } from "react-native";

/**
 * Configure online state management
 * TanStack Query will pause queries when offline and resume when online
 */
export function setupOnlineManager() {
  onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected);
    });
  });
}

/**
 * Configure focus management
 * Refetch queries when app comes to foreground
 */
export function setupFocusManager() {
  function onAppStateChange(status: AppStateStatus) {
    if (Platform.OS !== "web") {
      focusManager.setFocused(status === "active");
    }
  }

  const subscription = AppState.addEventListener("change", onAppStateChange);
  return () => subscription.remove();
}

/**
 * Create the query client with production-ready defaults
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes by default
        staleTime: 1000 * 60 * 5,
        // Keep unused data in cache for 30 minutes
        gcTime: 1000 * 60 * 30,
        // Retry failed requests up to 3 times
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Don't refetch on window focus in dev (annoying)
        refetchOnWindowFocus: !__DEV__,
        // Refetch on reconnect
        refetchOnReconnect: true,
        // Keep previous data while fetching new data
        placeholderData: (previousData: unknown) => previousData,
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
}

/**
 * Create the async storage persister for offline support
 */
export function createPersister() {
  return createAsyncStoragePersister({
    storage: AsyncStorage,
    key: "REACT_QUERY_CACHE",
    // Throttle writes to storage (1 second)
    throttleTime: 1000,
    // Serialize/deserialize functions
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  });
}

/**
 * Default persist options
 */
export const persistOptions = {
  persister: createPersister(),
  // Maximum age of persisted data (24 hours)
  maxAge: 1000 * 60 * 60 * 24,
  // Only persist successful queries
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { state: { status: string } }) => {
      return query.state.status === "success";
    },
  },
};

// Pre-configured query client singleton
export const queryClient = createQueryClient();
