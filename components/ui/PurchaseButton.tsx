/**
 * @fileoverview Standalone purchase button component
 * Wraps the Button component with purchase flow logic.
 * @module components/ui/PurchaseButton
 */

import { useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { usePurchase } from "@/hooks/usePurchase";
import type { Purchase } from "@/services/payments/types";
import type { PressableProps } from "react-native";

// ============================================================================
// Props
// ============================================================================

interface PurchaseButtonProps
  extends Omit<PressableProps, "onPress" | "children"> {
  /** The product ID to purchase */
  productId: string;
  /** Button label text */
  label?: string;
  /** Called after a successful purchase */
  onSuccess?: (purchase: Purchase) => void;
  /** Called when a purchase fails */
  onError?: (error: Error) => void;
  /** Additional className for the button */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * A button that initiates an in-app purchase when pressed.
 * Delegates rendering to the Button component and handles loading state
 * automatically via the usePurchase hook.
 *
 * @example
 * ```tsx
 * <PurchaseButton
 *   productId="premium_monthly"
 *   label="Subscribe Now"
 *   onSuccess={(purchase) => console.log("Purchased!", purchase.id)}
 *   onError={(error) => Alert.alert("Error", error.message)}
 * />
 * ```
 */
export function PurchaseButton({
  productId,
  label = "Subscribe",
  onSuccess,
  onError,
  className,
  ...props
}: PurchaseButtonProps) {
  const { purchase, isLoading } = usePurchase();

  const handlePress = useCallback(async () => {
    const result = await purchase(productId);

    if (result) {
      onSuccess?.(result);
    } else {
      // purchase returns null on error — the hook already set the error state,
      // but we also surface it to the parent via onError if provided.
      onError?.(new Error(`Purchase failed for product: ${productId}`));
    }
  }, [productId, purchase, onSuccess, onError]);

  return (
    <Button
      onPress={handlePress}
      isLoading={isLoading}
      className={className}
      {...props}
    >
      {label}
    </Button>
  );
}
