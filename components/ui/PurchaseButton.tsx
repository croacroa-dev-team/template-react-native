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
  const { purchase, isLoading, error } = usePurchase();

  const handlePress = useCallback(async () => {
    const result = await purchase(productId);

    if (result) {
      onSuccess?.(result);
    } else if (error) {
      // Only call onError when the hook recorded an actual error.
      // A null result without an error means the user cancelled.
      onError?.(error);
    }
  }, [productId, purchase, onSuccess, onError, error]);

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
