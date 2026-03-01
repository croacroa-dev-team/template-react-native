import {
  getCertificatePins,
  isSslPinningEnabled,
  generateRequestSignature,
  isUrlAllowed,
  sanitizeInput,
  getSecurityHeaders,
} from "@/services/security";

jest.mock("expo-crypto", () => ({
  digestStringAsync: jest.fn((_algo: string, data: string) =>
    Promise.resolve(
      // Return a deterministic hex string based on input length for testing
      Array.from({ length: 64 }, (_, i) =>
        ((data.length + i) % 16).toString(16)
      ).join("")
    )
  ),
  CryptoDigestAlgorithm: {
    SHA256: "SHA-256",
  },
}));

jest.mock("@/constants/config", () => ({
  SECURITY: {
    ENABLE_SSL_PINNING: true,
    SSL_PINS: {
      "api.example.com": ["sha256/abc123", "sha256/def456"],
    },
    REQUEST_SIGNING: {
      ENABLED: true,
      ALGORITHM: "sha256",
      HEADER_NAME: "X-Request-Signature",
    },
  },
  IS_DEV: false,
  LOGGER: { ENABLED: false, MIN_LEVEL: "warn", MAX_BREADCRUMBS: 100 },
}));

describe("Security Service", () => {
  describe("getCertificatePins", () => {
    it("returns pins for a configured hostname", () => {
      const pins = getCertificatePins("api.example.com");
      expect(pins).toEqual(["sha256/abc123", "sha256/def456"]);
    });

    it("returns empty array for unconfigured hostname", () => {
      const pins = getCertificatePins("unknown.com");
      expect(pins).toEqual([]);
    });
  });

  describe("isSslPinningEnabled", () => {
    it("returns true for configured hostname", () => {
      expect(isSslPinningEnabled("api.example.com")).toBe(true);
    });

    it("returns false for unconfigured hostname", () => {
      expect(isSslPinningEnabled("unknown.com")).toBe(false);
    });
  });

  describe("generateRequestSignature", () => {
    it("returns a hash string when signing is enabled", async () => {
      const signature = await generateRequestSignature(
        "POST",
        "/api/users",
        { name: "John" },
        1234567890
      );

      expect(signature).toBeDefined();
      expect(typeof signature).toBe("string");
      expect(signature!.length).toBeGreaterThan(0);
    });

    it("builds payload from method, url, body, and timestamp", async () => {
      const { digestStringAsync } = require("expo-crypto");

      await generateRequestSignature("GET", "/test", null, 999);

      expect(digestStringAsync).toHaveBeenCalledWith(
        "SHA-256",
        "GET:/test::999"
      );
    });

    it("uppercases the HTTP method", async () => {
      const { digestStringAsync } = require("expo-crypto");

      await generateRequestSignature("post", "/test", null, 100);

      expect(digestStringAsync).toHaveBeenCalledWith(
        "SHA-256",
        "POST:/test::100"
      );
    });

    it("serializes body as JSON in payload", async () => {
      const { digestStringAsync } = require("expo-crypto");

      await generateRequestSignature("POST", "/test", { a: 1 }, 100);

      expect(digestStringAsync).toHaveBeenCalledWith(
        "SHA-256",
        'POST:/test:{"a":1}:100'
      );
    });
  });

  describe("isUrlAllowed", () => {
    const allowedHosts = ["api.example.com", "*.trusted.com"];

    it("allows exact hostname match", () => {
      expect(isUrlAllowed("https://api.example.com/path", allowedHosts)).toBe(
        true
      );
    });

    it("rejects non-matching hostname", () => {
      expect(isUrlAllowed("https://evil.com/path", allowedHosts)).toBe(false);
    });

    it("supports wildcard subdomains", () => {
      expect(isUrlAllowed("https://sub.trusted.com/path", allowedHosts)).toBe(
        true
      );
    });

    it("matches bare domain for wildcard entry", () => {
      expect(isUrlAllowed("https://trusted.com/path", allowedHosts)).toBe(true);
    });

    it("returns false for invalid URLs", () => {
      expect(isUrlAllowed("not-a-url", allowedHosts)).toBe(false);
    });
  });

  describe("sanitizeInput", () => {
    it("escapes HTML special characters", () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
        "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
      );
    });

    it("escapes ampersands", () => {
      expect(sanitizeInput("a & b")).toBe("a &amp; b");
    });

    it("escapes single quotes", () => {
      expect(sanitizeInput("it's")).toBe("it&#x27;s");
    });

    it("returns clean input unchanged (besides &)", () => {
      expect(sanitizeInput("hello world 123")).toBe("hello world 123");
    });
  });

  describe("getSecurityHeaders", () => {
    it("includes timestamp header when signing is enabled", () => {
      const headers = getSecurityHeaders();
      expect(headers["X-Request-Timestamp"]).toBeDefined();
    });
  });
});
