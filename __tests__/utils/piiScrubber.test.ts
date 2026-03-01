import { isSensitiveKey, scrub, scrubString } from "@/utils/piiScrubber";

describe("isSensitiveKey", () => {
  describe("exact matches", () => {
    it.each(["cvv", "ssn", "session", "cvc", "credit_card"])(
      "returns true for exact key '%s'",
      (key) => {
        expect(isSensitiveKey(key)).toBe(true);
      }
    );

    it("is case-insensitive for exact matches", () => {
      expect(isSensitiveKey("CVV")).toBe(true);
      expect(isSensitiveKey("SSN")).toBe(true);
      expect(isSensitiveKey("Session")).toBe(true);
    });
  });

  describe("suffix matches", () => {
    it.each([
      "api_token",
      "refresh_token",
      "auth_secret",
      "api_key",
      "user_credential",
      "myAuthorization",
      "session_cookie",
      "user_password",
    ])("returns true for suffix-matched key '%s'", (key) => {
      expect(isSensitiveKey(key)).toBe(true);
    });
  });

  describe("non-sensitive keys", () => {
    it.each(["name", "email_address", "id", "username", "created_at"])(
      "returns false for non-sensitive key '%s'",
      (key) => {
        expect(isSensitiveKey(key)).toBe(false);
      }
    );
  });
});

describe("scrub", () => {
  it("redacts values of suffix-matched keys in objects", () => {
    const input = {
      api_token: "abc123",
      auth_secret: "s3cret",
      name: "Alice",
    };

    const result = scrub(input) as Record<string, unknown>;

    expect(result.api_token).toBe("[REDACTED]");
    expect(result.auth_secret).toBe("[REDACTED]");
    expect(result.name).toBe("Alice");
  });

  it("redacts exact-match sensitive keys", () => {
    const input = { cvv: "123", ssn: "111-22-3333", id: 42 };
    const result = scrub(input) as Record<string, unknown>;

    expect(result.cvv).toBe("[REDACTED]");
    expect(result.ssn).toBe("[REDACTED]");
    expect(result.id).toBe(42);
  });

  it("handles nested objects recursively", () => {
    const input = { user: { api_key: "xyz", display: "Bob" } };
    const result = scrub(input) as any;

    expect(result.user.api_key).toBe("[REDACTED]");
    expect(result.user.display).toBe("Bob");
  });

  it("handles arrays", () => {
    const input = [{ token: "a" }, { name: "b" }];
    const result = scrub(input) as any[];

    expect(result[0].token).toBe("[REDACTED]");
    expect(result[1].name).toBe("b");
  });

  it("returns null/undefined as-is", () => {
    expect(scrub(null)).toBeNull();
    expect(scrub(undefined)).toBeUndefined();
  });
});

describe("scrubString", () => {
  it("scrubs email addresses", () => {
    const result = scrubString("Contact me at user@example.com please");
    expect(result).toBe("Contact me at ***@***.*** please");
  });

  it("scrubs phone numbers", () => {
    const result = scrubString("Call 555-123-4567");
    expect(result).toBe("Call ***-****");
  });

  it("scrubs credit card numbers preserving last 4 digits", () => {
    const result = scrubString("Card: 4111-1111-1111-1234");
    expect(result).toBe("Card: ****-****-****-1234");
  });

  it("scrubs credit card numbers without dashes", () => {
    const result = scrubString("Card: 4111111111111234");
    expect(result).toBe("Card: ****-****-****-1234");
  });

  it("scrubs JWTs", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc_DEF-123";
    const result = scrubString(`Bearer ${jwt}`);
    expect(result).toBe("Bearer [TOKEN]");
  });

  it("scrubs multiple PII patterns in one string", () => {
    const input = "user@test.com called 555-123-4567";
    const result = scrubString(input);
    expect(result).not.toContain("user@test.com");
    expect(result).not.toContain("555-123-4567");
  });
});
