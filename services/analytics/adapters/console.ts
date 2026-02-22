/**
 * @fileoverview Console analytics adapter for development
 * Logs all analytics calls to the console with an [Analytics] prefix.
 * Use this adapter during development to verify tracking is wired up correctly.
 * @module services/analytics/adapters/console
 */

import type { AnalyticsAdapter } from "../types";

/**
 * Development adapter that logs every analytics call to the console.
 * All output is gated behind `__DEV__` so nothing leaks in production builds.
 */
export class ConsoleAnalyticsAdapter implements AnalyticsAdapter {
  initialize(): void {
    if (__DEV__) {
      console.log("[Analytics] Initialized (console adapter)");
    }
  }

  track(event: string, properties?: Record<string, unknown>): void {
    if (__DEV__) {
      console.log(`[Analytics] Track: ${event}`, properties ?? "");
    }
  }

  screen(name: string, properties?: Record<string, unknown>): void {
    if (__DEV__) {
      console.log(`[Analytics] Screen: ${name}`, properties ?? "");
    }
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    if (__DEV__) {
      console.log(`[Analytics] Identify: ${userId}`, traits ?? "");
    }
  }

  reset(): void {
    if (__DEV__) {
      console.log("[Analytics] Reset");
    }
  }

  setUserProperties(properties: Record<string, unknown>): void {
    if (__DEV__) {
      console.log("[Analytics] User Properties:", properties);
    }
  }
}
