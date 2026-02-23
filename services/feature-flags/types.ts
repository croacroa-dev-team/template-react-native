/**
 * @fileoverview Feature flag and A/B testing type definitions
 * Defines the adapter interface and configuration for the feature flag system.
 * @module services/feature-flags/types
 */

// ============================================================================
// Adapter Interface
// ============================================================================

/**
 * Interface that all feature flag adapters must implement.
 * Swap adapters to switch between providers (LaunchDarkly, Statsig, etc.)
 * without changing application code.
 */
export interface FeatureFlagAdapter {
  /**
   * Initialize the feature flag provider.
   * Called once when the app starts.
   */
  initialize(): Promise<void>;

  /**
   * Check whether a boolean feature flag is enabled.
   *
   * @param flag - The flag key (e.g. "new_onboarding")
   * @returns `true` if the flag is enabled, `false` otherwise
   */
  isEnabled(flag: string): boolean;

  /**
   * Get the value of a feature flag with an arbitrary type.
   * Returns the provided default when the flag is not found.
   *
   * @param flag - The flag key
   * @param defaultValue - Value to return if the flag is missing
   * @returns The flag value or the default
   */
  getValue<T>(flag: string, defaultValue: T): T;

  /**
   * Get the assigned variant for an A/B test experiment.
   *
   * @param experimentId - The experiment identifier
   * @returns The variant name (e.g. "control", "variant_a") or `null` if the
   *          user is not enrolled
   */
  getExperimentVariant(experimentId: string): string | null;

  /**
   * Identify the current user so the provider can return
   * user-targeted flags and experiments.
   *
   * @param userId - Unique identifier for the user
   * @param attributes - Optional targeting attributes (plan, country, etc.)
   */
  identify(userId: string, attributes?: Record<string, unknown>): void;

  /**
   * Refresh flag values from the remote provider.
   */
  refresh(): Promise<void>;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Runtime configuration for the feature flag system.
 */
export interface FeatureFlagConfig {
  /** Whether feature flag evaluation is enabled */
  enabled: boolean;
  /** How often (in ms) to auto-refresh flags from the remote provider */
  refreshIntervalMs: number;
  /** Whether to log debug information to the console */
  debug: boolean;
}
