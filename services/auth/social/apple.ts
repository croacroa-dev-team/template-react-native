/**
 * @fileoverview Apple Sign-In adapter using expo-apple-authentication
 * Provides native Apple Sign-In on iOS devices.
 * @module services/auth/social/apple
 */

import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";

import type { SocialAuthResult } from "./types";

// ============================================================================
// Availability Check
// ============================================================================

/**
 * Checks whether Apple Sign-In is available on the current device.
 * Apple Sign-In is only available on iOS 13+.
 *
 * @returns true if the device supports Apple Sign-In
 *
 * @example
 * ```ts
 * if (isAppleSignInAvailable()) {
 *   // Show Apple Sign-In button
 * }
 * ```
 */
export function isAppleSignInAvailable(): boolean {
  return Platform.OS === "ios";
}

// ============================================================================
// Apple Sign-In
// ============================================================================

/**
 * Initiates the native Apple Sign-In flow.
 *
 * Requests the user's full name and email on first sign-in.
 * Note that Apple only provides the user's name on the FIRST sign-in;
 * subsequent sign-ins will not include the name.
 *
 * @returns SocialAuthResult on success, null if the user cancelled
 * @throws Error if Apple Sign-In is not available or fails unexpectedly
 *
 * @example
 * ```ts
 * if (isAppleSignInAvailable()) {
 *   const result = await signInWithApple();
 *   if (result) {
 *     console.log('Signed in as:', result.user.email);
 *   }
 * }
 * ```
 */
export async function signInWithApple(): Promise<SocialAuthResult | null> {
  if (!isAppleSignInAvailable()) {
    throw new Error("Apple Sign-In is only available on iOS devices");
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const { identityToken, user, fullName, email } = credential;

    if (!identityToken) {
      throw new Error("Apple Sign-In did not return an identity token");
    }

    // Build display name from fullName components
    // Apple only provides the name on the first sign-in
    const nameParts: string[] = [];
    if (fullName?.givenName) {
      nameParts.push(fullName.givenName);
    }
    if (fullName?.familyName) {
      nameParts.push(fullName.familyName);
    }
    const displayName = nameParts.length > 0 ? nameParts.join(" ") : "";

    return {
      provider: "apple",
      idToken: identityToken,
      user: {
        id: user,
        email: email ?? "",
        name: displayName,
        avatar: undefined,
      },
    };
  } catch (error: unknown) {
    // Handle user cancellation gracefully
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "ERR_REQUEST_CANCELED"
    ) {
      return null;
    }

    throw error;
  }
}
