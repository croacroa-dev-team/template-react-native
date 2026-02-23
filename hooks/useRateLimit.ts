/**
 * @fileoverview Hook to expose the ApiClient's rate limit state to components.
 * Polls the singleton ApiClient every second while rate limited.
 * @module hooks/useRateLimit
 */

import { useState, useEffect, useRef, useCallback } from "react";
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
  const computeState = useCallback((): UseRateLimitReturn => {
    const now = Date.now();
    const until = api.rateLimitedUntil;

    if (now < until) {
      return {
        isRateLimited: true,
        retryAfter: Math.ceil((until - now) / 1000),
        resetTime: new Date(until),
      };
    }

    return { isRateLimited: false, retryAfter: 0, resetTime: null };
  }, []);

  const [state, setState] = useState<UseRateLimitReturn>(computeState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Start polling — every second, re-derive from ApiClient
    intervalRef.current = setInterval(() => {
      const next = computeState();
      setState((prev) => {
        // Only update when values actually change to avoid unnecessary re-renders
        if (
          prev.isRateLimited !== next.isRateLimited ||
          prev.retryAfter !== next.retryAfter
        ) {
          return next;
        }
        return prev;
      });

      // Stop polling once no longer rate limited
      if (!next.isRateLimited && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [computeState]);

  // Also re-start polling whenever rateLimitedUntil changes externally
  // (e.g. a new 429 comes in while hook is mounted)
  useEffect(() => {
    const check = () => {
      const next = computeState();
      setState(next);

      if (next.isRateLimited && !intervalRef.current) {
        intervalRef.current = setInterval(() => {
          const updated = computeState();
          setState((prev) => {
            if (
              prev.isRateLimited !== updated.isRateLimited ||
              prev.retryAfter !== updated.retryAfter
            ) {
              return updated;
            }
            return prev;
          });

          if (!updated.isRateLimited && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }, 1000);
      }
    };

    // Check immediately on mount and whenever the component re-renders
    check();
  }, [computeState]);

  return state;
}
