# Payments: RevenueCat Integration

Replace the mock payment adapter with [RevenueCat](https://www.revenuecat.com/docs) to handle real in-app purchases and subscriptions.

## Prerequisites

- A RevenueCat account ([sign up here](https://app.revenuecat.com/signup))
- An iOS and/or Android app configured in the RevenueCat dashboard
- At least one product created in App Store Connect or Google Play Console and linked in RevenueCat

## 1. Install the SDK

```bash
npx expo install react-native-purchases
```

> RevenueCat requires native modules. You will need a development build (`npx expo prebuild` or EAS Build) -- Expo Go is not supported.

## 2. Add Environment Variables

Add this to your `.env` file:

```env
EXPO_PUBLIC_REVENUECAT_API_KEY=your_revenuecat_api_key
```

Use the **public SDK key** from RevenueCat dashboard > Project > API Keys. If you ship on both platforms with different keys, add a second variable and pick the right one at runtime.

## 3. Create the Adapter

Create `services/payments/adapters/revenuecat.ts`:

```typescript
import Purchases, {
  type PurchasesStoreProduct,
  type CustomerInfo,
  LOG_LEVEL,
} from "react-native-purchases";
import type {
  PaymentAdapter,
  Product,
  Purchase,
  SubscriptionInfo,
} from "../types";

/** Map a RevenueCat store product to the template's Product shape */
function toProduct(p: PurchasesStoreProduct): Product {
  return {
    id: p.identifier,
    title: p.title,
    description: p.description,
    price: p.price,
    priceString: p.priceString,
    currency: p.currencyCode,
    type: p.productCategory === "SUBSCRIPTION" ? "subscription" : "non_consumable",
    subscriptionPeriod:
      p.subscriptionPeriod === "P1M"
        ? "monthly"
        : p.subscriptionPeriod === "P1Y"
          ? "yearly"
          : p.subscriptionPeriod === "P1W"
            ? "weekly"
            : p.subscriptionPeriod === "P3M"
              ? "quarterly"
              : undefined,
  };
}

/** Derive subscription status from RevenueCat CustomerInfo */
function toSubscriptionInfo(info: CustomerInfo): SubscriptionInfo {
  const entitlement = info.entitlements.active["premium"];

  if (!entitlement) {
    return { status: "none", productId: null, expiresAt: null, willRenew: false };
  }

  return {
    status: entitlement.isActive ? "active" : "expired",
    productId: entitlement.productIdentifier,
    expiresAt: entitlement.expirationDate,
    willRenew: entitlement.willRenew,
  };
}

export class RevenueCatAdapter implements PaymentAdapter {
  async initialize(): Promise<void> {
    // Enable verbose logs in dev builds for easier debugging
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    }

    Purchases.configure({
      apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY!,
    });
  }

  async getProducts(ids: string[]): Promise<Product[]> {
    const products = await Purchases.getProducts(ids);
    return products.map(toProduct);
  }

  async purchase(productId: string): Promise<Purchase> {
    // Fetch the full store product first; RevenueCat needs it
    const [product] = await Purchases.getProducts([productId]);
    if (!product) throw new Error(`Product not found: ${productId}`);

    const { customerInfo, productIdentifier } =
      await Purchases.purchaseStoreProduct(product);

    // Find the latest transaction for this product
    const txnDate =
      customerInfo.allPurchaseDates[productIdentifier] ??
      new Date().toISOString();

    return {
      id: customerInfo.originalAppUserId + "_" + Date.now(),
      productId: productIdentifier,
      transactionDate: txnDate,
    };
  }

  async restorePurchases(): Promise<Purchase[]> {
    const info = await Purchases.restorePurchases();

    return Object.entries(info.allPurchaseDates).map(
      ([productId, date]) => ({
        id: info.originalAppUserId + "_" + productId,
        productId,
        transactionDate: date,
      })
    );
  }

  async getSubscriptionStatus(): Promise<SubscriptionInfo> {
    const info = await Purchases.getCustomerInfo();
    return toSubscriptionInfo(info);
  }
}
```

> The adapter maps to the `"premium"` entitlement by default. Change the string in `toSubscriptionInfo` if your RevenueCat entitlement has a different identifier.

## 4. Activate the Adapter

In your `app/_layout.tsx` (or a dedicated providers file), set the adapter **before** calling `initialize()`:

```typescript
import { Payments } from "@/services/payments/payment-adapter";
import { RevenueCatAdapter } from "@/services/payments/adapters/revenuecat";

// Swap in RevenueCat -- do this once, before initialize()
Payments.setAdapter(new RevenueCatAdapter());
await Payments.initialize();
```

No other files need to change. Every screen that calls `Payments.getProducts()` or `Payments.purchase()` will now go through RevenueCat.

## 5. Verify

1. Create a **development build**: `npx expo run:ios` or `npx expo run:android`
2. Confirm products load: `await Payments.getProducts(["premium_monthly"])`
3. Test a sandbox purchase (use a sandbox Apple ID or Google test account)
4. Call `await Payments.getSubscriptionStatus()` and confirm the status is `"active"`

## What's Next

- **Identify users:** Call `Purchases.logIn(userId)` after authentication so subscriptions follow the user across devices
- **Offerings:** Use RevenueCat Offerings instead of hard-coded product IDs for remote paywall configuration
- **Webhooks:** Connect RevenueCat server-to-server webhooks to your backend for receipt validation
