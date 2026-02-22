/**
 * @fileoverview Hook for querying the current subscription status
 * Uses TanStack Query for caching and provides derived boolean helpers.
 * @module hooks/useSubscription
 */

import { useQuery } from "@tanstack/react-query";
import { Payments } from "@/services/payments/payment-adapter";
import type { SubscriptionInfo } from "@/services/payments/types";

/**
 * Query the current user's subscription status.
 * Results are cached for 1 minute so the UI stays responsive without
 * over-querying the payment provider.
 *
 * Returns the full TanStack Query result plus two derived helpers:
 * - `isActive` — true when the subscription is "active" or in "grace_period"
 * - `isPro` — true only when the subscription is "active"
 *
 * @returns TanStack Query result with subscription info and helpers
 *
 * @example
 * ```tsx
 * function PremiumBadge() {
 *   const { isPro, isLoading } = useSubscription();
 *
 *   if (isLoading || !isPro) return null;
 *
 *   return <Badge label="PRO" />;
 * }
 * ```
 */
export function useSubscription() {
  const query = useQuery<SubscriptionInfo, Error>({
    queryKey: ["subscription-status"],
    queryFn: () => Payments.getSubscriptionStatus(),
    staleTime: 1000 * 60, // 1 minute
  });

  const status = query.data?.status;

  return {
    ...query,
    /** True when subscription is active or in grace period */
    isActive: status === "active" || status === "grace_period",
    /** True only when subscription is fully active */
    isPro: status === "active",
  };
}
