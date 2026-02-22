/**
 * @fileoverview Hook for fetching available in-app products
 * Uses TanStack Query for caching and automatic refetching.
 * @module hooks/useProducts
 */

import { useQuery } from "@tanstack/react-query";
import { Payments } from "@/services/payments/payment-adapter";
import type { Product } from "@/services/payments/types";

/**
 * Fetch available products by their store IDs.
 * Results are cached for 5 minutes to avoid unnecessary store lookups.
 *
 * @param productIds - Array of product identifiers to fetch
 * @returns TanStack Query result with products array
 *
 * @example
 * ```tsx
 * function ProductList() {
 *   const { data: products, isLoading } = useProducts(["premium_monthly", "premium_yearly"]);
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return products?.map((p) => <Text key={p.id}>{p.title} — {p.priceString}</Text>);
 * }
 * ```
 */
export function useProducts(productIds: string[]) {
  return useQuery<Product[], Error>({
    queryKey: ["products", productIds],
    queryFn: () => Payments.getProducts(productIds),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: productIds.length > 0,
  });
}
