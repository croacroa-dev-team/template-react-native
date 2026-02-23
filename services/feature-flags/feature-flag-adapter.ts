/**
 * @fileoverview Feature flag adapter manager
 * Singleton-style module that delegates all feature flag and A/B testing calls
 * to a pluggable adapter. Defaults to the mock adapter so flag checks work out
 * of the box in development without any extra setup.
 *
 * Usage:
 *   import { FeatureFlags } from "@/services/feature-flags/feature-flag-adapter";
 *
 *   // Swap the adapter for production (e.g. LaunchDarkly)
 *   FeatureFlags.setAdapter(new LaunchDarklyAdapter());
 *
 *   // Initialize at app start
 *   await FeatureFlags.initialize();
 *
 *   // Check a flag
 *   if (FeatureFlags.isEnabled("new_checkout")) { ... }
 *
 * @module services/feature-flags/feature-flag-adapter
 */

import type { FeatureFlagAdapter } from "./types";
import { MockFeatureFlagAdapter } from "./adapters/mock";
import { FEATURE_FLAGS } from "@/constants/config";

// ============================================================================
// Module-level state
// ============================================================================

/** The currently active feature flag adapter */
let activeAdapter: FeatureFlagAdapter = new MockFeatureFlagAdapter();

/** Handle for the auto-refresh interval, if running */
let refreshInterval: ReturnType<typeof setInterval> | null = null;

// ============================================================================
// Public API
// ============================================================================

/**
 * Central feature flags facade.
 *
 * Every method delegates to the active adapter so the underlying provider
 * can be swapped without touching calling code.
 */
export const FeatureFlags = {
  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------

  /**
   * Replace the active feature flag adapter.
   * Call this before `initialize()` to switch providers.
   */
  setAdapter(adapter: FeatureFlagAdapter): void {
    activeAdapter = adapter;

    if (__DEV__) {
      console.log(
        "[FeatureFlags] Adapter set:",
        adapter.constructor.name,
      );
    }
  },

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  /** Initialize the active adapter. Should be called once at app start. */
  async initialize(): Promise<void> {
    if (!FEATURE_FLAGS.ENABLED) return;
    await activeAdapter.initialize();
  },

  // --------------------------------------------------------------------------
  // Flag evaluation
  // --------------------------------------------------------------------------

  /**
   * Check whether a boolean feature flag is enabled.
   *
   * @param flag - The flag key
   * @param defaultValue - Value to return when the adapter has no data
   * @returns `true` if the flag is enabled
   */
  isEnabled(flag: string, defaultValue = false): boolean {
    if (!FEATURE_FLAGS.ENABLED) return defaultValue;
    return activeAdapter.isEnabled(flag);
  },

  /**
   * Get the value of a feature flag with an arbitrary type.
   *
   * @param flag - The flag key
   * @param defaultValue - Value to return when the flag is missing
   * @returns The flag value or the default
   */
  getValue<T>(flag: string, defaultValue: T): T {
    if (!FEATURE_FLAGS.ENABLED) return defaultValue;
    return activeAdapter.getValue(flag, defaultValue);
  },

  // --------------------------------------------------------------------------
  // Experiments
  // --------------------------------------------------------------------------

  /**
   * Get the assigned variant for an A/B test experiment.
   *
   * @param experimentId - The experiment identifier
   * @returns The variant name or `null` if the user is not enrolled
   */
  getExperimentVariant(experimentId: string): string | null {
    if (!FEATURE_FLAGS.ENABLED) return null;
    return activeAdapter.getExperimentVariant(experimentId);
  },

  // --------------------------------------------------------------------------
  // User targeting
  // --------------------------------------------------------------------------

  /**
   * Identify the current user for targeted flag evaluation.
   *
   * @param userId - Unique identifier for the user
   * @param attributes - Optional targeting attributes
   */
  identify(userId: string, attributes?: Record<string, unknown>): void {
    if (!FEATURE_FLAGS.ENABLED) return;
    activeAdapter.identify(userId, attributes);
  },

  // --------------------------------------------------------------------------
  // Refresh
  // --------------------------------------------------------------------------

  /** Refresh flag values from the remote provider. */
  async refresh(): Promise<void> {
    if (!FEATURE_FLAGS.ENABLED) return;
    await activeAdapter.refresh();
  },

  /**
   * Start auto-refreshing flags at the interval defined in config.
   * Calls `refresh()` on the active adapter periodically.
   */
  startAutoRefresh(): void {
    if (refreshInterval) return; // already running

    refreshInterval = setInterval(() => {
      activeAdapter.refresh().catch((err) => {
        if (__DEV__) {
          console.warn("[FeatureFlags] Auto-refresh failed:", err);
        }
      });
    }, FEATURE_FLAGS.REFRESH_INTERVAL_MS);

    if (__DEV__) {
      console.log(
        `[FeatureFlags] Auto-refresh started (every ${FEATURE_FLAGS.REFRESH_INTERVAL_MS}ms)`,
      );
    }
  },

  /** Stop the auto-refresh interval. */
  stopAutoRefresh(): void {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;

      if (__DEV__) {
        console.log("[FeatureFlags] Auto-refresh stopped");
      }
    }
  },
};
