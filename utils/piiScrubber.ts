/**
 * @fileoverview PII scrubbing utility for logs and error reports
 * @module utils/piiScrubber
 */

const SENSITIVE_KEYS = new Set([
  "password",
  "passwd",
  "secret",
  "token",
  "authorization",
  "cookie",
  "session",
  "creditcard",
  "credit_card",
  "cardnumber",
  "card_number",
  "cvv",
  "cvc",
  "ssn",
  "social_security",
]);

const EMAIL_REGEX =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX =
  /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const CREDIT_CARD_REGEX =
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
const JWT_REGEX =
  /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;

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
      data as Record<string, unknown>,
    )) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = scrub(value);
      }
    }
    return result;
  }

  return data;
}
