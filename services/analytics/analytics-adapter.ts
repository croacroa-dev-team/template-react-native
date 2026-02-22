/**
 * @fileoverview Analytics adapter manager
 * Singleton-style module that delegates all analytics calls to a pluggable
 * adapter. Defaults to the console adapter so tracking works out of the box
 * in development without any extra setup.
 *
 * Usage:
 *   import { Analytics } from "@/services/analytics/analytics-adapter";
 *
 *   // Swap the adapter for production
 *   Analytics.setAdapter(new MixpanelAdapter());
 *
 *   // Configure at runtime
 *   Analytics.configure({ enabled: true, debug: false });
 *
 *   // Track events
 *   Analytics.track("Button Clicked", { screen: "Home" });
 *
 * @module services/analytics/analytics-adapter
 */

import type { AnalyticsAdapter, AnalyticsConfig } from "./types";
import { ConsoleAnalyticsAdapter } from "./adapters/console";

// ============================================================================
// Module-level state
// ============================================================================

/** The currently active analytics adapter */
let activeAdapter: AnalyticsAdapter = new ConsoleAnalyticsAdapter();

/** Runtime configuration — analytics are enabled by default, debug in dev */
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
 * Every method checks `config.enabled` before delegating to the active adapter
 * so analytics can be toggled at runtime without touching calling code.
 */
export const Analytics = {
  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------

  /**
   * Merge new configuration values.
   * Existing keys that are not provided will keep their current value.
   */
  configure(newConfig: Partial<AnalyticsConfig>): void {
    config = { ...config, ...newConfig };

    if (config.debug) {
      console.log("[Analytics] Configured:", config);
    }
  },

  /**
   * Replace the active adapter.
   * Call this before `initialize()` to switch providers.
   */
  setAdapter(adapter: AnalyticsAdapter): void {
    activeAdapter = adapter;

    if (config.debug) {
      console.log("[Analytics] Adapter set:", adapter.constructor.name);
    }
  },

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  /** Initialize the active adapter. Should be called once at app start. */
  async initialize(): Promise<void> {
    if (!config.enabled) return;
    await activeAdapter.initialize();
  },

  // --------------------------------------------------------------------------
  // Tracking
  // --------------------------------------------------------------------------

  /** Track a named event with optional properties. */
  track(event: string, properties?: Record<string, unknown>): void {
    if (!config.enabled) return;
    activeAdapter.track(event, properties);
  },

  /** Track a screen view. */
  screen(name: string, properties?: Record<string, unknown>): void {
    if (!config.enabled) return;
    activeAdapter.screen(name, properties);
  },

  /** Identify the current user. */
  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!config.enabled) return;
    activeAdapter.identify(userId, traits);
  },

  /** Reset analytics state (e.g. on sign out). */
  reset(): void {
    if (!config.enabled) return;
    activeAdapter.reset();
  },

  /** Set persistent user properties. */
  setUserProperties(properties: Record<string, unknown>): void {
    if (!config.enabled) return;
    activeAdapter.setUserProperties(properties);
  },
};
