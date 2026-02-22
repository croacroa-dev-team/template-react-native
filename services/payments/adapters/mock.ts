/**
 * @fileoverview Mock payment adapter for development
 * Simulates in-app purchases with configurable delays and an in-memory store.
 * Use this adapter during development to test purchase flows without real stores.
 * @module services/payments/adapters/mock
 */

import type {
  PaymentAdapter,
  Product,
  Purchase,
  SubscriptionInfo,
} from "../types";

// ============================================================================
// Mock Data
// ============================================================================

/** Pre-configured mock products for development */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: "premium_monthly",
    title: "Premium Monthly",
    description: "Unlock all premium features with a monthly subscription",
    price: 9.99,
    priceString: "$9.99",
    currency: "USD",
    type: "subscription",
    subscriptionPeriod: "monthly",
  },
  {
    id: "premium_yearly",
    title: "Premium Yearly",
    description: "Unlock all premium features — save 42% with yearly billing",
    price: 69.99,
    priceString: "$69.99",
    currency: "USD",
    type: "subscription",
    subscriptionPeriod: "yearly",
  },
];

// ============================================================================
// Helpers
// ============================================================================

/** Simulate network/store latency */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Random delay between min and max milliseconds */
function randomDelay(min = 500, max = 1000): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return delay(ms);
}

// ============================================================================
// Mock Adapter
// ============================================================================

/**
 * Development adapter that simulates in-app purchases in memory.
 * All purchases are stored in a local array and reset when the app restarts.
 * Includes configurable artificial delays to mimic real store behaviour.
 */
export class MockPaymentAdapter implements PaymentAdapter {
  /** In-memory record of completed purchases */
  private purchases: Purchase[] = [];

  async initialize(): Promise<void> {
    await randomDelay();

    if (__DEV__) {
      console.log("[Payments] Initialized (mock adapter)");
    }
  }

  async getProducts(ids: string[]): Promise<Product[]> {
    await randomDelay();

    const products = MOCK_PRODUCTS.filter((p) => ids.includes(p.id));

    if (__DEV__) {
      console.log(
        `[Payments] getProducts: requested ${ids.length}, found ${products.length}`
      );
    }

    return products;
  }

  async purchase(productId: string): Promise<Purchase> {
    await randomDelay();

    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    const purchase: Purchase = {
      id: `mock_txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      productId,
      transactionDate: new Date().toISOString(),
      transactionReceipt: `mock_receipt_${Date.now()}`,
    };

    this.purchases.push(purchase);

    if (__DEV__) {
      console.log(`[Payments] Purchase completed:`, purchase);
    }

    return purchase;
  }

  async restorePurchases(): Promise<Purchase[]> {
    await randomDelay();

    if (__DEV__) {
      console.log(
        `[Payments] Restored ${this.purchases.length} purchase(s)`
      );
    }

    return [...this.purchases];
  }

  async getSubscriptionStatus(): Promise<SubscriptionInfo> {
    await randomDelay();

    // Check if the user has any premium purchase
    const hasPremium = this.purchases.some(
      (p) =>
        p.productId === "premium_monthly" ||
        p.productId === "premium_yearly"
    );

    const info: SubscriptionInfo = hasPremium
      ? {
          status: "active",
          productId:
            this.purchases[this.purchases.length - 1]?.productId ?? null,
          expiresAt: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          willRenew: true,
        }
      : {
          status: "none",
          productId: null,
          expiresAt: null,
          willRenew: false,
        };

    if (__DEV__) {
      console.log(`[Payments] Subscription status:`, info.status);
    }

    return info;
  }
}
