/**
 * @fileoverview Countdown timer hook for game rounds
 * @module hooks/useCountdown
 */

import { useState, useCallback, useRef, useEffect } from "react";

export interface UseCountdownOptions {
  /** Duration in seconds */
  duration: number;
  /** Called when the countdown reaches 0 */
  onFinish?: () => void;
  /** Whether to start immediately on mount. Defaults to false. */
  autoStart?: boolean;
}

export interface UseCountdownReturn {
  /** Remaining time in seconds */
  remaining: number;
  /** Whether the countdown is currently running */
  isRunning: boolean;
  /** Whether the countdown has finished (reached 0) */
  isFinished: boolean;
  /** Progress from 1 (full) to 0 (finished) */
  progress: number;
  /** Start or resume the countdown */
  start: () => void;
  /** Pause the countdown */
  pause: () => void;
  /** Reset to initial duration and stop */
  reset: () => void;
}

/**
 * Countdown timer with start/pause/reset controls and progress tracking.
 */
export function useCountdown({
  duration,
  onFinish,
  autoStart = false,
}: UseCountdownOptions): UseCountdownReturn {
  const [remaining, setRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isFinished, setIsFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (isFinished) return;
    setIsRunning(true);
  }, [isFinished]);

  const pause = useCallback(() => {
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setRemaining(duration);
    setIsRunning(false);
    setIsFinished(false);
  }, [duration, clearTimer]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          setIsFinished(true);
          onFinishRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [isRunning, clearTimer]);

  // Reset state when duration prop changes
  useEffect(() => {
    clearTimer();
    setRemaining(duration);
    setIsRunning(autoStart);
    setIsFinished(false);
  }, [duration, autoStart, clearTimer]);

  const progress = duration > 0 ? remaining / duration : 0;

  return { remaining, isRunning, isFinished, progress, start, pause, reset };
}
