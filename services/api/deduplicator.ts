/**
 * @fileoverview Request deduplicator — prevents duplicate in-flight requests
 * @module services/api/deduplicator
 */

const inflight = new Map<string, Promise<unknown>>();

function hashBody(body?: unknown): string {
  if (!body) return "";
  try {
    return JSON.stringify(body);
  } catch {
    return "";
  }
}

/**
 * Generates a deduplication key from request parameters.
 */
export function getDeduplicationKey(
  method: string,
  url: string,
  body?: unknown,
): string {
  return `${method}:${url}:${hashBody(body)}`;
}

/**
 * Deduplicates concurrent identical requests.
 */
export function deduplicate<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = fn().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return promise;
}

/** Get number of in-flight requests (for testing) */
export function getInflightCount(): number {
  return inflight.size;
}
