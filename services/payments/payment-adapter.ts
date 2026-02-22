/**
 * @fileoverview Payment adapter manager
 * Singleton-style module that delegates all payment calls to a pluggable
 * adapter. Defaults to the mock adapter so purchase flows work out of the box
 * in development without any extra setup.
 *
 * Usage:
 *   import { Payments } from "@/services/payments/payment-adapter";
 *
 *   // Swap the adapter for production (e.g. RevenueCat)
 *   Payments.setAdapter(new RevenueCatAdapter());
 *
 *   // Initialize at app start
 *   await Payments.initialize();
 *
 *   // Fetch products
 *   const products = await Payments.getProducts(["premium_monthly"]);
 *
 * @module services/payments/payment-adapter
 */

import type { PaymentAdapter, Product, Purchase, SubscriptionInfo } from "./types";
import { MockPaymentAdapter } from "./adapters/mock";

// ============================================================================
// Module-level state
// ============================================================================

/** The currently active payment adapter */
let activeAdapter: PaymentAdapter = new MockPaymentAdapter();

// ============================================================================
// Public API
// ============================================================================

/**
 * Central payments facade.
 *
 * Every method delegates to the active adapter so the underlying provider
 * can be swapped without touching calling code.
 */
export const Payments = {
  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------

  /**
   * Replace the active payment adapter.
   * Call this before `initialize()` to switch providers.
   */
  setAdapter(adapter: PaymentAdapter): void {
    activeAdapter = adapter;

    if (__DEV__) {
      console.log("[Payments] Adapter set:", adapter.constructor.name);
    }
  },

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  /** Initialize the active adapter. Should be called once at app start. */
  async initialize(): Promise<void> {
    await activeAdapter.initialize();
  },

  // --------------------------------------------------------------------------
  // Products & Purchases
  // --------------------------------------------------------------------------

  /**
   * Fetch available products by their store IDs.
   *
   * @param ids - Array of product identifiers to fetch
   * @returns Array of available products
   */
  async getProducts(ids: string[]): Promise<Product[]> {
    return activeAdapter.getProducts(ids);
  },

  /**
   * Initiate a purchase for the given product.
   *
   * @param productId - The product to purchase
   * @returns The completed purchase record
   */
  async purchase(productId: string): Promise<Purchase> {
    return activeAdapter.purchase(productId);
  },

  /**
   * Restore previously completed purchases.
   *
   * @returns Array of restored purchases
   */
  async restorePurchases(): Promise<Purchase[]> {
    return activeAdapter.restorePurchases();
  },

  // --------------------------------------------------------------------------
  // Subscriptions
  // --------------------------------------------------------------------------

  /**
   * Get the current subscription status for the user.
   *
   * @returns Current subscription information
   */
  async getSubscriptionStatus(): Promise<SubscriptionInfo> {
    return activeAdapter.getSubscriptionStatus();
  },
};
