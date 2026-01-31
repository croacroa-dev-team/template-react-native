/**
 * @fileoverview Background sync service for offline mutation queue
 * Uses expo-task-manager to process queued mutations when the app is in background.
 * @module services/backgroundSync
 */

import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { storage } from "./storage";
import { api } from "./api";
import { IS_DEV } from "@/constants/config";

// Task names
const BACKGROUND_SYNC_TASK = "BACKGROUND_SYNC_TASK";
const MUTATION_QUEUE_KEY = "offline_mutation_queue";

/**
 * Queued mutation structure
 */
export interface QueuedMutation {
  /** Unique identifier for the mutation */
  id: string;
  /** Timestamp when the mutation was queued */
  timestamp: number;
  /** HTTP method */
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  /** API endpoint */
  endpoint: string;
  /** Request body */
  body?: Record<string, unknown>;
  /** Number of retry attempts */
  retryCount: number;
  /** Maximum retries before giving up */
  maxRetries: number;
  /** Optional metadata for tracking */
  metadata?: {
    type: string;
    entityId?: string;
    description?: string;
  };
}

/**
 * Sync result for a single mutation
 */
interface SyncResult {
  id: string;
  success: boolean;
  error?: string;
}

/**
 * Background sync configuration
 */
const SYNC_CONFIG = {
  /** Minimum interval between background fetches (in seconds) */
  MINIMUM_INTERVAL: 15 * 60, // 15 minutes
  /** Maximum retries for a single mutation */
  MAX_RETRIES: 5,
  /** Timeout for the entire sync task (in seconds) */
  TASK_TIMEOUT: 30,
};

// ============================================================================
// Mutation Queue Management
// ============================================================================

/**
 * Add a mutation to the offline queue
 *
 * @example
 * ```ts
 * // In your mutation hook
 * const createPost = useMutation({
 *   mutationFn: async (data) => {
 *     try {
 *       return await api.post('/posts', data);
 *     } catch (error) {
 *       if (isNetworkError(error)) {
 *         await queueMutation({
 *           method: 'POST',
 *           endpoint: '/posts',
 *           body: data,
 *           metadata: { type: 'create_post' },
 *         });
 *         throw new Error('Queued for sync');
 *       }
 *       throw error;
 *     }
 *   },
 * });
 * ```
 */
export async function queueMutation(
  mutation: Omit<QueuedMutation, "id" | "timestamp" | "retryCount" | "maxRetries">
): Promise<string> {
  const queue = await getMutationQueue();

  const queuedMutation: QueuedMutation = {
    ...mutation,
    id: generateId(),
    timestamp: Date.now(),
    retryCount: 0,
    maxRetries: SYNC_CONFIG.MAX_RETRIES,
  };

  queue.push(queuedMutation);
  await saveMutationQueue(queue);

  if (IS_DEV) {
    console.log("[BackgroundSync] Queued mutation:", queuedMutation.id);
  }

  return queuedMutation.id;
}

/**
 * Get the current mutation queue
 */
export async function getMutationQueue(): Promise<QueuedMutation[]> {
  const queue = await storage.get<QueuedMutation[]>(MUTATION_QUEUE_KEY);
  return queue || [];
}

/**
 * Save the mutation queue
 */
async function saveMutationQueue(queue: QueuedMutation[]): Promise<void> {
  await storage.set(MUTATION_QUEUE_KEY, queue);
}

/**
 * Remove a mutation from the queue
 */
export async function removeMutation(id: string): Promise<void> {
  const queue = await getMutationQueue();
  const filtered = queue.filter((m) => m.id !== id);
  await saveMutationQueue(filtered);
}

/**
 * Clear all mutations from the queue
 */
export async function clearMutationQueue(): Promise<void> {
  await storage.set(MUTATION_QUEUE_KEY, []);
}

/**
 * Get the number of pending mutations
 */
export async function getPendingMutationCount(): Promise<number> {
  const queue = await getMutationQueue();
  return queue.length;
}

// ============================================================================
// Sync Processing
// ============================================================================

/**
 * Process a single mutation
 */
async function processMutation(mutation: QueuedMutation): Promise<SyncResult> {
  try {
    switch (mutation.method) {
      case "POST":
        await api.post(mutation.endpoint, mutation.body);
        break;
      case "PUT":
        await api.put(mutation.endpoint, mutation.body);
        break;
      case "PATCH":
        await api.patch(mutation.endpoint, mutation.body);
        break;
      case "DELETE":
        await api.delete(mutation.endpoint);
        break;
    }

    return { id: mutation.id, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { id: mutation.id, success: false, error: message };
  }
}

/**
 * Process all pending mutations
 * Called by background task and can also be triggered manually
 */
export async function processQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  remaining: number;
}> {
  const queue = await getMutationQueue();

  if (queue.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0, remaining: 0 };
  }

  if (IS_DEV) {
    console.log(`[BackgroundSync] Processing ${queue.length} mutations`);
  }

  const results: SyncResult[] = [];
  const updatedQueue: QueuedMutation[] = [];

  for (const mutation of queue) {
    const result = await processMutation(mutation);
    results.push(result);

    if (!result.success) {
      // Check if we should retry
      if (mutation.retryCount < mutation.maxRetries) {
        updatedQueue.push({
          ...mutation,
          retryCount: mutation.retryCount + 1,
        });
      } else {
        // Max retries reached, log and discard
        console.warn(
          `[BackgroundSync] Mutation ${mutation.id} failed after ${mutation.maxRetries} retries:`,
          result.error
        );
      }
    }
  }

  // Save remaining mutations
  await saveMutationQueue(updatedQueue);

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  if (IS_DEV) {
    console.log(
      `[BackgroundSync] Processed: ${results.length}, Succeeded: ${succeeded}, Failed: ${failed}, Remaining: ${updatedQueue.length}`
    );
  }

  return {
    processed: results.length,
    succeeded,
    failed,
    remaining: updatedQueue.length,
  };
}

// ============================================================================
// Background Task Definition
// ============================================================================

/**
 * Define the background sync task
 */
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    const result = await processQueue();

    if (result.processed === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    if (result.failed > 0 && result.succeeded === 0) {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("[BackgroundSync] Task error:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ============================================================================
// Registration Functions
// ============================================================================

/**
 * Register the background sync task
 * Call this during app initialization
 *
 * @example
 * ```tsx
 * // In your app root or initialization
 * useEffect(() => {
 *   registerBackgroundSync();
 * }, []);
 * ```
 */
export async function registerBackgroundSync(): Promise<boolean> {
  try {
    // Check if background fetch is available
    const status = await BackgroundFetch.getStatusAsync();

    if (status === BackgroundFetch.BackgroundFetchStatus.Restricted) {
      console.warn("[BackgroundSync] Background fetch is restricted");
      return false;
    }

    if (status === BackgroundFetch.BackgroundFetchStatus.Denied) {
      console.warn("[BackgroundSync] Background fetch is denied");
      return false;
    }

    // Register the task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: SYNC_CONFIG.MINIMUM_INTERVAL,
      stopOnTerminate: false,
      startOnBoot: true,
    });

    if (IS_DEV) {
      console.log("[BackgroundSync] Background sync registered");
    }

    return true;
  } catch (error) {
    console.error("[BackgroundSync] Registration failed:", error);
    return false;
  }
}

/**
 * Unregister the background sync task
 */
export async function unregisterBackgroundSync(): Promise<void> {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    if (IS_DEV) {
      console.log("[BackgroundSync] Background sync unregistered");
    }
  } catch (error) {
    console.error("[BackgroundSync] Unregistration failed:", error);
  }
}

/**
 * Check if background sync is registered
 */
export async function isBackgroundSyncRegistered(): Promise<boolean> {
  return TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
}

/**
 * Get background fetch status
 */
export async function getBackgroundSyncStatus(): Promise<{
  isAvailable: boolean;
  isRegistered: boolean;
  status: BackgroundFetch.BackgroundFetchStatus;
}> {
  const status = await BackgroundFetch.getStatusAsync();
  const isRegistered = await isBackgroundSyncRegistered();

  return {
    isAvailable: status === BackgroundFetch.BackgroundFetchStatus.Available,
    isRegistered,
    status,
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate a unique ID for mutations
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("timeout") ||
      message.includes("offline")
    );
  }
  return false;
}
