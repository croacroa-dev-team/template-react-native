/**
 * @fileoverview Retry with exponential backoff and jitter
 * @module services/api/retry
 */

import { RETRY } from "@/constants/config";
import { Logger } from "@/services/logger/logger-adapter";

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitter: boolean;
  retryableStatuses: number[];
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: RETRY.MAX_ATTEMPTS,
  baseDelayMs: RETRY.BASE_DELAY_MS,
  maxDelayMs: RETRY.MAX_DELAY_MS,
  jitter: RETRY.JITTER,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponential = config.baseDelayMs * Math.pow(2, attempt);
  const capped = Math.min(exponential, config.maxDelayMs);
  if (!config.jitter) return capped;
  return capped * (0.5 + Math.random() * 0.5);
}

/**
 * Wraps a function with retry logic using exponential backoff + jitter.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  for (let attempt = 0; attempt < cfg.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLast = attempt === cfg.maxAttempts - 1;
      const status = (error as { status?: number }).status;
      const isRetryable = status
        ? cfg.retryableStatuses.includes(status)
        : true;

      if (isLast || !isRetryable) throw error;

      const delay = calculateDelay(attempt, cfg);
      Logger.warn(
        `Retry attempt ${attempt + 1}/${cfg.maxAttempts} in ${Math.round(delay)}ms`,
        { error: (error as Error).message }
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Retry exhausted");
}
