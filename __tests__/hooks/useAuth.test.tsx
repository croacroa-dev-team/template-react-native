import { renderHook, act, waitFor } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { ReactNode } from "react";

import { AuthProvider, useAuth, getAuthToken } from "@/hooks/useAuth";

// Mock toast
jest.mock("@/utils/toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockRouter = router as jest.Mocked<typeof router>;

// Helper wrapper for hooks that need AuthProvider
const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// Test data
const mockUser = {
  id: "1",
  email: "test@example.com",
  name: "test",
};

const mockTokens = {
  accessToken: "mock_access_token",
  refreshToken: "mock_refresh_token",
  expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour from now
};

const expiredTokens = {
  accessToken: "expired_access_token",
  refreshToken: "expired_refresh_token",
  expiresAt: Date.now() - 1000, // Already expired
};

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: no stored auth
    mockSecureStore.getItemAsync.mockResolvedValue(null);
    mockSecureStore.setItemAsync.mockResolvedValue();
    mockSecureStore.deleteItemAsync.mockResolvedValue();
  });

  describe("initialization", () => {
    it("should start with loading state and then finish loading", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it("should load stored auth on mount", async () => {
      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === "auth_tokens") return Promise.resolve(JSON.stringify(mockTokens));
        if (key === "auth_user") return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it("should attempt refresh if stored tokens are expired", async () => {
      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === "auth_tokens") return Promise.resolve(JSON.stringify(expiredTokens));
        if (key === "auth_user") return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // The mock implementation in useAuth always succeeds on refresh
      // So user should be authenticated with refreshed tokens
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should handle storage errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      mockSecureStore.getItemAsync.mockRejectedValue(new Error("Storage error"));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("signIn", () => {
    it("should sign in successfully with valid credentials", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe("test@example.com");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        "auth_tokens",
        expect.any(String)
      );
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        "auth_user",
        expect.any(String)
      );
    });

    it("should fail sign in with invalid credentials", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.signIn("invalid", "password");
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should show success toast on successful sign in", async () => {
      const { toast } = require("@/utils/toast");
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(toast.success).toHaveBeenCalledWith("Welcome back!", expect.any(String));
    });

    it("should show error toast on failed sign in", async () => {
      const { toast } = require("@/utils/toast");
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.signIn("invalid", "password");
        } catch {
          // Expected to throw
        }
      });

      expect(toast.error).toHaveBeenCalledWith("Sign in failed", expect.any(String));
    });
  });

  describe("signUp", () => {
    it("should sign up successfully", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signUp("newuser@example.com", "password123", "New User");
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.name).toBe("New User");
      expect(result.current.user?.email).toBe("newuser@example.com");
    });

    it("should show success toast on sign up", async () => {
      const { toast } = require("@/utils/toast");
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signUp("new@example.com", "password", "Test");
      });

      expect(toast.success).toHaveBeenCalledWith("Account created!", expect.any(String));
    });
  });

  describe("signOut", () => {
    it("should sign out and clear storage", async () => {
      // Start with authenticated state
      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === "auth_tokens") return Promise.resolve(JSON.stringify(mockTokens));
        if (key === "auth_user") return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith("auth_tokens");
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith("auth_user");
    });

    it("should redirect to login after sign out", async () => {
      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === "auth_tokens") return Promise.resolve(JSON.stringify(mockTokens));
        if (key === "auth_user") return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockRouter.replace).toHaveBeenCalledWith("/(public)/login");
    });

    it("should show info toast on sign out", async () => {
      const { toast } = require("@/utils/toast");

      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === "auth_tokens") return Promise.resolve(JSON.stringify(mockTokens));
        if (key === "auth_user") return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(toast.info).toHaveBeenCalledWith("Signed out");
    });
  });

  describe("updateUser", () => {
    it("should update user data", async () => {
      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === "auth_tokens") return Promise.resolve(JSON.stringify(mockTokens));
        if (key === "auth_user") return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      act(() => {
        result.current.updateUser({ name: "Updated Name" });
      });

      expect(result.current.user?.name).toBe("Updated Name");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        "auth_user",
        expect.stringContaining("Updated Name")
      );
    });

    it("should not update if no user is logged in", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const setItemCallsBefore = mockSecureStore.setItemAsync.mock.calls.length;

      act(() => {
        result.current.updateUser({ name: "New Name" });
      });

      expect(result.current.user).toBeNull();
      // setItemAsync should not have been called for user update
      expect(mockSecureStore.setItemAsync.mock.calls.length).toBe(setItemCallsBefore);
    });
  });

  describe("refreshSession", () => {
    it("should refresh session when tokens exist", async () => {
      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === "auth_tokens") return Promise.resolve(JSON.stringify(mockTokens));
        if (key === "auth_user") return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      let refreshResult: boolean = false;
      await act(async () => {
        refreshResult = await result.current.refreshSession();
      });

      expect(refreshResult).toBe(true);
    });

    it("should return false if no tokens exist", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let refreshResult: boolean = true;
      await act(async () => {
        refreshResult = await result.current.refreshSession();
      });

      expect(refreshResult).toBe(false);
    });
  });

  describe("token expiration handling", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should setup refresh interval when tokens exist", async () => {
      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === "auth_tokens") return Promise.resolve(JSON.stringify(mockTokens));
        if (key === "auth_user") return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Token should still be valid
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should trigger refresh when token is about to expire", async () => {
      const soonToExpireTokens = {
        ...mockTokens,
        expiresAt: Date.now() + 4 * 60 * 1000, // 4 minutes (< 5 min threshold)
      };

      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === "auth_tokens") return Promise.resolve(JSON.stringify(soonToExpireTokens));
        if (key === "auth_user") return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // The useEffect should have triggered a refresh
      // Verify by checking setItemAsync was called (tokens saved after refresh)
      await waitFor(() => {
        expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
      });
    });
  });

  describe("error handling", () => {
    it("should throw error when useAuth is used outside AuthProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow("useAuth must be used within an AuthProvider");

      consoleSpy.mockRestore();
    });
  });
});

describe("getAuthToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  });

  it("should return null when no tokens stored", async () => {
    const token = await getAuthToken();
    expect(token).toBeNull();
  });

  it("should return access token when tokens exist", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
      JSON.stringify(mockTokens)
    );

    const token = await getAuthToken();
    expect(token).toBe(mockTokens.accessToken);
  });

  it("should warn when token is expired", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
      JSON.stringify(expiredTokens)
    );

    const token = await getAuthToken();

    expect(token).toBe(expiredTokens.accessToken);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Token is expired or about to expire"
    );

    consoleSpy.mockRestore();
  });

  it("should handle storage errors gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
      new Error("Storage error")
    );

    const token = await getAuthToken();

    expect(token).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
