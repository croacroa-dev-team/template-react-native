import { withRetry } from "@/services/api/retry";

jest.mock("@/constants/config", () => ({
  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY_MS: 10,
    MAX_DELAY_MS: 100,
    JITTER: false,
  },
  LOGGER: { ENABLED: false, MIN_LEVEL: "warn", MAX_BREADCRUMBS: 100 },
}));

describe("withRetry", () => {
  it("returns immediately on first success", async () => {
    const fn = jest.fn().mockResolvedValue("ok");

    const result = await withRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 1,
      maxDelayMs: 10,
      jitter: false,
    });

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and eventually succeeds", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockResolvedValue("ok");

    const promise = withRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 1,
      maxDelayMs: 100,
      jitter: false,
    });
    const result = await promise;

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws after exhausting all attempts", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("always fails"));

    await expect(
      withRetry(fn, {
        maxAttempts: 2,
        baseDelayMs: 1,
        maxDelayMs: 100,
        jitter: false,
      })
    ).rejects.toThrow("always fails");

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-retryable status codes", async () => {
    const error: Error & { status?: number } = new Error("Not Found");
    error.status = 404;
    const fn = jest.fn().mockRejectedValue(error);

    await expect(
      withRetry(fn, {
        maxAttempts: 3,
        baseDelayMs: 1,
        maxDelayMs: 100,
        jitter: false,
        retryableStatuses: [500, 503],
      })
    ).rejects.toThrow("Not Found");

    // Should only call once since 404 is not retryable
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries retryable status codes", async () => {
    const error: Error & { status?: number } = new Error("Server Error");
    error.status = 500;
    const fn = jest
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue("recovered");

    const result = await withRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 1,
      maxDelayMs: 100,
      jitter: false,
      retryableStatuses: [500, 503],
    });

    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries errors without status code (treats as retryable)", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValue("ok");

    const result = await withRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 1,
      maxDelayMs: 100,
      jitter: false,
    });

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
