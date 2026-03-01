import {
  deduplicate,
  getDeduplicationKey,
  getInflightCount,
} from "@/services/api/deduplicator";

describe("Request Deduplicator", () => {
  describe("getDeduplicationKey", () => {
    it("creates key from method, url, and body", () => {
      const key = getDeduplicationKey("GET", "/users", undefined);
      expect(key).toBe("GET:/users:");
    });

    it("includes body in key", () => {
      const key = getDeduplicationKey("POST", "/users", { name: "John" });
      expect(key).toBe('POST:/users:{"name":"John"}');
    });

    it("handles null body", () => {
      const key = getDeduplicationKey("GET", "/users", null);
      expect(key).toBe("GET:/users:");
    });
  });

  describe("deduplicate", () => {
    it("returns the same promise for concurrent identical requests", async () => {
      let resolveFirst!: (value: string) => void;
      const firstPromise = new Promise<string>((r) => {
        resolveFirst = r;
      });
      const fn = jest.fn(() => firstPromise);

      const p1 = deduplicate("key-1", fn);
      const p2 = deduplicate("key-1", fn);

      // fn should only be called once
      expect(fn).toHaveBeenCalledTimes(1);

      resolveFirst("result");
      const [r1, r2] = await Promise.all([p1, p2]);

      expect(r1).toBe("result");
      expect(r2).toBe("result");
    });

    it("does not deduplicate different keys", async () => {
      const fn1 = jest.fn().mockResolvedValue("a");
      const fn2 = jest.fn().mockResolvedValue("b");

      const [r1, r2] = await Promise.all([
        deduplicate("key-a", fn1),
        deduplicate("key-b", fn2),
      ]);

      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(r1).toBe("a");
      expect(r2).toBe("b");
    });

    it("cleans up after the promise resolves", async () => {
      await deduplicate("cleanup-key", () => Promise.resolve("done"));

      // After resolution, inflight count for this key should be 0
      // A new call with the same key should invoke fn again
      const fn = jest.fn().mockResolvedValue("new");
      const result = await deduplicate("cleanup-key", fn);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(result).toBe("new");
    });

    it("cleans up after the promise rejects", async () => {
      await expect(
        deduplicate("err-key", () => Promise.reject(new Error("fail")))
      ).rejects.toThrow("fail");

      const fn = jest.fn().mockResolvedValue("recovered");
      const result = await deduplicate("err-key", fn);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(result).toBe("recovered");
    });
  });

  describe("getInflightCount", () => {
    it("reports zero when no requests are in-flight", () => {
      expect(getInflightCount()).toBe(0);
    });

    it("tracks in-flight requests", async () => {
      let resolve!: (value: string) => void;
      const pending = new Promise<string>((r) => {
        resolve = r;
      });

      const promise = deduplicate("inflight-key", () => pending);
      expect(getInflightCount()).toBeGreaterThan(0);

      resolve("done");
      await promise;
    });
  });
});
