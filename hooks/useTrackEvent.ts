/**
 * @fileoverview Custom event tracking hook
 * Returns a stable, memoized `track` function that delegates to the
 * analytics adapter manager.
 * @module hooks/useTrackEvent
 */

import { useCallback } from "react";

import { Analytics } from "@/services/analytics/analytics-adapter";

/**
 * Return type for the useTrackEvent hook.
 */
export interface UseTrackEventReturn {
  /** Fire an analytics event with optional properties */
  track: (event: string, properties?: Record<string, unknown>) => void;
}

/**
 * Provides a memoized `track` function for firing analytics events.
 *
 * The returned function is referentially stable (via `useCallback`) so it
 * is safe to pass as a prop or include in dependency arrays without causing
 * unnecessary re-renders.
 *
 * @returns Object containing the stable `track` function
 *
 * @example
 * ```tsx
 * function CheckoutButton() {
 *   const { track } = useTrackEvent();
 *
 *   const handlePress = () => {
 *     track("Checkout Started", { cartSize: 3 });
 *     navigateToCheckout();
 *   };
 *
 *   return <Button onPress={handlePress} title="Checkout" />;
 * }
 * ```
 */
export function useTrackEvent(): UseTrackEventReturn {
  const track = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      Analytics.track(event, properties);
    },
    []
  );

  return { track };
}
