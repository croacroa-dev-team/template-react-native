/**
 * @fileoverview Analytics type definitions
 * Defines the adapter interface and configuration for the analytics system.
 * @module services/analytics/types
 */

// ============================================================================
// Adapter Interface
// ============================================================================

/**
 * Interface that all analytics adapters must implement.
 * Swap adapters to switch between providers (Mixpanel, Amplitude, etc.)
 * without changing application code.
 */
export interface AnalyticsAdapter {
  /**
   * Initialize the analytics provider.
   * Called once when the app starts.
   */
  initialize(): Promise<void> | void;

  /**
   * Track a custom event with optional properties.
   *
   * @param event - The event name (e.g. "Button Clicked")
   * @param properties - Additional key-value data to attach to the event
   */
  track(event: string, properties?: Record<string, unknown>): void;

  /**
   * Track a screen view.
   *
   * @param name - The screen name or route path
   * @param properties - Additional data such as route segments
   */
  screen(name: string, properties?: Record<string, unknown>): void;

  /**
   * Identify the current user.
   *
   * @param userId - Unique identifier for the user
   * @param traits - Optional user traits (email, name, plan, etc.)
   */
  identify(userId: string, traits?: Record<string, unknown>): void;

  /**
   * Reset analytics state (e.g. on sign out).
   * Clears the identified user and any queued data.
   */
  reset(): void;

  /**
   * Set persistent user properties that are sent with every subsequent event.
   *
   * @param properties - Key-value pairs to persist
   */
  setUserProperties(properties: Record<string, unknown>): void;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Runtime configuration for the analytics system.
 */
export interface AnalyticsConfig {
  /** Whether analytics tracking is enabled */
  enabled: boolean;
  /** Whether to log debug information to the console */
  debug: boolean;
}
