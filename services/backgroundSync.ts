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
 * Conflict resolution strategies
 */
export type ConflictResolutionStrategy =
  | "last-write-wins"
  | "first-write-wins"
  | "merge"
  | "manual"
  | "server-wins"
  | "client-wins";

/**
 * Conflict information when a sync conflict is detected
 */
export interface SyncConflict {
  /** The local mutation that caused the conflict */
  localMutation: QueuedMutation;
  /** Server data at the time of conflict (if available) */
  serverData?: Record<string, unknown>;
  /** Error message from the server */
  errorMessage: string;
  /** HTTP status code */
  statusCode: number;
  /** Timestamp when conflict was detected */
  detectedAt: number;
}

/**
 * Conflict resolver function type
 */
export type ConflictResolver = (conflict: SyncConflict) => Promise<{
  action: "retry" | "discard" | "merge";
  mergedData?: Record<string, unknown>;
}>;

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
  /** Conflict resolution strategy for this mutation */
  conflictStrategy?: ConflictResolutionStrategy;
  /** Version/ETag for optimistic locking */
  version?: string | number;
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
  conflict?: SyncConflict;
  statusCode?: number;
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
  /** Default conflict resolution strategy */
  DEFAULT_CONFLICT_STRATEGY: "last-write-wins" as ConflictResolutionStrategy,
};

// Store for conflict handlers
const conflictHandlers: Map<string, ConflictResolver> = new Map();
const pendingConflicts: SyncConflict[] = [];

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
  mutation: Omit<
    QueuedMutation,
    "id" | "timestamp" | "retryCount" | "maxRetries"
  >
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
// Conflict Resolution
// ============================================================================

/**
 * Register a custom conflict resolver for a mutation type
 *
 * @example
 * ```ts
 * registerConflictResolver('update_profile', async (conflict) => {
 *   // Custom merge logic
 *   const merged = {
 *     ...conflict.serverData,
 *     ...conflict.localMutation.body,
 *     updatedAt: Date.now(),
 *   };
 *   return { action: 'merge', mergedData: merged };
 * });
 * ```
 */
export function registerConflictResolver(
  mutationType: string,
  resolver: ConflictResolver
): void {
  conflictHandlers.set(mutationType, resolver);
}

/**
 * Unregister a conflict resolver
 */
export function unregisterConflictResolver(mutationType: string): void {
  conflictHandlers.delete(mutationType);
}

/**
 * Get pending conflicts that need manual resolution
 */
export function getPendingConflicts(): SyncConflict[] {
  return [...pendingConflicts];
}

/**
 * Clear a pending conflict after manual resolution
 */
export function clearPendingConflict(mutationId: string): void {
  const index = pendingConflicts.findIndex(
    (c) => c.localMutation.id === mutationId
  );
  if (index !== -1) {
    pendingConflicts.splice(index, 1);
  }
}

/**
 * Resolve a conflict using the default strategy
 */
async function resolveConflictWithStrategy(
  conflict: SyncConflict,
  strategy: ConflictResolutionStrategy
): Promise<{
  action: "retry" | "discard" | "merge";
  mergedData?: Record<string, unknown>;
}> {
  switch (strategy) {
    case "last-write-wins":
    case "client-wins":
      // Client data takes precedence, retry with same data
      return { action: "retry" };

    case "first-write-wins":
    case "server-wins":
      // Server data takes precedence, discard local changes
      return { action: "discard" };

    case "merge":
      // Attempt automatic merge
      if (conflict.serverData && conflict.localMutation.body) {
        const mergedData = {
          ...conflict.serverData,
          ...conflict.localMutation.body,
          _mergedAt: Date.now(),
          _conflictResolved: true,
        };
        return { action: "merge", mergedData };
      }
      return { action: "retry" };

    case "manual":
      // Add to pending conflicts for user resolution
      pendingConflicts.push(conflict);
      return { action: "discard" }; // Don't retry automatically

    default:
      return { action: "retry" };
  }
}

/**
 * Check if an error indicates a conflict (409 or version mismatch)
 */
function isConflictError(error: unknown): {
  isConflict: boolean;
  statusCode?: number;
  serverData?: Record<string, unknown>;
} {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    if (status === 409 || status === 412) {
      // 409 Conflict or 412 Precondition Failed
      const serverData =
        "data" in error
          ? (error as { data?: Record<string, unknown> }).data
          : undefined;
      return { isConflict: true, statusCode: status, serverData };
    }
  }
  return { isConflict: false };
}

// ============================================================================
// Sync Processing
// ============================================================================

/**
 * Process a single mutation with conflict handling
 */
async function processMutation(mutation: QueuedMutation): Promise<SyncResult> {
  try {
    // Add version header if available for optimistic locking
    const headers: Record<string, string> = {};
    if (mutation.version) {
      headers["If-Match"] = String(mutation.version);
    }

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
    const conflictCheck = isConflictError(error);

    if (conflictCheck.isConflict) {
      const conflict: SyncConflict = {
        localMutation: mutation,
        serverData: conflictCheck.serverData,
        errorMessage: message,
        statusCode: conflictCheck.statusCode || 409,
        detectedAt: Date.now(),
      };

      return {
        id: mutation.id,
        success: false,
        error: message,
        conflict,
        statusCode: conflictCheck.statusCode,
      };
    }

    return { id: mutation.id, success: false, error: message };
  }
}

/**
 * Process all pending mutations with conflict resolution
 * Called by background task and can also be triggered manually
 */
export async function processQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  conflicts: number;
  remaining: number;
}> {
  const queue = await getMutationQueue();

  if (queue.length === 0) {
    return {
      processed: 0,
      succeeded: 0,
      failed: 0,
      conflicts: 0,
      remaining: 0,
    };
  }

  if (IS_DEV) {
    console.log(`[BackgroundSync] Processing ${queue.length} mutations`);
  }

  const results: SyncResult[] = [];
  const updatedQueue: QueuedMutation[] = [];
  let conflictCount = 0;

  for (const mutation of queue) {
    const result = await processMutation(mutation);
    results.push(result);

    if (!result.success) {
      // Check if this is a conflict
      if (result.conflict) {
        conflictCount++;
        const strategy =
          mutation.conflictStrategy || SYNC_CONFIG.DEFAULT_CONFLICT_STRATEGY;

        // Check for custom resolver first
        const customResolver = mutation.metadata?.type
          ? conflictHandlers.get(mutation.metadata.type)
          : null;

        let resolution: {
          action: "retry" | "discard" | "merge";
          mergedData?: Record<string, unknown>;
        };

        if (customResolver) {
          resolution = await customResolver(result.conflict);
        } else {
          resolution = await resolveConflictWithStrategy(
            result.conflict,
            strategy
          );
        }

        if (IS_DEV) {
          console.log(
            `[BackgroundSync] Conflict for ${mutation.id} resolved with action: ${resolution.action}`
          );
        }

        switch (resolution.action) {
          case "retry":
            if (mutation.retryCount < mutation.maxRetries) {
              updatedQueue.push({
                ...mutation,
                retryCount: mutation.retryCount + 1,
              });
            }
            break;
          case "merge":
            if (
              resolution.mergedData &&
              mutation.retryCount < mutation.maxRetries
            ) {
              updatedQueue.push({
                ...mutation,
                body: resolution.mergedData,
                retryCount: mutation.retryCount + 1,
              });
            }
            break;
          case "discard":
            // Don't add to queue, effectively discarding
            break;
        }
      } else {
        // Regular failure, check if we should retry
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
  }

  // Save remaining mutations
  await saveMutationQueue(updatedQueue);

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  if (IS_DEV) {
    console.log(
      `[BackgroundSync] Processed: ${results.length}, Succeeded: ${succeeded}, Failed: ${failed}, Conflicts: ${conflictCount}, Remaining: ${updatedQueue.length}`
    );
  }

  return {
    processed: results.length,
    succeeded,
    failed,
    conflicts: conflictCount,
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
