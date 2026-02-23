/**
 * @fileoverview Social authentication orchestrator
 * Provides a unified API for Google and Apple sign-in flows.
 * Configure once, then call SocialAuth.signIn(provider) from anywhere.
 * @module services/auth/social/social-auth
 */

import { signInWithGoogle } from "./google";
import { signInWithApple } from "./apple";

import type {
  SocialProvider,
  SocialAuthResult,
  SocialAuthConfig,
} from "./types";

// Re-export commonly used types and utilities
export { isAppleSignInAvailable } from "./apple";
export type { SocialAuthResult, SocialProvider } from "./types";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Internal configuration state.
 * Set via SocialAuth.configure() before calling signIn().
 */
let config: SocialAuthConfig = {};

// ============================================================================
// Social Auth API
// ============================================================================

/**
 * Unified social authentication API.
 *
 * @example
 * ```ts
 * // Configure (typically in app startup)
 * SocialAuth.configure({
 *   google: {
 *     clientId: 'your-client-id.apps.googleusercontent.com',
 *     iosClientId: 'your-ios-client-id.apps.googleusercontent.com',
 *   },
 * });
 *
 * // Sign in with a provider
 * const result = await SocialAuth.signIn('google');
 * if (result) {
 *   // Send result.idToken to your backend for verification
 * }
 * ```
 */
export const SocialAuth = {
  /**
   * Configure social auth providers.
   * Call this once during app initialization (e.g., in _layout.tsx).
   *
   * @param newConfig - Provider configuration
   */
  configure(newConfig: SocialAuthConfig): void {
    config = { ...config, ...newConfig };
  },

  /**
   * Initiate sign-in with the specified social provider.
   *
   * @param provider - The social provider to sign in with ('google' | 'apple')
   * @returns SocialAuthResult on success, null if the user cancelled
   * @throws Error if the provider is not configured or sign-in fails
   */
  async signIn(provider: SocialProvider): Promise<SocialAuthResult | null> {
    switch (provider) {
      case "google": {
        if (!config.google?.clientId) {
          throw new Error(
            "Google Sign-In is not configured. " +
              "Call SocialAuth.configure({ google: { clientId: '...' } }) first."
          );
        }

        return signInWithGoogle({
          clientId: config.google.clientId,
          iosClientId: config.google.iosClientId,
          androidClientId: config.google.androidClientId,
        });
      }

      case "apple": {
        return signInWithApple();
      }

      default: {
        const _exhaustive: never = provider;
        throw new Error(`Unknown social provider: ${_exhaustive}`);
      }
    }
  },
};
