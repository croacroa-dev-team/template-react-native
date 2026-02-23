/**
 * @fileoverview Hook to expose the ApiClient's rate limit state to components.
 * Polls the singleton ApiClient every second while rate limited.
 * @module hooks/useRateLimit
 */

import { useState, useEffect } from "react";
import { api } from "@/services/api";

interface UseRateLimitReturn {
  /** true while the API client is rate limited */
  isRateLimited: boolean;
  /** Seconds remaining until the rate limit expires (0 when not limited) */
  retryAfter: number;
  /** Date when the rate limit expires, or null when not limited */
  resetTime: Date | null;
}

/**
 * Returns the current rate-limit state of the shared ApiClient singleton.
 *
 * While rate limited the hook polls every second so the UI can show a
 * countdown or disable submit buttons.
 *
 * @example
 * ```tsx
 * const { isRateLimited, retryAfter } = useRateLimit();
 * if (isRateLimited) {
 *   return <Text>Try again in {retryAfter}s</Text>;
 * }
 * ```
 */
export function useRateLimit(): UseRateLimitReturn {
  const [state, setState] = useState<UseRateLimitReturn>({
    isRateLimited: false,
    retryAfter: 0,
    resetTime: null,
  });

  useEffect(() => {
    // Poll every second — the cost is negligible since setState short-circuits
    // when values haven't changed. Continuous polling ensures we always detect
    // new 429 responses even after a previous rate limit window has expired.
    const interval = setInterval(() => {
      const now = Date.now();
      const until = api.rateLimitedUntil;

      if (now < until) {
        setState((prev) => {
          const retryAfter = Math.ceil((until - now) / 1000);
          if (prev.isRateLimited && prev.retryAfter === retryAfter) return prev;
          return { isRateLimited: true, retryAfter, resetTime: new Date(until) };
        });
      } else {
        setState((prev) => {
          if (!prev.isRateLimited) return prev;
          return { isRateLimited: false, retryAfter: 0, resetTime: null };
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return state;
}
