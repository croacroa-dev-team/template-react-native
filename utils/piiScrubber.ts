/**
 * @fileoverview PII scrubbing utility for logs and error reports
 * @module utils/piiScrubber
 */

/** Suffixes that mark a key as sensitive regardless of prefix (e.g. api_token, auth_secret) */
const SENSITIVE_SUFFIXES = [
  "token",
  "secret",
  "password",
  "passwd",
  "key",
  "credential",
  "authorization",
  "cookie",
];

/** Exact-match keys that are sensitive but cannot be reliably detected via suffix */
const SENSITIVE_EXACT = new Set([
  "cvv",
  "cvc",
  "ssn",
  "social_security",
  "session",
  "creditcard",
  "credit_card",
  "cardnumber",
  "card_number",
]);

/**
 * Check whether a key name refers to sensitive data.
 * Uses suffix matching for composable names (e.g. refresh_token, api_key)
 * and exact matching for standalone identifiers (e.g. cvv, ssn).
 */
export function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (SENSITIVE_EXACT.has(lower)) return true;
  return SENSITIVE_SUFFIXES.some(
    (suffix) =>
      lower === suffix || lower.endsWith(`_${suffix}`) || lower.endsWith(suffix)
  );
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const CREDIT_CARD_REGEX = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
const JWT_REGEX = /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;

/**
 * Scrub PII patterns from a string.
 */
export function scrubString(text: string): string {
  return text
    .replace(EMAIL_REGEX, "***@***.***")
    .replace(CREDIT_CARD_REGEX, (match) => {
      const last4 = match.replace(/[-\s]/g, "").slice(-4);
      return `****-****-****-${last4}`;
    })
    .replace(PHONE_REGEX, "***-****")
    .replace(JWT_REGEX, "[TOKEN]");
}

/**
 * Recursively scrub PII from any data structure.
 */
export function scrub(data: unknown): unknown {
  if (data === null || data === undefined) return data;

  if (typeof data === "string") return scrubString(data);

  if (Array.isArray(data)) return data.map(scrub);

  if (typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      data as Record<string, unknown>
    )) {
      if (isSensitiveKey(key)) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = scrub(value);
      }
    }
    return result;
  }

  return data;
}
