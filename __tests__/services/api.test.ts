import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

import { ApiClient, getTokens, saveTokens, getValidAccessToken } from "@/services/api";

// Mock dependencies
jest.mock("@/utils/toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("i18next", () => ({
  t: jest.fn((key: string) => key),
}));

jest.mock("@/constants/config", () => ({
  API_URL: "https://api.example.com",
  API_CONFIG: { ENABLE_ETAG_CACHE: false },
}));

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockRouter = router as jest.Mocked<typeof router>;

// Test data
const mockTokens = {
  accessToken: "valid_access_token",
  refreshToken: "valid_refresh_token",
  expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour from now
};

const expiredTokens = {
  accessToken: "expired_access_token",
  refreshToken: "expired_refresh_token",
  expiresAt: Date.now() - 1000, // Already expired
};

const soonToExpireTokens = {
  accessToken: "soon_to_expire_token",
  refreshToken: "valid_refresh_token",
  expiresAt: Date.now() + 2 * 60 * 1000, // 2 minutes (< 5 min threshold)
};

describe("ApiClient", () => {
  let apiClient: ApiClient;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient = new ApiClient("https://api.example.com", 5000);

    // Default: valid tokens stored
    mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(mockTokens));
    mockSecureStore.setItemAsync.mockResolvedValue();
    mockSecureStore.deleteItemAsync.mockResolvedValue();

    // Mock fetch
    fetchMock = jest.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  describe("HTTP Methods", () => {
    it("should make GET request with auth header", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ data: "test" })),
      });

      const result = await apiClient.get("/users");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/users",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockTokens.accessToken}`,
          }),
        })
      );
      expect(result).toEqual({ data: "test" });
    });

    it("should make POST request with body", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: () => Promise.resolve(JSON.stringify({ id: 1 })),
      });

      const result = await apiClient.post("/users", { name: "John" });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/users",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "John" }),
        })
      );
      expect(result).toEqual({ id: 1 });
    });

    it("should make PUT request", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ updated: true })),
      });

      await apiClient.put("/users/1", { name: "Jane" });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/users/1",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ name: "Jane" }),
        })
      );
    });

    it("should make PATCH request", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ patched: true })),
      });

      await apiClient.patch("/users/1", { status: "active" });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/users/1",
        expect.objectContaining({
          method: "PATCH",
        })
      );
    });

    it("should make DELETE request", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: () => Promise.resolve(""),
      });

      await apiClient.delete("/users/1");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/users/1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });

    it("should skip auth header when requiresAuth is false", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ public: true })),
      });

      await apiClient.get("/public", { requiresAuth: false });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/public",
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });
  });

  describe("401 Handling and Token Refresh", () => {
    it("should refresh token and retry on 401", async () => {
      const newAccessToken = "new_access_token";

      // Track stored tokens to simulate real storage behavior
      let storedTokens = JSON.stringify(mockTokens);
      mockSecureStore.getItemAsync.mockImplementation(() =>
        Promise.resolve(storedTokens)
      );
      mockSecureStore.setItemAsync.mockImplementation((_, value) => {
        storedTokens = value;
        return Promise.resolve();
      });

      // First call returns 401
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      // Refresh token call succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            accessToken: newAccessToken,
            refreshToken: "new_refresh_token",
            expiresIn: 3600,
          }),
      });

      // Retry call succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
      });

      const result = await apiClient.get("/protected");

      // Should have made 3 calls: original, refresh, retry
      expect(fetchMock).toHaveBeenCalledTimes(3);

      // Verify refresh was called
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "https://api.example.com/auth/refresh",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ refreshToken: mockTokens.refreshToken }),
        })
      );

      // Verify retry was made with new token
      expect(fetchMock).toHaveBeenNthCalledWith(
        3,
        "https://api.example.com/protected",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${newAccessToken}`,
          }),
        })
      );

      expect(result).toEqual({ success: true });
    });

    it("should redirect to login when refresh fails", async () => {
      const { toast } = require("@/utils/toast");

      // First call returns 401
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      // Refresh token call fails
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(apiClient.get("/protected")).rejects.toThrow(
        "Authentication failed"
      );

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith("auth_tokens");
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith("auth_user");
      expect(toast.error).toHaveBeenCalledWith(
        "Session expired",
        "Please sign in again"
      );
      expect(mockRouter.replace).toHaveBeenCalledWith("/(public)/login");
    });

    it("should not retry more than once on 401", async () => {
      // First call returns 401
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      // Refresh succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            accessToken: "new_token",
            expiresIn: 3600,
          }),
      });

      // Retry also returns 401
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(apiClient.get("/protected")).rejects.toThrow();

      // Should only retry once (3 total calls: original, refresh, retry)
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("should handle concurrent 401s with single refresh", async () => {
      const newAccessToken = "new_access_token";

      // Setup: both initial requests return 401
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: "Unauthorized",
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: "Unauthorized",
        })
        // Single refresh call
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              accessToken: newAccessToken,
              refreshToken: "new_refresh",
              expiresIn: 3600,
            }),
        })
        // Retries succeed
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({ id: 1 })),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({ id: 2 })),
        });

      // Make concurrent requests
      const [result1, result2] = await Promise.all([
        apiClient.get("/endpoint1"),
        apiClient.get("/endpoint2"),
      ]);

      expect(result1).toEqual({ id: 1 });
      expect(result2).toEqual({ id: 2 });

      // Verify only one refresh call was made
      const refreshCalls = fetchMock.mock.calls.filter(
        (call) => call[0] === "https://api.example.com/auth/refresh"
      );
      expect(refreshCalls.length).toBe(1);
    });
  });

  describe("Proactive Token Refresh", () => {
    it("should refresh token proactively when about to expire", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(
        JSON.stringify(soonToExpireTokens)
      );

      // Refresh call
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            accessToken: "fresh_token",
            expiresIn: 3600,
          }),
      });

      // Actual request
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ data: "test" })),
      });

      await apiClient.get("/data");

      // Should have called refresh before the actual request
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        "https://api.example.com/auth/refresh",
        expect.any(Object)
      );
    });
  });

  describe("Error Handling", () => {
    it("should throw ApiError with status for HTTP errors", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ message: "Resource not found" }),
      });

      try {
        await apiClient.get("/nonexistent", { requiresAuth: false });
        fail("Should have thrown");
      } catch (error: any) {
        expect(error.message).toContain("404");
        expect(error.status).toBe(404);
        expect(error.data).toEqual({ message: "Resource not found" });
      }
    });

    it("should handle timeout errors", async () => {
      // Create abort error
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      fetchMock.mockRejectedValueOnce(abortError);

      try {
        await apiClient.get("/slow", { requiresAuth: false });
        fail("Should have thrown");
      } catch (error: any) {
        expect(error.message).toBe("Request timeout");
        expect(error.status).toBe(408);
      }
    });

    it("should handle network errors", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network request failed"));

      try {
        await apiClient.get("/data", { requiresAuth: false });
        fail("Should have thrown");
      } catch (error: any) {
        expect(error.message).toBe("Network error");
        expect(error.status).toBe(0);
      }
    });

    it("should handle empty response body", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: () => Promise.resolve(""),
      });

      const result = await apiClient.delete("/users/1", { requiresAuth: false });

      expect(result).toEqual({});
    });
  });

  describe("Custom Headers", () => {
    it("should merge custom headers with defaults", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({})),
      });

      await apiClient.get("/data", {
        headers: { "X-Custom-Header": "custom-value" },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-Custom-Header": "custom-value",
            Authorization: expect.any(String),
          }),
        })
      );
    });
  });
});

describe("Token Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSecureStore.getItemAsync.mockResolvedValue(null);
  });

  describe("getTokens", () => {
    it("should return null when no tokens stored", async () => {
      const tokens = await getTokens();
      expect(tokens).toBeNull();
    });

    it("should return parsed tokens when stored", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(mockTokens));

      const tokens = await getTokens();

      expect(tokens).toEqual(mockTokens);
    });

    it("should return null on parse error", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue("invalid json{");

      const tokens = await getTokens();

      expect(tokens).toBeNull();
    });
  });

  describe("saveTokens", () => {
    it("should save tokens to secure store", async () => {
      await saveTokens(mockTokens);

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        "auth_tokens",
        JSON.stringify(mockTokens)
      );
    });
  });

  describe("getValidAccessToken", () => {
    it("should return null when no tokens", async () => {
      const token = await getValidAccessToken();
      expect(token).toBeNull();
    });

    it("should return token when not expired", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(mockTokens));

      const token = await getValidAccessToken();

      expect(token).toBe(mockTokens.accessToken);
    });
  });
});
