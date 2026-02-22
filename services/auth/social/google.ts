/**
 * @fileoverview Google Sign-In adapter using expo-auth-session
 * Implements OAuth 2.0 with PKCE for secure Google authentication.
 * @module services/auth/social/google
 */

import * as WebBrowser from "expo-web-browser";
import {
  makeRedirectUri,
  AuthRequest,
  exchangeCodeAsync,
  type AuthSessionResult,
} from "expo-auth-session";
import { Platform } from "react-native";

import type { SocialAuthResult, GoogleSignInOptions } from "./types";

// Required for web-based auth session completion
WebBrowser.maybeCompleteAuthSession();

// ============================================================================
// Google OAuth Discovery Document
// ============================================================================

/**
 * Google OAuth 2.0 endpoint configuration.
 * @see https://accounts.google.com/.well-known/openid-configuration
 */
const GOOGLE_DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

// ============================================================================
// JWT Decoding
// ============================================================================

/**
 * Decodes a JWT token payload without verification.
 * Used to extract user information from the Google ID token.
 *
 * NOTE: In production, you should verify the token on your backend.
 * This client-side decode is only for extracting display information.
 */
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    const payload = parts[1];
    // Handle base64url encoding (replace URL-safe chars and pad)
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);

    return JSON.parse(decoded);
  } catch {
    throw new Error("Failed to decode JWT token");
  }
}

// ============================================================================
// Google Sign-In
// ============================================================================

/**
 * Initiates a Google Sign-In flow using expo-auth-session with PKCE.
 *
 * @param options - Google sign-in configuration options
 * @returns SocialAuthResult on success, null if the user cancelled
 * @throws Error if the sign-in flow fails
 *
 * @example
 * ```ts
 * const result = await signInWithGoogle({
 *   clientId: 'your-client-id.apps.googleusercontent.com',
 * });
 *
 * if (result) {
 *   console.log('Signed in as:', result.user.name);
 * }
 * ```
 */
export async function signInWithGoogle(
  options: GoogleSignInOptions
): Promise<SocialAuthResult | null> {
  const clientId = Platform.select({
    ios: options.iosClientId ?? options.clientId,
    android: options.androidClientId ?? options.clientId,
    default: options.clientId,
  });

  if (!clientId) {
    throw new Error(
      "Google Sign-In requires a clientId. " +
        "Call SocialAuth.configure({ google: { clientId: '...' } }) first."
    );
  }

  const redirectUri = makeRedirectUri({
    scheme: undefined, // Uses Expo's default scheme
  });

  // Create auth request with PKCE enabled
  const authRequest = new AuthRequest({
    clientId,
    redirectUri,
    scopes: ["openid", "profile", "email"],
    usePKCE: true,
  });

  // Prompt the user to sign in
  const authResult: AuthSessionResult = await authRequest.promptAsync(
    GOOGLE_DISCOVERY
  );

  // User cancelled or dismissed the dialog
  if (authResult.type !== "success") {
    return null;
  }

  const { code } = authResult.params;

  // Exchange authorization code for tokens
  const tokenResult = await exchangeCodeAsync(
    {
      clientId,
      code,
      redirectUri,
      extraParams: {
        code_verifier: authRequest.codeVerifier ?? "",
      },
    },
    GOOGLE_DISCOVERY
  );

  const { idToken, accessToken } = tokenResult;

  if (!idToken) {
    throw new Error("Google Sign-In did not return an ID token");
  }

  // Decode user info from the ID token
  const payload = decodeJwtPayload(idToken);

  return {
    provider: "google",
    idToken,
    accessToken: accessToken ?? undefined,
    user: {
      id: (payload.sub as string) ?? "",
      email: (payload.email as string) ?? "",
      name: (payload.name as string) ?? "",
      avatar: (payload.picture as string) ?? undefined,
    },
  };
}
