import { useState, useEffect, useCallback, useMemo } from "react";
import { SessionManager } from "@/services/session/session-manager";
import { useAppLifecycle } from "./useAppLifecycle";
import { SESSION } from "@/constants/config";

export interface UseSessionTimeoutOptions {
  /** Set to false to disable monitoring (e.g. when the user is unauthenticated). Defaults to true. */
  enabled?: boolean;
}

/**
 * Hook for session timeout management.
 */
export function useSessionTimeout(options?: UseSessionTimeoutOptions): {
  isWarning: boolean;
  isExpired: boolean;
  remainingSeconds: number;
  extend: () => void;
} {
  const enabled = options?.enabled ?? true;
  const [isWarning, setIsWarning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.floor(SESSION.TIMEOUT_MS / 1000)
  );

  const extend = useCallback(() => {
    SessionManager.touch();
    setIsWarning(false);
    setIsExpired(false);
  }, []);

  const lifecycleCallbacks = useMemo(
    () => ({
      onBackground: () => SessionManager.stopMonitoring(),
      onForeground: () => {
        SessionManager.touch();
        SessionManager.startMonitoring();
      },
    }),
    []
  );

  useAppLifecycle(lifecycleCallbacks);

  useEffect(() => {
    if (!SESSION.ENABLED || !enabled) return;

    SessionManager.onWarning(() => setIsWarning(true));
    SessionManager.onExpired(() => setIsExpired(true));
    SessionManager.startMonitoring();

    const tick = setInterval(() => {
      setRemainingSeconds(Math.floor(SessionManager.getRemainingMs() / 1000));
    }, 1000);

    return () => {
      SessionManager.stopMonitoring();
      clearInterval(tick);
    };
  }, [enabled]);

  return { isWarning, isExpired, remainingSeconds, extend };
}
