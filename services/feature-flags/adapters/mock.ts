/**
 * @fileoverview Mock feature flag adapter for development
 * Provides an in-memory flag store with configurable initial values.
 * Use this adapter during development to test feature gates and experiments
 * without a remote provider.
 * @module services/feature-flags/adapters/mock
 */

import type { FeatureFlagAdapter } from "../types";
import { Logger } from "@/services/logger/logger-adapter";

const log = Logger.withContext({ module: "FeatureFlagsMock" });

// ============================================================================
// Mock Adapter
// ============================================================================

/**
 * Development adapter that stores flags and experiments in memory.
 * Flags can be pre-seeded via the constructor or changed at runtime with
 * the `setFlag()` and `setExperiment()` helpers -- useful for unit tests.
 */
export class MockFeatureFlagAdapter implements FeatureFlagAdapter {
  /** In-memory flag store */
  private flags: Map<string, unknown> = new Map();

  /** In-memory experiment assignments */
  private experiments: Map<string, string> = new Map();

  /**
   * Create a mock adapter with optional initial data.
   *
   * @param initialFlags - Pre-seeded flag key-value pairs
   * @param initialExperiments - Pre-seeded experiment assignments
   */
  constructor(
    initialFlags?: Record<string, unknown>,
    initialExperiments?: Record<string, string>
  ) {
    if (initialFlags) {
      for (const [key, value] of Object.entries(initialFlags)) {
        this.flags.set(key, value);
      }
    }

    if (initialExperiments) {
      for (const [key, variant] of Object.entries(initialExperiments)) {
        this.experiments.set(key, variant);
      }
    }
  }

  async initialize(): Promise<void> {
    log.debug(
      `[FeatureFlags] Initialized (mock adapter — ${this.flags.size} flags, ${this.experiments.size} experiments)`
    );
  }

  isEnabled(flag: string): boolean {
    const value = this.flags.get(flag);
    return typeof value === "boolean" ? value : false;
  }

  getValue<T>(flag: string, defaultValue: T): T {
    if (!this.flags.has(flag)) return defaultValue;
    return this.flags.get(flag) as T;
  }

  getExperimentVariant(experimentId: string): string | null {
    return this.experiments.get(experimentId) ?? null;
  }

  identify(userId: string, attributes?: Record<string, unknown>): void {
    log.debug("[FeatureFlags] Identified user:", { userId, attributes });
  }

  async refresh(): Promise<void> {
    log.debug("[FeatureFlags] Refreshed (mock adapter — no-op)");
  }

  // --------------------------------------------------------------------------
  // Test helpers
  // --------------------------------------------------------------------------

  /**
   * Set or update a flag value at runtime.
   * Useful for toggling flags during tests.
   *
   * @param flag - The flag key
   * @param value - The value to set
   */
  setFlag(flag: string, value: unknown): void {
    this.flags.set(flag, value);
  }

  /**
   * Set or update an experiment assignment at runtime.
   *
   * @param experimentId - The experiment identifier
   * @param variant - The variant name to assign
   */
  setExperiment(experimentId: string, variant: string): void {
    this.experiments.set(experimentId, variant);
  }
}
