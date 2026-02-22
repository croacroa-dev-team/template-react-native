/**
 * @fileoverview Payment and subscription type definitions
 * Defines the adapter interface, product/purchase models, and subscription types
 * for the payment system.
 * @module services/payments/types
 */

// ============================================================================
// Product Types
// ============================================================================

/** The type of in-app product */
export type ProductType = "consumable" | "non_consumable" | "subscription";

/** Subscription billing period */
export type SubscriptionPeriod = "weekly" | "monthly" | "quarterly" | "yearly";

/**
 * Represents a purchasable product from the app store.
 */
export interface Product {
  /** Unique product identifier (matches store product ID) */
  id: string;
  /** Display title of the product */
  title: string;
  /** Short description of the product */
  description: string;
  /** Numeric price in the smallest currency unit */
  price: number;
  /** Localized price string for display (e.g. "$9.99") */
  priceString: string;
  /** ISO 4217 currency code (e.g. "USD") */
  currency: string;
  /** The type of product */
  type: ProductType;
  /** Billing period for subscription products */
  subscriptionPeriod?: SubscriptionPeriod;
}

// ============================================================================
// Purchase Types
// ============================================================================

/**
 * Represents a completed purchase transaction.
 */
export interface Purchase {
  /** Unique purchase/transaction identifier */
  id: string;
  /** The product that was purchased */
  productId: string;
  /** ISO 8601 date string of the transaction */
  transactionDate: string;
  /** Optional receipt data for server-side validation */
  transactionReceipt?: string;
}

// ============================================================================
// Subscription Types
// ============================================================================

/** Current status of a user's subscription */
export type SubscriptionStatus =
  | "active"
  | "expired"
  | "cancelled"
  | "grace_period"
  | "none";

/**
 * Detailed information about a user's subscription.
 */
export interface SubscriptionInfo {
  /** Current subscription status */
  status: SubscriptionStatus;
  /** The subscribed product ID, or null if no subscription */
  productId: string | null;
  /** ISO 8601 expiration date, or null if no subscription */
  expiresAt: string | null;
  /** Whether the subscription will auto-renew */
  willRenew: boolean;
}

// ============================================================================
// Adapter Interface
// ============================================================================

/**
 * Interface that all payment adapters must implement.
 * Swap adapters to switch between providers (RevenueCat, Qonversion, etc.)
 * without changing application code.
 */
export interface PaymentAdapter {
  /**
   * Initialize the payment provider.
   * Called once when the app starts.
   */
  initialize(): Promise<void>;

  /**
   * Fetch available products by their store IDs.
   *
   * @param ids - Array of product identifiers to fetch
   * @returns Array of available products
   */
  getProducts(ids: string[]): Promise<Product[]>;

  /**
   * Initiate a purchase for the given product.
   *
   * @param productId - The product to purchase
   * @returns The completed purchase record
   * @throws Error if the purchase fails or is cancelled
   */
  purchase(productId: string): Promise<Purchase>;

  /**
   * Restore previously completed purchases.
   * Useful when a user reinstalls the app or switches devices.
   *
   * @returns Array of restored purchases
   */
  restorePurchases(): Promise<Purchase[]>;

  /**
   * Get the current subscription status for the user.
   *
   * @returns Current subscription information
   */
  getSubscriptionStatus(): Promise<SubscriptionInfo>;
}
