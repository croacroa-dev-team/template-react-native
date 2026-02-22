/**
 * @fileoverview Hook for initiating purchases and restoring transactions
 * Wraps the Payments facade with loading/error state management.
 * @module hooks/usePurchase
 */

import { useState, useCallback } from "react";
import { Payments } from "@/services/payments/payment-adapter";
import type { Purchase } from "@/services/payments/types";

/**
 * Return type for the usePurchase hook.
 */
export interface UsePurchaseReturn {
  /** Initiate a purchase for the given product ID */
  purchase: (productId: string) => Promise<Purchase | null>;
  /** Restore previously completed purchases */
  restore: () => Promise<Purchase[]>;
  /** Whether a purchase or restore operation is in progress */
  isLoading: boolean;
  /** The most recent error, or null */
  error: Error | null;
}

/**
 * Hook for initiating purchases and restoring transactions.
 * Provides loading and error state so the UI can react accordingly.
 *
 * @returns Object with purchase/restore functions and state
 *
 * @example
 * ```tsx
 * function BuyButton({ productId }: { productId: string }) {
 *   const { purchase, isLoading, error } = usePurchase();
 *
 *   const handleBuy = async () => {
 *     const result = await purchase(productId);
 *     if (result) {
 *       // Purchase succeeded
 *     }
 *   };
 *
 *   return (
 *     <Button onPress={handleBuy} isLoading={isLoading}>
 *       Buy Now
 *     </Button>
 *   );
 * }
 * ```
 */
export function usePurchase(): UsePurchaseReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const purchase = useCallback(
    async (productId: string): Promise<Purchase | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await Payments.purchase(productId);
        return result;
      } catch (err) {
        const purchaseError =
          err instanceof Error ? err : new Error("Purchase failed");
        setError(purchaseError);

        if (__DEV__) {
          console.warn("[usePurchase] Purchase error:", purchaseError.message);
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const restore = useCallback(async (): Promise<Purchase[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const purchases = await Payments.restorePurchases();
      return purchases;
    } catch (err) {
      const restoreError =
        err instanceof Error ? err : new Error("Restore failed");
      setError(restoreError);

      if (__DEV__) {
        console.warn("[usePurchase] Restore error:", restoreError.message);
      }

      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { purchase, restore, isLoading, error };
}
