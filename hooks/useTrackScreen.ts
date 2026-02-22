/**
 * @fileoverview Automatic screen tracking hook for Expo Router
 * Listens to route changes via usePathname / useSegments and fires
 * an analytics screen event on every navigation.
 * @module hooks/useTrackScreen
 */

import { useEffect, useRef } from "react";
import { usePathname, useSegments } from "expo-router";

import { Analytics } from "@/services/analytics/analytics-adapter";

/**
 * Automatically tracks screen views whenever the Expo Router pathname changes.
 *
 * Place this hook once in your root layout or `AnalyticsProvider` so that every
 * navigation event is recorded without manual instrumentation.
 *
 * @example
 * ```tsx
 * function RootLayout() {
 *   useTrackScreen();
 *   return <Slot />;
 * }
 * ```
 */
export function useTrackScreen(): void {
  const pathname = usePathname();
  const segments = useSegments();
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    // Only fire when the pathname actually changes (avoids duplicate on mount)
    if (pathname && pathname !== previousPathname.current) {
      Analytics.screen(pathname, { segments });
      previousPathname.current = pathname;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- segments is derived from pathname; using pathname as the sole trigger avoids duplicate fires
  }, [pathname]);
}
