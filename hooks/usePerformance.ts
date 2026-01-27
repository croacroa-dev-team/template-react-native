import { useEffect, useRef, useCallback, useState } from "react";
import { InteractionManager } from "react-native";
import { IS_DEV, ENABLE_ANALYTICS } from "@/constants/config";
import { analytics, AnalyticsEvents } from "@/services/analytics";

// ============================================================================
// Types
// ============================================================================

interface PerformanceMetrics {
  /**
   * Time since component mounted (ms)
   */
  mountTime: number;

  /**
   * Time for initial render (ms)
   */
  renderTime: number;

  /**
   * Number of re-renders
   */
  renderCount: number;

  /**
   * Last render duration (ms)
   */
  lastRenderDuration: number;

  /**
   * Average FPS (if tracking enabled)
   */
  fps: number;

  /**
   * Memory usage (if available)
   */
  memoryUsage: number | null;
}

interface UsePerformanceOptions {
  /**
   * Name for identifying this component in logs
   */
  name: string;

  /**
   * Enable FPS tracking
   * @default false
   */
  trackFps?: boolean;

  /**
   * Log metrics to console in development
   * @default true
   */
  logInDev?: boolean;

  /**
   * Report metrics to analytics
   * @default false
   */
  reportToAnalytics?: boolean;

  /**
   * Threshold for slow render warning (ms)
   * @default 16
   */
  slowRenderThreshold?: number;
}

interface UsePerformanceReturn {
  /**
   * Current performance metrics
   */
  metrics: PerformanceMetrics;

  /**
   * Mark the start of an operation
   */
  markStart: (name: string) => void;

  /**
   * Mark the end of an operation and get duration
   */
  markEnd: (name: string) => number;

  /**
   * Track a custom metric
   */
  trackMetric: (name: string, value: number) => void;

  /**
   * Reset all metrics
   */
  reset: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for tracking component performance
 *
 * @example
 * ```tsx
 * function MyScreen() {
 *   const { metrics, markStart, markEnd } = usePerformance({
 *     name: 'MyScreen',
 *     trackFps: true,
 *   });
 *
 *   const fetchData = async () => {
 *     markStart('fetchData');
 *     const data = await api.get('/data');
 *     const duration = markEnd('fetchData');
 *     console.log(`Fetch took ${duration}ms`);
 *   };
 *
 *   return <View />;
 * }
 * ```
 */
export function usePerformance(
  options: UsePerformanceOptions
): UsePerformanceReturn {
  const {
    name,
    trackFps = false,
    logInDev = true,
    reportToAnalytics = false,
    slowRenderThreshold = 16, // 60fps = 16.67ms per frame
  } = options;

  const mountTimeRef = useRef(Date.now());
  const renderCountRef = useRef(0);
  const lastRenderStartRef = useRef(Date.now());
  const marksRef = useRef<Map<string, number>>(new Map());
  const fpsRef = useRef(60);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    mountTime: 0,
    renderTime: 0,
    renderCount: 0,
    lastRenderDuration: 0,
    fps: 60,
    memoryUsage: null,
  });

  // Track render count and duration
  useEffect(() => {
    const renderEnd = Date.now();
    const renderDuration = renderEnd - lastRenderStartRef.current;
    renderCountRef.current += 1;

    // Update metrics
    setMetrics((prev) => ({
      ...prev,
      renderCount: renderCountRef.current,
      lastRenderDuration: renderDuration,
      renderTime:
        renderCountRef.current === 1 ? renderDuration : prev.renderTime,
    }));

    // Warn on slow render
    if (renderDuration > slowRenderThreshold && IS_DEV && logInDev) {
      console.warn(
        `[Performance] ${name}: Slow render detected (${renderDuration.toFixed(1)}ms)`
      );
    }

    // Prepare for next render
    lastRenderStartRef.current = Date.now();
  });

  // Track mount time
  useEffect(() => {
    const mountDuration = Date.now() - mountTimeRef.current;

    setMetrics((prev) => ({
      ...prev,
      mountTime: mountDuration,
    }));

    if (IS_DEV && logInDev) {
      console.log(`[Performance] ${name}: Mounted in ${mountDuration}ms`);
    }

    // Report to analytics
    if (reportToAnalytics && ENABLE_ANALYTICS) {
      analytics.track(AnalyticsEvents.SCREEN_VIEW, {
        screen: name,
        mountTime: mountDuration,
      });
    }

    return () => {
      if (IS_DEV && logInDev) {
        console.log(
          `[Performance] ${name}: Unmounted after ${renderCountRef.current} renders`
        );
      }
    };
  }, [name, logInDev, reportToAnalytics]);

  // FPS tracking
  useEffect(() => {
    if (!trackFps) return;

    let animationFrameId: number;
    let isRunning = true;

    const trackFrame = () => {
      if (!isRunning) return;

      frameCountRef.current += 1;
      const now = Date.now();
      const elapsed = now - lastFpsUpdateRef.current;

      // Update FPS every second
      if (elapsed >= 1000) {
        fpsRef.current = Math.round((frameCountRef.current * 1000) / elapsed);
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;

        setMetrics((prev) => ({
          ...prev,
          fps: fpsRef.current,
        }));

        // Warn on low FPS
        if (fpsRef.current < 30 && IS_DEV && logInDev) {
          console.warn(
            `[Performance] ${name}: Low FPS detected (${fpsRef.current})`
          );
        }
      }

      animationFrameId = requestAnimationFrame(trackFrame);
    };

    animationFrameId = requestAnimationFrame(trackFrame);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [trackFps, name, logInDev]);

  /**
   * Mark the start of an operation
   */
  const markStart = useCallback((markName: string) => {
    marksRef.current.set(markName, Date.now());
  }, []);

  /**
   * Mark the end of an operation and get duration
   */
  const markEnd = useCallback(
    (markName: string): number => {
      const start = marksRef.current.get(markName);
      if (!start) {
        console.warn(`[Performance] No start mark found for "${markName}"`);
        return 0;
      }

      const duration = Date.now() - start;
      marksRef.current.delete(markName);

      if (IS_DEV && logInDev) {
        console.log(`[Performance] ${name}.${markName}: ${duration}ms`);
      }

      if (reportToAnalytics && ENABLE_ANALYTICS) {
        analytics.track("Performance Metric", {
          component: name,
          operation: markName,
          duration,
        });
      }

      return duration;
    },
    [name, logInDev, reportToAnalytics]
  );

  /**
   * Track a custom metric
   */
  const trackMetric = useCallback(
    (metricName: string, value: number) => {
      if (IS_DEV && logInDev) {
        console.log(`[Performance] ${name}.${metricName}: ${value}`);
      }

      if (reportToAnalytics && ENABLE_ANALYTICS) {
        analytics.track("Performance Metric", {
          component: name,
          metric: metricName,
          value,
        });
      }
    },
    [name, logInDev, reportToAnalytics]
  );

  /**
   * Reset all metrics
   */
  const reset = useCallback(() => {
    mountTimeRef.current = Date.now();
    renderCountRef.current = 0;
    lastRenderStartRef.current = Date.now();
    marksRef.current.clear();

    setMetrics({
      mountTime: 0,
      renderTime: 0,
      renderCount: 0,
      lastRenderDuration: 0,
      fps: 60,
      memoryUsage: null,
    });
  }, []);

  return {
    metrics,
    markStart,
    markEnd,
    trackMetric,
    reset,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Measure the execution time of an async function
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  options?: { log?: boolean; reportToAnalytics?: boolean }
): Promise<{ result: T; duration: number }> {
  const { log = IS_DEV, reportToAnalytics = false } = options || {};

  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;

  if (log) {
    console.log(`[Performance] ${name}: ${duration}ms`);
  }

  if (reportToAnalytics && ENABLE_ANALYTICS) {
    analytics.track("Performance Metric", {
      operation: name,
      duration,
    });
  }

  return { result, duration };
}

/**
 * Measure the execution time of a sync function
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  options?: { log?: boolean; reportToAnalytics?: boolean }
): { result: T; duration: number } {
  const { log = IS_DEV, reportToAnalytics = false } = options || {};

  const start = Date.now();
  const result = fn();
  const duration = Date.now() - start;

  if (log) {
    console.log(`[Performance] ${name}: ${duration}ms`);
  }

  if (reportToAnalytics && ENABLE_ANALYTICS) {
    analytics.track("Performance Metric", {
      operation: name,
      duration,
    });
  }

  return { result, duration };
}

/**
 * Wait for interactions to complete before executing
 * Useful for deferring heavy operations
 */
export function runAfterInteractions<T>(fn: () => T | Promise<T>): Promise<T> {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(async () => {
      const result = await fn();
      resolve(result);
    });
  });
}

/**
 * Create a debounced function with performance tracking
 */
export function createTrackedDebounce<
  T extends (...args: unknown[]) => unknown,
>(fn: T, delay: number, name: string): T {
  let timeoutId: NodeJS.Timeout;
  let callCount = 0;

  return ((...args: Parameters<T>) => {
    callCount++;
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      if (IS_DEV) {
        console.log(`[Performance] ${name}: Debounced ${callCount} calls to 1`);
      }
      callCount = 0;
      fn(...args);
    }, delay);
  }) as T;
}
