/**
 * @fileoverview Security utilities for enhanced app protection
 * Provides SSL pinning validation, request signing, and security checks.
 * @module services/security
 */

import { SECURITY, IS_DEV } from "@/constants/config";

/**
 * Validate SSL certificate pins for a given hostname.
 * Note: In React Native, actual certificate pinning requires native module configuration.
 * This service provides the configuration and validation helpers.
 *
 * For full SSL pinning, configure your native modules:
 * - iOS: Use TrustKit or configure ATS in Info.plist
 * - Android: Configure network_security_config.xml
 *
 * @param hostname - The hostname to validate pins for
 * @returns Array of certificate pins for the hostname, or empty array if not configured
 *
 * @example
 * ```ts
 * const pins = getCertificatePins('api.yourapp.com');
 * if (pins.length > 0) {
 *   // Use pins for validation
 * }
 * ```
 */
export function getCertificatePins(hostname: string): string[] {
  if (!SECURITY.ENABLE_SSL_PINNING) {
    return [];
  }

  return SECURITY.SSL_PINS[hostname] || [];
}

/**
 * Check if SSL pinning is enabled for a hostname
 */
export function isSslPinningEnabled(hostname: string): boolean {
  if (!SECURITY.ENABLE_SSL_PINNING) {
    return false;
  }

  const pins = SECURITY.SSL_PINS[hostname];
  return Array.isArray(pins) && pins.length > 0;
}

/**
 * Generate a request signature for API requests.
 * Useful for preventing request tampering and replay attacks.
 *
 * @param method - HTTP method
 * @param url - Request URL
 * @param body - Request body (optional)
 * @param timestamp - Request timestamp
 * @returns Signature string or null if signing is disabled
 *
 * @example
 * ```ts
 * const signature = generateRequestSignature('POST', '/api/users', { name: 'John' }, Date.now());
 * if (signature) {
 *   headers['X-Request-Signature'] = signature;
 * }
 * ```
 */
export function generateRequestSignature(
  method: string,
  url: string,
  body: unknown,
  timestamp: number
): string | null {
  if (!SECURITY.REQUEST_SIGNING.ENABLED) {
    return null;
  }

  // Create payload to sign
  const payload = [
    method.toUpperCase(),
    url,
    body ? JSON.stringify(body) : "",
    timestamp.toString(),
  ].join(":");

  // In production, use a proper HMAC implementation with a secret key
  // This is a placeholder - implement actual signing based on your backend requirements
  if (IS_DEV) {
    console.log("[Security] Would sign payload:", payload);
  }

  // TODO: Implement actual HMAC signing
  // const hmac = crypto.createHmac(SECURITY.REQUEST_SIGNING.ALGORITHM, SECRET_KEY);
  // return hmac.update(payload).digest('base64');

  return null;
}

/**
 * Security headers to add to API requests
 */
export function getSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

  // Add timestamp for request signing/replay protection
  if (SECURITY.REQUEST_SIGNING.ENABLED) {
    headers["X-Request-Timestamp"] = Date.now().toString();
  }

  return headers;
}

/**
 * Validate that a URL is allowed (not blocked by security policy)
 * Useful for preventing open redirects and SSRF
 *
 * @param url - URL to validate
 * @param allowedHosts - List of allowed hostnames
 * @returns True if URL is allowed
 */
export function isUrlAllowed(url: string, allowedHosts: string[]): boolean {
  try {
    const parsed = new URL(url);
    return allowedHosts.some((host) => {
      // Support wildcards (e.g., *.yourapp.com)
      if (host.startsWith("*.")) {
        const domain = host.slice(2);
        return (
          parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
        );
      }
      return parsed.hostname === host;
    });
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Sanitize user input to prevent XSS
 * Basic sanitization - use a proper library for comprehensive XSS protection
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Check if the app is running in a potentially compromised environment
 * (rooted/jailbroken device, debugger attached, etc.)
 *
 * Note: This requires additional native modules for full detection:
 * - iOS: Consider using a jailbreak detection library
 * - Android: Consider using SafetyNet Attestation or Play Integrity API
 */
export async function checkSecurityEnvironment(): Promise<{
  isSecure: boolean;
  warnings: string[];
}> {
  const warnings: string[] = [];

  // Check for development mode
  if (IS_DEV) {
    warnings.push("Running in development mode");
  }

  // Check for debugger
  // Note: __DEV__ is automatically true when debugger is attached
  if (__DEV__) {
    warnings.push("Debugger may be attached");
  }

  // Additional checks would require native modules:
  // - Jailbreak/root detection
  // - Frida/debugging tools detection
  // - Emulator detection
  // - Hook detection

  return {
    isSecure: warnings.length === 0,
    warnings,
  };
}

/**
 * SSL Pinning configuration for native modules.
 * Export this configuration to use with native SSL pinning libraries.
 *
 * For iOS (TrustKit), add to Info.plist or configure programmatically.
 * For Android, use network_security_config.xml.
 */
export const SSL_PINNING_CONFIG = {
  enabled: SECURITY.ENABLE_SSL_PINNING,
  pins: SECURITY.SSL_PINS,

  /**
   * Generate Android network_security_config.xml content
   * Save this to android/app/src/main/res/xml/network_security_config.xml
   * and reference it in AndroidManifest.xml:
   * <application android:networkSecurityConfig="@xml/network_security_config">
   */
  getAndroidConfig(): string {
    const pinEntries = Object.entries(SECURITY.SSL_PINS)
      .map(([domain, pins]) => {
        const pinElements = pins
          .map(
            (pin) =>
              `        <pin digest="SHA-256">${pin.replace("sha256/", "")}</pin>`
          )
          .join("\n");

        return `    <domain-config cleartextTrafficPermitted="false">
      <domain includeSubdomains="true">${domain}</domain>
      <pin-set expiration="2026-12-31">
${pinElements}
      </pin-set>
    </domain-config>`;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
${pinEntries}
</network-security-config>`;
  },

  /**
   * Generate iOS TrustKit configuration dictionary
   * Add this to your AppDelegate.mm or use expo-build-properties plugin
   *
   * For Expo managed workflow, add to app.config.ts:
   * ```
   * plugins: [
   *   ["expo-build-properties", {
   *     ios: {
   *       infoPlist: SSL_PINNING_CONFIG.getIOSInfoPlist()
   *     }
   *   }]
   * ]
   * ```
   */
  getIOSConfig(): Record<string, unknown> {
    const pinnedDomains: Record<string, unknown> = {};

    Object.entries(SECURITY.SSL_PINS).forEach(([domain, pins]) => {
      pinnedDomains[domain] = {
        TSKIncludeSubdomains: true,
        TSKEnforcePinning: true,
        TSKPublicKeyHashes: pins.map((pin) => pin.replace("sha256/", "")),
      };
    });

    return {
      TSKSwizzleNetworkDelegates: true,
      TSKPinnedDomains: pinnedDomains,
    };
  },

  /**
   * Generate iOS Info.plist entries for SSL pinning
   */
  getIOSInfoPlist(): Record<string, unknown> {
    return {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
        NSPinnedDomains: Object.fromEntries(
          Object.entries(SECURITY.SSL_PINS).map(([domain, pins]) => [
            domain,
            {
              NSIncludesSubdomains: true,
              NSPinnedLeafIdentities: pins.map((pin) => ({
                "SPKI-SHA256-BASE64": pin.replace("sha256/", ""),
              })),
            },
          ])
        ),
      },
    };
  },
};
