import * as Sentry from "@sentry/react-native";
import { IS_DEV, IS_PROD, APP_VERSION } from "@/constants/config";

// TODO: Replace with your actual Sentry DSN
// Get it from: https://sentry.io -> Project Settings -> Client Keys (DSN)
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || "";

/**
 * Initialize Sentry error tracking
 * Call this early in app startup (before RootLayout)
 */
export function initSentry() {
  if (!SENTRY_DSN) {
    if (IS_DEV) {
      console.log("[Sentry] No DSN configured, skipping initialization");
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: IS_DEV,
    enabled: !IS_DEV, // Only enable in non-dev environments
    environment: IS_PROD ? "production" : "staging",
    release: APP_VERSION,

    // Performance Monitoring
    tracesSampleRate: IS_PROD ? 0.2 : 1.0, // 20% in prod, 100% in staging

    // Session Replay (if needed)
    // replaysSessionSampleRate: 0.1,
    // replaysOnErrorSampleRate: 1.0,

    // Integrations
    integrations: [Sentry.reactNativeTracingIntegration()],

    // Filter out certain errors
    beforeSend(event) {
      // Don't send events in dev
      if (IS_DEV) {
        console.log("[Sentry] Would send event:", event);
        return null;
      }

      // Filter out network errors that are expected
      if (event.message?.includes("Network request failed")) {
        return null;
      }

      return event;
    },
  });
}

/**
 * Capture an exception with optional context
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
) {
  if (IS_DEV) {
    console.error("[Sentry] Exception:", error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message with optional level
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info"
) {
  if (IS_DEV) {
    console.log(`[Sentry] ${level}: ${message}`);
    return;
  }

  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(
  user: { id: string; email?: string; name?: string } | null
) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: "info",
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startInactiveSpan({
    name,
    op,
  });
}

// Re-export Sentry for advanced usage
export { Sentry };
