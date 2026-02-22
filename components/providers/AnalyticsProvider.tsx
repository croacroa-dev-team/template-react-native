/**
 * @fileoverview Analytics provider component
 * Configures and initializes the analytics system on mount and enables
 * automatic screen tracking via Expo Router.
 *
 * Place this near the top of your component tree (e.g. inside the root layout)
 * so that all child routes are tracked automatically.
 *
 * @module components/providers/AnalyticsProvider
 *
 * @example
 * ```tsx
 * // app/_layout.tsx
 * export default function RootLayout() {
 *   return (
 *     <AnalyticsProvider>
 *       <Slot />
 *     </AnalyticsProvider>
 *   );
 * }
 * ```
 */

import React, { useEffect } from "react";

import { Analytics } from "@/services/analytics/analytics-adapter";
import { ENABLE_ANALYTICS, IS_DEV } from "@/constants/config";
import { useTrackScreen } from "@/hooks/useTrackScreen";

// ============================================================================
// Props
// ============================================================================

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Initializes the analytics system and automatically tracks screen views.
 *
 * - Reads `ENABLE_ANALYTICS` from the app config to decide whether tracking
 *   is active.
 * - Calls `Analytics.configure()` and `Analytics.initialize()` once on mount.
 * - Delegates screen tracking to the `useTrackScreen` hook.
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  // Configure and initialize analytics on mount
  useEffect(() => {
    Analytics.configure({
      enabled: ENABLE_ANALYTICS,
      debug: IS_DEV,
    });

    Analytics.initialize().catch((error) => {
      console.error('[AnalyticsProvider] Initialization failed:', error);
    });
  }, []);

  // Automatic screen tracking via Expo Router
  useTrackScreen();

  return <>{children}</>;
}
