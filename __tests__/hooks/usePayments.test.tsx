import { renderHook, act, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

import { useProducts } from "@/hooks/useProducts";
import { usePurchase } from "@/hooks/usePurchase";
import { useSubscription } from "@/hooks/useSubscription";
import { Payments } from "@/services/payments/payment-adapter";
import type { Product, Purchase, SubscriptionInfo } from "@/services/payments/types";

// Mock Payments facade
jest.mock("@/services/payments/payment-adapter", () => ({
  Payments: {
    getProducts: jest.fn(),
    purchase: jest.fn(),
    restorePurchases: jest.fn(),
    getSubscriptionStatus: jest.fn(),
  },
}));

const mockPayments = Payments as jest.Mocked<typeof Payments>;

// Query client wrapper for TanStack Query hooks
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

// Test data
const mockProducts: Product[] = [
  {
    id: "premium_monthly",
    title: "Premium Monthly",
    description: "Monthly premium subscription",
    price: 999,
    priceString: "$9.99",
    currency: "USD",
    type: "subscription",
    subscriptionPeriod: "monthly",
  },
  {
    id: "premium_yearly",
    title: "Premium Yearly",
    description: "Yearly premium subscription",
    price: 4999,
    priceString: "$49.99",
    currency: "USD",
    type: "subscription",
    subscriptionPeriod: "yearly",
  },
];

const mockPurchase: Purchase = {
  id: "txn_123",
  productId: "premium_monthly",
  transactionDate: "2024-01-01T00:00:00.000Z",
};

describe("useProducts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it("should return products list from Payments.getProducts", async () => {
    mockPayments.getProducts.mockResolvedValue(mockProducts);

    const { result } = renderHook(
      () => useProducts(["premium_monthly", "premium_yearly"]),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProducts);
    expect(mockPayments.getProducts).toHaveBeenCalledWith([
      "premium_monthly",
      "premium_yearly",
    ]);
  });

  it("should handle loading state", () => {
    mockPayments.getProducts.mockReturnValue(new Promise(() => {})); // Never resolves

    const { result } = renderHook(
      () => useProducts(["premium_monthly"]),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("should handle error state", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockPayments.getProducts.mockRejectedValue(new Error("Store unavailable"));

    const { result } = renderHook(
      () => useProducts(["premium_monthly"]),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Store unavailable");
    consoleSpy.mockRestore();
  });
});

describe("usePurchase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call Payments.purchase with productId", async () => {
    mockPayments.purchase.mockResolvedValue(mockPurchase);

    const { result } = renderHook(() => usePurchase());

    let purchaseResult: Purchase | null = null;
    await act(async () => {
      purchaseResult = await result.current.purchase("premium_monthly");
    });

    expect(mockPayments.purchase).toHaveBeenCalledWith("premium_monthly");
    expect(purchaseResult).toEqual(mockPurchase);
  });

  it("should return loading state during purchase", async () => {
    let resolvePromise: (value: Purchase) => void;
    mockPayments.purchase.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { result } = renderHook(() => usePurchase());

    expect(result.current.isLoading).toBe(false);

    let purchasePromise: Promise<Purchase | null>;
    act(() => {
      purchasePromise = result.current.purchase("premium_monthly");
    });

    // isLoading should be true during the purchase
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise!(mockPurchase);
      await purchasePromise!;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("should handle purchase error", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockPayments.purchase.mockRejectedValue(new Error("Payment declined"));

    const { result } = renderHook(() => usePurchase());

    let purchaseResult: Purchase | null = null;
    await act(async () => {
      purchaseResult = await result.current.purchase("premium_monthly");
    });

    expect(purchaseResult).toBeNull();
    expect(result.current.error?.message).toBe("Payment declined");
    expect(result.current.isLoading).toBe(false);
    consoleSpy.mockRestore();
  });

  it("should call Payments.restorePurchases on restore", async () => {
    mockPayments.restorePurchases.mockResolvedValue([mockPurchase]);

    const { result } = renderHook(() => usePurchase());

    let restoreResult: Purchase[] = [];
    await act(async () => {
      restoreResult = await result.current.restore();
    });

    expect(mockPayments.restorePurchases).toHaveBeenCalled();
    expect(restoreResult).toEqual([mockPurchase]);
  });
});

describe("useSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it("should return subscription info", async () => {
    const mockSubInfo: SubscriptionInfo = {
      status: "active",
      productId: "premium_monthly",
      expiresAt: "2025-01-01T00:00:00.000Z",
      willRenew: true,
    };
    mockPayments.getSubscriptionStatus.mockResolvedValue(mockSubInfo);

    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockSubInfo);
  });

  it("should set isActive to true for active status", async () => {
    mockPayments.getSubscriptionStatus.mockResolvedValue({
      status: "active",
      productId: "premium_monthly",
      expiresAt: "2025-01-01T00:00:00.000Z",
      willRenew: true,
    });

    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isActive).toBe(true);
  });

  it("should set isActive to true for grace_period status", async () => {
    mockPayments.getSubscriptionStatus.mockResolvedValue({
      status: "grace_period",
      productId: "premium_monthly",
      expiresAt: "2025-01-01T00:00:00.000Z",
      willRenew: false,
    });

    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.isPro).toBe(false);
  });

  it("should set isPro to true only for active status", async () => {
    mockPayments.getSubscriptionStatus.mockResolvedValue({
      status: "active",
      productId: "premium_monthly",
      expiresAt: "2025-01-01T00:00:00.000Z",
      willRenew: true,
    });

    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isPro).toBe(true);
  });

  it("should set isActive to false for expired status", async () => {
    mockPayments.getSubscriptionStatus.mockResolvedValue({
      status: "expired",
      productId: "premium_monthly",
      expiresAt: "2024-01-01T00:00:00.000Z",
      willRenew: false,
    });

    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.isPro).toBe(false);
  });

  it("should handle loading state", () => {
    mockPayments.getSubscriptionStatus.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useSubscription(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isActive).toBe(false);
    expect(result.current.isPro).toBe(false);
  });
});
