/**
 * Analytics Adapter Pattern
 *
 * This module provides an abstraction layer for analytics providers.
 * Supports multiple analytics backends simultaneously.
 */

import { IS_DEV, ENABLE_ANALYTICS } from "@/constants/config";
import { captureException as sentryCapture, addBreadcrumb } from "./sentry";
import { Logger } from "@/services/logger/logger-adapter";

const log = Logger.withContext({ module: "Analytics" });

// ============================================================================
// Types
// ============================================================================

export interface AnalyticsAdapter {
  /**
   * Track a custom event
   */
  track(event: string, properties?: Record<string, unknown>): void;

  /**
   * Identify a user
   */
  identify(userId: string, traits?: Record<string, unknown>): void;

  /**
   * Track a screen view
   */
  screen(name: string, properties?: Record<string, unknown>): void;

  /**
   * Reset the analytics state (on logout)
   */
  reset(): void;

  /**
   * Set user properties that persist across events
   */
  setUserProperties?(properties: Record<string, unknown>): void;

  /**
   * Track revenue/purchase
   */
  trackRevenue?(
    amount: number,
    currency: string,
    productId?: string,
    properties?: Record<string, unknown>
  ): void;

  /**
   * Start a timed event
   */
  startTimer?(event: string): void;

  /**
   * End a timed event and track duration
   */
  endTimer?(event: string, properties?: Record<string, unknown>): void;
}

// ============================================================================
// Console Adapter (Development)
// ============================================================================

const consoleAdapter: AnalyticsAdapter = {
  track(event, properties) {
    console.log(`[Analytics] Track: ${event}`, properties);
  },

  identify(userId, traits) {
    console.log(`[Analytics] Identify: ${userId}`, traits);
  },

  screen(name, properties) {
    console.log(`[Analytics] Screen: ${name}`, properties);
  },

  reset() {
    console.log("[Analytics] Reset");
  },

  setUserProperties(properties) {
    console.log("[Analytics] User Properties:", properties);
  },

  trackRevenue(amount, currency, productId, properties) {
    console.log(`[Analytics] Revenue: ${amount} ${currency}`, {
      productId,
      ...properties,
    });
  },
};

// ============================================================================
// Sentry Adapter (Error Tracking + Basic Analytics)
// ============================================================================

const sentryAdapter: AnalyticsAdapter = {
  track(event, properties) {
    addBreadcrumb("analytics", event, properties);
  },

  identify(userId, traits) {
    // Sentry user is set via setUser in sentry.ts
    addBreadcrumb("user", `Identified: ${userId}`, traits);
  },

  screen(name, properties) {
    addBreadcrumb("navigation", `Screen: ${name}`, properties);
  },

  reset() {
    addBreadcrumb("user", "User reset");
  },
};

// ============================================================================
// Example: Mixpanel Adapter
// ============================================================================

/**
 * Example Mixpanel implementation:
 *
 * import { Mixpanel } from 'mixpanel-react-native';
 *
 * const mixpanel = new Mixpanel('YOUR_PROJECT_TOKEN', true);
 * mixpanel.init();
 *
 * const mixpanelAdapter: AnalyticsAdapter = {
 *   track(event, properties) {
 *     mixpanel.track(event, properties);
 *   },
 *
 *   identify(userId, traits) {
 *     mixpanel.identify(userId);
 *     if (traits) {
 *       mixpanel.getPeople().set(traits);
 *     }
 *   },
 *
 *   screen(name, properties) {
 *     mixpanel.track('Screen View', { screen_name: name, ...properties });
 *   },
 *
 *   reset() {
 *     mixpanel.reset();
 *   },
 *
 *   setUserProperties(properties) {
 *     mixpanel.getPeople().set(properties);
 *   },
 *
 *   trackRevenue(amount, currency, productId, properties) {
 *     mixpanel.getPeople().trackCharge(amount, { currency, productId, ...properties });
 *   },
 * };
 */

// ============================================================================
// Example: Amplitude Adapter
// ============================================================================

/**
 * Example Amplitude implementation:
 *
 * import { Amplitude } from '@amplitude/analytics-react-native';
 *
 * Amplitude.init('YOUR_API_KEY');
 *
 * const amplitudeAdapter: AnalyticsAdapter = {
 *   track(event, properties) {
 *     Amplitude.track(event, properties);
 *   },
 *
 *   identify(userId, traits) {
 *     Amplitude.setUserId(userId);
 *     if (traits) {
 *       const identifyObj = new Amplitude.Identify();
 *       Object.entries(traits).forEach(([key, value]) => {
 *         identifyObj.set(key, value);
 *       });
 *       Amplitude.identify(identifyObj);
 *     }
 *   },
 *
 *   screen(name, properties) {
 *     Amplitude.track('Screen View', { screen_name: name, ...properties });
 *   },
 *
 *   reset() {
 *     Amplitude.reset();
 *   },
 *
 *   setUserProperties(properties) {
 *     const identifyObj = new Amplitude.Identify();
 *     Object.entries(properties).forEach(([key, value]) => {
 *       identifyObj.set(key, value);
 *     });
 *     Amplitude.identify(identifyObj);
 *   },
 *
 *   trackRevenue(amount, currency, productId, properties) {
 *     const revenue = new Amplitude.Revenue()
 *       .setPrice(amount)
 *       .setProductId(productId || 'unknown')
 *       .setRevenueType('purchase');
 *     Amplitude.revenue(revenue);
 *   },
 * };
 */

// ============================================================================
// Multi-Provider Analytics Manager
// ============================================================================

class Analytics implements AnalyticsAdapter {
  private adapters: AnalyticsAdapter[] = [];
  private timers: Map<string, number> = new Map();
  private superProperties: Record<string, unknown> = {};

  /**
   * Add an analytics adapter
   */
  addAdapter(adapter: AnalyticsAdapter): void {
    this.adapters.push(adapter);
  }

  /**
   * Remove all adapters
   */
  clearAdapters(): void {
    this.adapters = [];
  }

  /**
   * Set properties that will be sent with every event
   */
  setSuperProperties(properties: Record<string, unknown>): void {
    this.superProperties = { ...this.superProperties, ...properties };
  }

  /**
   * Clear super properties
   */
  clearSuperProperties(): void {
    this.superProperties = {};
  }

  track(event: string, properties?: Record<string, unknown>): void {
    if (!ENABLE_ANALYTICS && !IS_DEV) return;

    const mergedProperties = { ...this.superProperties, ...properties };

    this.adapters.forEach((adapter) => {
      try {
        adapter.track(event, mergedProperties);
      } catch (error) {
        log.error("Analytics track error:", error as Error);
        sentryCapture(error as Error, { event, properties: mergedProperties });
      }
    });
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!ENABLE_ANALYTICS && !IS_DEV) return;

    this.adapters.forEach((adapter) => {
      try {
        adapter.identify(userId, traits);
      } catch (error) {
        log.error("Analytics identify error:", error as Error);
        sentryCapture(error as Error, { userId });
      }
    });
  }

  screen(name: string, properties?: Record<string, unknown>): void {
    if (!ENABLE_ANALYTICS && !IS_DEV) return;

    const mergedProperties = { ...this.superProperties, ...properties };

    this.adapters.forEach((adapter) => {
      try {
        adapter.screen(name, mergedProperties);
      } catch (error) {
        log.error("Analytics screen error:", error as Error);
      }
    });
  }

  reset(): void {
    this.clearSuperProperties();
    this.timers.clear();

    this.adapters.forEach((adapter) => {
      try {
        adapter.reset();
      } catch (error) {
        log.error("Analytics reset error:", error as Error);
      }
    });
  }

  setUserProperties(properties: Record<string, unknown>): void {
    if (!ENABLE_ANALYTICS && !IS_DEV) return;

    this.adapters.forEach((adapter) => {
      try {
        adapter.setUserProperties?.(properties);
      } catch (error) {
        log.error("Analytics setUserProperties error:", error as Error);
      }
    });
  }

  trackRevenue(
    amount: number,
    currency: string,
    productId?: string,
    properties?: Record<string, unknown>
  ): void {
    if (!ENABLE_ANALYTICS && !IS_DEV) return;

    this.adapters.forEach((adapter) => {
      try {
        adapter.trackRevenue?.(amount, currency, productId, properties);
      } catch (error) {
        log.error("Analytics trackRevenue error:", error as Error);
      }
    });

    // Also track as a regular event for providers that don't support revenue
    this.track("Purchase", {
      amount,
      currency,
      productId,
      ...properties,
    });
  }

  startTimer(event: string): void {
    this.timers.set(event, Date.now());
  }

  endTimer(event: string, properties?: Record<string, unknown>): void {
    const startTime = this.timers.get(event);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.timers.delete(event);
      this.track(event, { ...properties, duration_ms: duration });
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const analytics = new Analytics();

// Initialize with default adapters
if (IS_DEV) {
  analytics.addAdapter(consoleAdapter);
}
analytics.addAdapter(sentryAdapter);

// ============================================================================
// Convenience Exports
// ============================================================================

export const track = analytics.track.bind(analytics);
export const identify = analytics.identify.bind(analytics);
export const screen = analytics.screen.bind(analytics);
export const resetAnalytics = analytics.reset.bind(analytics);
export const setUserProperties = analytics.setUserProperties.bind(analytics);
export const trackRevenue = analytics.trackRevenue.bind(analytics);
export const startTimer = analytics.startTimer.bind(analytics);
export const endTimer = analytics.endTimer.bind(analytics);

// ============================================================================
// Pre-defined Events (Type Safety)
// ============================================================================

export const AnalyticsEvents = {
  // Auth
  SIGN_UP_STARTED: "Sign Up Started",
  SIGN_UP_COMPLETED: "Sign Up Completed",
  SIGN_UP_FAILED: "Sign Up Failed",
  SIGN_IN_STARTED: "Sign In Started",
  SIGN_IN_COMPLETED: "Sign In Completed",
  SIGN_IN_FAILED: "Sign In Failed",
  SIGN_OUT: "Sign Out",
  PASSWORD_RESET_REQUESTED: "Password Reset Requested",

  // Onboarding
  ONBOARDING_STARTED: "Onboarding Started",
  ONBOARDING_STEP_COMPLETED: "Onboarding Step Completed",
  ONBOARDING_COMPLETED: "Onboarding Completed",
  ONBOARDING_SKIPPED: "Onboarding Skipped",

  // Navigation
  SCREEN_VIEW: "Screen View",
  TAB_CHANGED: "Tab Changed",
  DEEP_LINK_OPENED: "Deep Link Opened",

  // User Actions
  PROFILE_UPDATED: "Profile Updated",
  SETTINGS_CHANGED: "Settings Changed",
  NOTIFICATION_ENABLED: "Notification Enabled",
  NOTIFICATION_DISABLED: "Notification Disabled",
  BIOMETRIC_ENABLED: "Biometric Enabled",
  BIOMETRIC_DISABLED: "Biometric Disabled",

  // Errors
  ERROR_OCCURRED: "Error Occurred",
  API_ERROR: "API Error",
  NETWORK_ERROR: "Network Error",

  // Engagement
  FEATURE_USED: "Feature Used",
  BUTTON_CLICKED: "Button Clicked",
  SEARCH_PERFORMED: "Search Performed",
  CONTENT_SHARED: "Content Shared",
} as const;

export type AnalyticsEvent =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];
