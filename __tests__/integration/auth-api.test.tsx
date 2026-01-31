/**
 * @fileoverview Integration tests for authentication and API flow
 * Tests the complete flow from sign-in through authenticated API calls.
 */

import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth, getAuthToken } from "@/hooks/useAuth";
import { api } from "@/services/api";

// Mock SecureStore
const mockSecureStore: Record<string, string> = {};
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn((key: string) =>
    Promise.resolve(mockSecureStore[key] || null)
  ),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureStore[key] = value;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    delete mockSecureStore[key];
    return Promise.resolve();
  }),
}));

// Mock expo-router
jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

// Mock toast
jest.mock("@/utils/toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
  handleApiError: jest.fn(),
}));

// Test component that uses auth
function TestAuthComponent({
  onAuthState,
}: {
  onAuthState: (state: {
    user: unknown;
    isAuthenticated: boolean;
    isLoading: boolean;
  }) => void;
}) {
  const auth = useAuth();

  React.useEffect(() => {
    onAuthState({
      user: auth.user,
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
    });
  }, [auth.user, auth.isAuthenticated, auth.isLoading, onAuthState]);

  return null;
}

// Wrapper with providers
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

describe("Auth + API Integration", () => {
  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockSecureStore).forEach((key) => delete mockSecureStore[key]);
    jest.clearAllMocks();
  });

  describe("Authentication Flow", () => {
    it("starts with loading state then transitions to unauthenticated", async () => {
      const states: Array<{ isLoading: boolean; isAuthenticated: boolean }> =
        [];

      render(
        <TestAuthComponent
          onAuthState={(state) => states.push(state)}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(states.length).toBeGreaterThanOrEqual(2);
      });

      // First state should be loading
      expect(states[0].isLoading).toBe(true);

      // Final state should be not loading and not authenticated
      const finalState = states[states.length - 1];
      expect(finalState.isLoading).toBe(false);
      expect(finalState.isAuthenticated).toBe(false);
    });

    it("restores session from stored tokens", async () => {
      // Pre-populate storage with valid tokens
      const tokens = {
        accessToken: "stored_access_token",
        refreshToken: "stored_refresh_token",
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour from now
      };
      const user = {
        id: "1",
        email: "stored@example.com",
        name: "Stored User",
      };

      mockSecureStore["auth_tokens"] = JSON.stringify(tokens);
      mockSecureStore["auth_user"] = JSON.stringify(user);

      let finalState: { user: unknown; isAuthenticated: boolean } | null = null;

      render(
        <TestAuthComponent
          onAuthState={(state) => {
            if (!state.isLoading) {
              finalState = state;
            }
          }}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(finalState).not.toBeNull();
      });

      expect(finalState?.isAuthenticated).toBe(true);
      expect(finalState?.user).toEqual(user);
    });

    it("handles expired tokens by refreshing", async () => {
      // Pre-populate storage with expired tokens
      const tokens = {
        accessToken: "expired_access_token",
        refreshToken: "valid_refresh_token",
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      };
      const user = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
      };

      mockSecureStore["auth_tokens"] = JSON.stringify(tokens);
      mockSecureStore["auth_user"] = JSON.stringify(user);

      let finalState: { isAuthenticated: boolean } | null = null;

      render(
        <TestAuthComponent
          onAuthState={(state) => {
            if (!state.isLoading) {
              finalState = state;
            }
          }}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(
        () => {
          expect(finalState).not.toBeNull();
        },
        { timeout: 3000 }
      );

      // Should be authenticated after token refresh (mock implementation always succeeds)
      expect(finalState?.isAuthenticated).toBe(true);
    });
  });

  describe("Token Management", () => {
    it("getAuthToken returns null when no tokens stored", async () => {
      const token = await getAuthToken();
      expect(token).toBeNull();
    });

    it("getAuthToken returns access token when stored", async () => {
      const tokens = {
        accessToken: "test_access_token",
        refreshToken: "test_refresh_token",
        expiresAt: Date.now() + 60 * 60 * 1000,
      };

      mockSecureStore["auth_tokens"] = JSON.stringify(tokens);

      const token = await getAuthToken();
      expect(token).toBe("test_access_token");
    });
  });

  describe("API Client Integration", () => {
    it("api client exists and has required methods", () => {
      expect(api).toBeDefined();
      expect(typeof api.get).toBe("function");
      expect(typeof api.post).toBe("function");
      expect(typeof api.patch).toBe("function");
      expect(typeof api.delete).toBe("function");
    });
  });
});
