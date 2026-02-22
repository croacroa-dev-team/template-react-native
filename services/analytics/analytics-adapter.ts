/**
 * @fileoverview Analytics adapter facade
 * Delegates all analytics calls to the pre-existing multi-provider analytics
 * system in `@/services/analytics` so there is a single source of truth.
 *
 * Consumers that import `Analytics` from this module (e.g. AnalyticsProvider,
 * useTrackScreen, useTrackEvent) will ultimately go through the same pipeline
 * as direct callers of `@/services/analytics`.
 *
 * @module services/analytics/analytics-adapter
 */

import {
  track,
  screen,
  identify,
  resetAnalytics,
  setUserProperties,
} from "@/services/analytics";
import type { AnalyticsConfig } from "./types";

// ============================================================================
// Module-level state
// ============================================================================

/** Runtime configuration */
let config: AnalyticsConfig = {
  enabled: true,
  debug: __DEV__,
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Central analytics facade.
 *
 * Every method delegates to the pre-existing multi-provider analytics singleton
 * exported from `@/services/analytics`.
 */
export const Analytics = {
  /**
   * Merge new configuration values.
   */
  configure(newConfig: Partial<AnalyticsConfig>): void {
    config = { ...config, ...newConfig };

    if (config.debug) {
      console.log("[Analytics] Configured:", config);
    }
  },

  /**
   * Initialize analytics. The underlying system auto-initializes adapters on
   * import, so this is effectively a no-op but kept for API compatibility.
   */
  async initialize(): Promise<void> {
    if (!config.enabled) return;
    if (config.debug) {
      console.log("[Analytics] Initialized (delegating to services/analytics)");
    }
  },

  /** Track a named event with optional properties. */
  track(event: string, properties?: Record<string, unknown>): void {
    if (!config.enabled) return;
    track(event, properties);
  },

  /** Track a screen view. */
  screen(name: string, properties?: Record<string, unknown>): void {
    if (!config.enabled) return;
    screen(name, properties);
  },

  /** Identify the current user. */
  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!config.enabled) return;
    identify(userId, traits);
  },

  /** Reset analytics state (e.g. on sign out). */
  reset(): void {
    if (!config.enabled) return;
    resetAnalytics();
  },

  /** Set persistent user properties. */
  setUserProperties(properties: Record<string, unknown>): void {
    if (!config.enabled) return;
    setUserProperties(properties);
  },
};
