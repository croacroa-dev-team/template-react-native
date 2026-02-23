import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import Bottleneck from "bottleneck";
import i18next from "i18next";
import { API_URL, API_CONFIG } from "@/constants/config";
import { toast } from "@/utils/toast";
import type { AuthTokens } from "@/types";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

/**
 * Rate limiter to prevent API abuse and handle rate limiting gracefully
 * - maxConcurrent: Maximum concurrent requests
 * - minTime: Minimum time between requests (ms)
 * - reservoir: Number of requests allowed in the reservoir
 * - reservoirRefreshAmount: How many requests to add on refresh
 * - reservoirRefreshInterval: How often to refresh the reservoir (ms)
 */
const limiter = new Bottleneck({
  maxConcurrent: 5, // Max 5 concurrent requests
  minTime: 100, // At least 100ms between requests
  reservoir: 50, // 50 requests per interval
  reservoirRefreshAmount: 50,
  reservoirRefreshInterval: 60 * 1000, // Refresh every minute
});

// Track rate limit errors
let rateLimitRetryAfter = 0;

limiter.on("failed", async (error, _jobInfo) => {
  // If we hit a rate limit, wait and retry
  if (error instanceof Error && error.message.includes("429")) {
    const retryAfter = rateLimitRetryAfter || 1000;
    console.warn(`Rate limited, retrying in ${retryAfter}ms`);
    return retryAfter;
  }
  return null;
});

limiter.on("retry", (error, jobInfo) => {
  console.log(`Retrying request (attempt ${jobInfo.retryCount + 1})`);
});

interface RequestOptions {
  method?: RequestMethod;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  skipRefresh?: boolean;
}

interface ApiError extends Error {
  status: number;
  data?: unknown;
}

interface RateLimitError extends Error {
  status: 429;
  retryAfter: number;
}

interface ETagCacheEntry {
  etag: string;
  data: unknown;
}

const TOKEN_KEY = "auth_tokens";
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000;

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Get current auth tokens from secure storage
 */
async function getTokens(): Promise<AuthTokens | null> {
  try {
    const stored = await SecureStore.getItemAsync(TOKEN_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Save new tokens to secure storage
 */
async function saveTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
}

/**
 * Clear tokens and redirect to login
 */
async function handleAuthFailure(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync("auth_user");
  toast.error("Session expired", "Please sign in again");
  router.replace("/(public)/login");
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, wait for that request
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const tokens = await getTokens();
      if (!tokens?.refreshToken) {
        throw new Error("No refresh token");
      }

      // TODO: Replace with your actual refresh endpoint
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Refresh failed");
      }

      const data = await response.json();
      const newTokens: AuthTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || tokens.refreshToken,
        expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
      };

      await saveTokens(newTokens);
      return newTokens.accessToken;
    } catch (error) {
      console.error("Token refresh failed:", error);
      await handleAuthFailure();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Get a valid access token, refreshing if necessary
 */
async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getTokens();
  if (!tokens) return null;

  // Check if token needs refresh
  const timeUntilExpiry = tokens.expiresAt - Date.now();
  if (timeUntilExpiry < TOKEN_REFRESH_THRESHOLD) {
    return refreshAccessToken();
  }

  return tokens.accessToken;
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private enableRateLimiting: boolean;

  /** Timestamp (ms) until which we are rate limited by the server */
  rateLimitedUntil: number = 0;

  /** ETag cache: maps URL to cached ETag + response data */
  private etagCache: Map<string, ETagCacheEntry> = new Map();

  constructor(baseUrl: string, timeout = 30000, enableRateLimiting = true) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = timeout;
    this.enableRateLimiting = enableRateLimiting;
  }

  /**
   * Execute a request with rate limiting
   */
  private async executeWithRateLimiting<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.enableRateLimiting) {
      return fn();
    }
    return limiter.schedule(fn);
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      method = "GET",
      body,
      headers = {},
      requiresAuth = true,
      skipRefresh = false,
    } = options;

    // ---- Part A: Pre-request rate limit check ----
    if (Date.now() < this.rateLimitedUntil) {
      const secondsLeft = Math.ceil(
        (this.rateLimitedUntil - Date.now()) / 1000
      );
      const error = new Error(
        `Rate limited — retry in ${secondsLeft}s`
      ) as RateLimitError;
      error.status = 429;
      error.retryAfter = secondsLeft;
      throw error;
    }

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    // Add auth token if required
    if (requiresAuth) {
      const token = await getValidAccessToken();
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
    }

    // ---- Part B: ETag — add If-None-Match for GET requests ----
    const fullUrl = `${this.baseUrl}${endpoint}`;
    if (
      method === "GET" &&
      API_CONFIG.ENABLE_ETAG_CACHE &&
      this.etagCache.has(fullUrl)
    ) {
      const cached = this.etagCache.get(fullUrl)!;
      requestHeaders["If-None-Match"] = cached.etag;
    }

    // Setup abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);

    try {
      const config: RequestInit = {
        method,
        headers: requestHeaders,
        signal: controller.signal,
      };

      if (body && method !== "GET") {
        config.body = JSON.stringify(body);
      }

      const response = await this.executeWithRateLimiting(() =>
        fetch(fullUrl, config)
      );

      // Handle 401 - try refresh once
      if (response.status === 401 && requiresAuth && !skipRefresh) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Retry the request with new token
          return this.request(endpoint, { ...options, skipRefresh: true });
        }
        throw new Error("Authentication failed");
      }

      // ---- Part A: Handle rate limiting (429) with UI feedback ----
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get("Retry-After");
        const retryAfterSeconds = retryAfterHeader
          ? parseInt(retryAfterHeader, 10)
          : 30;
        rateLimitRetryAfter = retryAfterSeconds * 1000;

        // Store expiry timestamp so subsequent requests are blocked locally
        this.rateLimitedUntil = Date.now() + retryAfterSeconds * 1000;

        // Show user-facing toast via i18n
        toast.error(i18next.t("errors.rateLimited"));

        const error = new Error(
          "Rate limited - too many requests"
        ) as RateLimitError;
        error.status = 429;
        error.retryAfter = retryAfterSeconds;
        throw error;
      }

      // ---- Part B: ETag — handle 304 Not Modified ----
      if (
        response.status === 304 &&
        method === "GET" &&
        API_CONFIG.ENABLE_ETAG_CACHE
      ) {
        const cached = this.etagCache.get(fullUrl);
        if (cached) {
          return cached.data as T;
        }
      }

      // Handle other errors
      if (!response.ok) {
        const error = new Error(
          `API Error: ${response.status} ${response.statusText}`
        ) as ApiError;
        error.status = response.status;
        try {
          error.data = await response.json();
        } catch {
          // Response body is not JSON
        }
        throw error;
      }

      // Handle empty responses
      const text = await response.text();
      if (!text) {
        return {} as T;
      }

      const parsed = JSON.parse(text) as T;

      // ---- Part B: ETag — cache response if ETag header present ----
      if (method === "GET" && API_CONFIG.ENABLE_ETAG_CACHE) {
        const etagValue = response.headers.get("ETag");
        if (etagValue) {
          this.etagCache.set(fullUrl, { etag: etagValue, data: parsed });
        }
      }

      return parsed;
    } catch (error) {
      if (error instanceof Error) {
        // Handle abort (timeout)
        if (error.name === "AbortError") {
          const timeoutError = new Error("Request timeout") as ApiError;
          timeoutError.status = 408;
          throw timeoutError;
        }

        // Handle network errors
        if (
          error.message.includes("Network") ||
          error.message.includes("fetch")
        ) {
          const networkError = new Error("Network error") as ApiError;
          networkError.status = 0;
          throw networkError;
        }
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get<T>(
    endpoint: string,
    options?: Omit<RequestOptions, "method" | "body">
  ) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    body?: Record<string, unknown>,
    options?: Omit<RequestOptions, "method">
  ) {
    return this.request<T>(endpoint, { ...options, method: "POST", body });
  }

  async put<T>(
    endpoint: string,
    body?: Record<string, unknown>,
    options?: Omit<RequestOptions, "method">
  ) {
    return this.request<T>(endpoint, { ...options, method: "PUT", body });
  }

  async patch<T>(
    endpoint: string,
    body?: Record<string, unknown>,
    options?: Omit<RequestOptions, "method">
  ) {
    return this.request<T>(endpoint, { ...options, method: "PATCH", body });
  }

  async delete<T>(
    endpoint: string,
    options?: Omit<RequestOptions, "method" | "body">
  ) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

// Export singleton instance
export const api = new ApiClient(API_URL);

// Export class for testing or creating additional instances
export { ApiClient };

// Export token utilities for auth hook
export { getTokens, saveTokens, getValidAccessToken };
