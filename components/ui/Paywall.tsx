/**
 * @fileoverview Paywall component for displaying subscription products
 * Shows available products, feature highlights, and a restore purchases link.
 * @module components/ui/Paywall
 */

import { View, Text, Pressable, ScrollView } from "react-native";
import { cn } from "@/utils/cn";
import { useProducts } from "@/hooks/useProducts";
import { usePurchase } from "@/hooks/usePurchase";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import type { Product, Purchase } from "@/services/payments/types";

// ============================================================================
// Props
// ============================================================================

interface PaywallProps {
  /** Product IDs to display (must match store product IDs) */
  productIds: string[];
  /** Optional list of feature descriptions to display */
  features?: string[];
  /** Paywall title */
  title?: string;
  /** Paywall subtitle */
  subtitle?: string;
  /** Called after a successful purchase */
  onPurchaseSuccess?: (purchase: Purchase) => void;
  /** Called after a successful restore */
  onRestore?: (purchases: Purchase[]) => void;
  /** Additional className for the outer container */
  className?: string;
}

// ============================================================================
// Sub-components
// ============================================================================

/** Loading skeleton shown while products are being fetched */
function PaywallSkeleton() {
  return (
    <View className="gap-4 px-6">
      <Skeleton height={28} width="60%" />
      <SkeletonText width="80%" />
      <View className="mt-4 gap-3">
        <Skeleton height={120} borderRadius={16} />
        <Skeleton height={120} borderRadius={16} />
      </View>
    </View>
  );
}

/** Feature list item with a checkmark icon */
function FeatureItem({ text }: { text: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
        <Text className="text-sm text-green-600 dark:text-green-400">
          {"\u2713"}
        </Text>
      </View>
      <Text className="flex-1 text-base text-text-light dark:text-text-dark">
        {text}
      </Text>
    </View>
  );
}

/** Card displaying a single product option */
function ProductCard({
  product,
  onPress,
  isLoading,
}: {
  product: Product;
  onPress: () => void;
  isLoading: boolean;
}) {
  const isYearly = product.subscriptionPeriod === "yearly";

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      className={cn(
        "rounded-2xl border-2 p-4",
        isYearly
          ? "border-primary-600 bg-primary-50 dark:bg-primary-950"
          : "border-gray-200 bg-surface-light dark:border-gray-700 dark:bg-surface-dark"
      )}
    >
      {isYearly && (
        <View className="mb-2 self-start rounded-full bg-primary-600 px-3 py-1">
          <Text className="text-xs font-bold text-white">BEST VALUE</Text>
        </View>
      )}

      <Text className="text-lg font-bold text-text-light dark:text-text-dark">
        {product.title}
      </Text>

      <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {product.description}
      </Text>

      <View className="mt-3 flex-row items-baseline gap-1">
        <Text className="text-2xl font-bold text-primary-600 dark:text-primary-400">
          {product.priceString}
        </Text>
        {product.subscriptionPeriod && (
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            /{product.subscriptionPeriod === "monthly" ? "mo" : "yr"}
          </Text>
        )}
      </View>

      <Button
        className="mt-3"
        isLoading={isLoading}
        onPress={onPress}
      >
        {isYearly ? "Subscribe & Save" : "Subscribe"}
      </Button>
    </Pressable>
  );
}

// ============================================================================
// Paywall Component
// ============================================================================

/**
 * Full-screen paywall component for presenting subscription options.
 *
 * Features:
 * - Loads products from the payment adapter via useProducts
 * - Shows a loading skeleton while products are being fetched
 * - Displays a features list with checkmark icons
 * - Maps products to selectable ProductCard sub-components
 * - Includes a "Restore Purchases" link at the bottom
 *
 * @example
 * ```tsx
 * <Paywall
 *   productIds={["premium_monthly", "premium_yearly"]}
 *   title="Go Premium"
 *   subtitle="Unlock all features and remove ads"
 *   features={["Unlimited access", "No ads", "Priority support"]}
 *   onPurchaseSuccess={(purchase) => router.back()}
 * />
 * ```
 */
export function Paywall({
  productIds,
  features,
  title = "Upgrade to Premium",
  subtitle = "Unlock all features and take your experience to the next level.",
  onPurchaseSuccess,
  onRestore,
  className,
}: PaywallProps) {
  const { data: products, isLoading: productsLoading } =
    useProducts(productIds);
  const {
    purchase,
    restore,
    isLoading: purchaseLoading,
  } = usePurchase();

  const handlePurchase = async (productId: string) => {
    const result = await purchase(productId);
    if (result) {
      onPurchaseSuccess?.(result);
    }
  };

  const handleRestore = async () => {
    const restored = await restore();
    if (restored.length > 0) {
      onRestore?.(restored);
    }
  };

  // Loading state
  if (productsLoading) {
    return <PaywallSkeleton />;
  }

  return (
    <ScrollView
      className={cn("flex-1", className)}
      contentContainerClassName="px-6 py-8"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-text-light dark:text-text-dark">
          {title}
        </Text>
        <Text className="mt-2 text-base text-gray-500 dark:text-gray-400">
          {subtitle}
        </Text>
      </View>

      {/* Features */}
      {features && features.length > 0 && (
        <View className="mb-6 gap-3">
          {features.map((feature) => (
            <FeatureItem key={feature} text={feature} />
          ))}
        </View>
      )}

      {/* Products */}
      <View className="gap-4">
        {products?.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPress={() => handlePurchase(product.id)}
            isLoading={purchaseLoading}
          />
        ))}
      </View>

      {/* Empty state */}
      {(!products || products.length === 0) && !productsLoading && (
        <View className="items-center py-8">
          <Text className="text-base text-gray-500 dark:text-gray-400">
            No products available at the moment.
          </Text>
        </View>
      )}

      {/* Restore purchases */}
      <Pressable
        onPress={handleRestore}
        disabled={purchaseLoading}
        className="mt-6 items-center py-3"
      >
        <Text
          className={cn(
            "text-sm",
            purchaseLoading
              ? "text-gray-400 dark:text-gray-600"
              : "text-primary-600 dark:text-primary-400"
          )}
        >
          Restore Purchases
        </Text>
      </Pressable>
    </ScrollView>
  );
}
