/**
 * @fileoverview Social authentication type definitions
 * Provides shared types for Google and Apple sign-in adapters.
 * @module services/auth/social/types
 */

/**
 * Supported social authentication providers.
 */
export type SocialProvider = "google" | "apple";

/**
 * User information returned from a social sign-in flow.
 */
export interface SocialUser {
  /** Unique user ID from the provider */
  id: string;
  /** User's email address */
  email: string;
  /** User's display name */
  name: string;
  /** URL to the user's avatar/profile picture */
  avatar?: string;
}

/**
 * Result of a successful social authentication.
 * Contains the provider identifier, tokens, and user info.
 */
export interface SocialAuthResult {
  /** The social provider used for authentication */
  provider: SocialProvider;
  /** JWT ID token from the provider */
  idToken: string;
  /** OAuth access token (not always available, e.g., Apple) */
  accessToken?: string;
  /** Authenticated user information */
  user: SocialUser;
}

/**
 * Configuration for Google Sign-In.
 */
export interface GoogleAuthConfig {
  /** Web client ID (required for expo-auth-session) */
  clientId: string;
  /** iOS-specific client ID (optional, falls back to clientId) */
  iosClientId?: string;
  /** Android-specific client ID (optional, falls back to clientId) */
  androidClientId?: string;
}

/**
 * Configuration for Apple Sign-In.
 * Apple Sign-In requires no additional configuration beyond platform support.
 */
export interface AppleAuthConfig {
  /** Reserved for future Apple-specific configuration */
}

/**
 * Combined social auth configuration.
 * Pass to SocialAuth.configure() to set up providers.
 */
export interface SocialAuthConfig {
  /** Google Sign-In configuration */
  google?: GoogleAuthConfig;
  /** Apple Sign-In configuration */
  apple?: AppleAuthConfig;
}

/**
 * Options passed to the Google sign-in function.
 */
export interface GoogleSignInOptions {
  /** Web client ID (overrides configured value) */
  clientId?: string;
  /** iOS-specific client ID (overrides configured value) */
  iosClientId?: string;
  /** Android-specific client ID (overrides configured value) */
  androidClientId?: string;
}
