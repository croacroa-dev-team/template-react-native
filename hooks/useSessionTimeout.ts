import { useState, useEffect, useCallback } from "react";
import { SessionManager } from "@/services/session/session-manager";
import { useAppLifecycle } from "./useAppLifecycle";
import { SESSION } from "@/constants/config";

/**
 * Hook for session timeout management.
 */
export function useSessionTimeout(): {
  isWarning: boolean;
  isExpired: boolean;
  remainingSeconds: number;
  extend: () => void;
} {
  const [isWarning, setIsWarning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.floor(SESSION.TIMEOUT_MS / 1000),
  );

  const extend = useCallback(() => {
    SessionManager.touch();
    setIsWarning(false);
    setIsExpired(false);
  }, []);

  useAppLifecycle({
    onBackground: () => SessionManager.stopMonitoring(),
    onForeground: () => {
      SessionManager.touch();
      SessionManager.startMonitoring();
    },
  });

  useEffect(() => {
    if (!SESSION.ENABLED) return;

    SessionManager.onWarning(() => setIsWarning(true));
    SessionManager.onExpired(() => setIsExpired(true));
    SessionManager.startMonitoring();

    const tick = setInterval(() => {
      setRemainingSeconds(
        Math.floor(SessionManager.getRemainingMs() / 1000),
      );
    }, 1000);

    return () => {
      SessionManager.stopMonitoring();
      clearInterval(tick);
    };
  }, []);

  return { isWarning, isExpired, remainingSeconds, extend };
}
