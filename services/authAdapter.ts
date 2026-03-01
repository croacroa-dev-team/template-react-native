/**
 * Auth Adapter Pattern
 *
 * This module provides an abstraction layer for authentication providers.
 * Replace the mock implementation with your actual provider (Supabase, Firebase, etc.)
 */

import * as SecureStore from "expo-secure-store";
import type { User, AuthTokens } from "@/types";
import { Logger } from "@/services/logger/logger-adapter";

// ============================================================================
// Types
// ============================================================================

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface AuthAdapter {
  /**
   * Sign in with email and password
   */
  signIn(email: string, password: string): Promise<AuthResult>;

  /**
   * Sign up with email, password, and name
   */
  signUp(email: string, password: string, name: string): Promise<AuthResult>;

  /**
   * Sign out the current user
   */
  signOut(): Promise<void>;

  /**
   * Refresh the access token using the refresh token
   */
  refreshToken(refreshToken: string): Promise<AuthTokens>;

  /**
   * Send a password reset email
   */
  forgotPassword(email: string): Promise<void>;

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Promise<void>;

  /**
   * Get current session (useful for providers like Supabase)
   */
  getSession(): Promise<AuthResult | null>;

  /**
   * Subscribe to auth state changes (optional)
   */
  onAuthStateChange?(callback: (user: User | null) => void): () => void;
}

// ============================================================================
// Mock Implementation (for development/testing)
// ============================================================================

export const mockAuthAdapter: AuthAdapter = {
  async signIn(email: string, password: string): Promise<AuthResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate validation
    if (!email.includes("@")) {
      throw { code: "invalid_email", message: "Invalid email format" };
    }
    if (password.length < 6) {
      throw { code: "weak_password", message: "Password too short" };
    }

    return {
      user: {
        id: "mock_user_1",
        email,
        name: email.split("@")[0],
        createdAt: new Date().toISOString(),
      },
      tokens: {
        accessToken: `mock_access_${Date.now()}`,
        refreshToken: `mock_refresh_${Date.now()}`,
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
      },
    };
  },

  async signUp(
    email: string,
    password: string,
    name: string
  ): Promise<AuthResult> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!email.includes("@")) {
      throw { code: "invalid_email", message: "Invalid email format" };
    }
    if (password.length < 8) {
      throw {
        code: "weak_password",
        message: "Password must be at least 8 characters",
      };
    }

    return {
      user: {
        id: "mock_user_new",
        email,
        name,
        createdAt: new Date().toISOString(),
      },
      tokens: {
        accessToken: `mock_access_${Date.now()}`,
        refreshToken: `mock_refresh_${Date.now()}`,
        expiresAt: Date.now() + 60 * 60 * 1000,
      },
    };
  },

  async signOut(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Clear any stored tokens
    await SecureStore.deleteItemAsync("auth_tokens");
    await SecureStore.deleteItemAsync("auth_user");
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!refreshToken) {
      throw { code: "invalid_token", message: "Invalid refresh token" };
    }

    return {
      accessToken: `mock_access_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
      expiresAt: Date.now() + 60 * 60 * 1000,
    };
  },

  async forgotPassword(email: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!email.includes("@")) {
      throw { code: "invalid_email", message: "Invalid email format" };
    }

    Logger.debug(`[Mock] Password reset email sent to ${email}`);
  },

  async resetPassword(_token: string, newPassword: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (newPassword.length < 8) {
      throw {
        code: "weak_password",
        message: "Password must be at least 8 characters",
      };
    }

    Logger.debug("[Mock] Password reset successful");
  },

  async getSession(): Promise<AuthResult | null> {
    try {
      const storedTokens = await SecureStore.getItemAsync("auth_tokens");
      const storedUser = await SecureStore.getItemAsync("auth_user");

      if (storedTokens && storedUser) {
        return {
          tokens: JSON.parse(storedTokens),
          user: JSON.parse(storedUser),
        };
      }
      return null;
    } catch {
      return null;
    }
  },
};

// ============================================================================
// Supabase Implementation Example
// ============================================================================

/**
 * Example Supabase implementation:
 *
 * import { createClient } from "@supabase/supabase-js";
 *
 * const supabase = createClient(
 *   process.env.EXPO_PUBLIC_SUPABASE_URL!,
 *   process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
 * );
 *
 * export const supabaseAuthAdapter: AuthAdapter = {
 *   async signIn(email, password) {
 *     const { data, error } = await supabase.auth.signInWithPassword({
 *       email,
 *       password,
 *     });
 *
 *     if (error) throw { code: error.name, message: error.message };
 *
 *     return {
 *       user: {
 *         id: data.user!.id,
 *         email: data.user!.email!,
 *         name: data.user!.user_metadata.name || email.split("@")[0],
 *         avatar: data.user!.user_metadata.avatar_url,
 *         createdAt: data.user!.created_at,
 *       },
 *       tokens: {
 *         accessToken: data.session!.access_token,
 *         refreshToken: data.session!.refresh_token,
 *         expiresAt: data.session!.expires_at! * 1000,
 *       },
 *     };
 *   },
 *
 *   async signUp(email, password, name) {
 *     const { data, error } = await supabase.auth.signUp({
 *       email,
 *       password,
 *       options: { data: { name } },
 *     });
 *
 *     if (error) throw { code: error.name, message: error.message };
 *
 *     return {
 *       user: {
 *         id: data.user!.id,
 *         email: data.user!.email!,
 *         name,
 *         createdAt: data.user!.created_at,
 *       },
 *       tokens: {
 *         accessToken: data.session!.access_token,
 *         refreshToken: data.session!.refresh_token,
 *         expiresAt: data.session!.expires_at! * 1000,
 *       },
 *     };
 *   },
 *
 *   async signOut() {
 *     await supabase.auth.signOut();
 *   },
 *
 *   async refreshToken() {
 *     const { data, error } = await supabase.auth.refreshSession();
 *     if (error) throw { code: error.name, message: error.message };
 *
 *     return {
 *       accessToken: data.session!.access_token,
 *       refreshToken: data.session!.refresh_token,
 *       expiresAt: data.session!.expires_at! * 1000,
 *     };
 *   },
 *
 *   async forgotPassword(email) {
 *     const { error } = await supabase.auth.resetPasswordForEmail(email);
 *     if (error) throw { code: error.name, message: error.message };
 *   },
 *
 *   async resetPassword(token, newPassword) {
 *     const { error } = await supabase.auth.updateUser({ password: newPassword });
 *     if (error) throw { code: error.name, message: error.message };
 *   },
 *
 *   async getSession() {
 *     const { data } = await supabase.auth.getSession();
 *     if (!data.session) return null;
 *
 *     const { data: userData } = await supabase.auth.getUser();
 *
 *     return {
 *       user: {
 *         id: userData.user!.id,
 *         email: userData.user!.email!,
 *         name: userData.user!.user_metadata.name,
 *         avatar: userData.user!.user_metadata.avatar_url,
 *         createdAt: userData.user!.created_at,
 *       },
 *       tokens: {
 *         accessToken: data.session.access_token,
 *         refreshToken: data.session.refresh_token,
 *         expiresAt: data.session.expires_at! * 1000,
 *       },
 *     };
 *   },
 *
 *   onAuthStateChange(callback) {
 *     const { data: { subscription } } = supabase.auth.onAuthStateChange(
 *       async (event, session) => {
 *         if (session) {
 *           callback({
 *             id: session.user.id,
 *             email: session.user.email!,
 *             name: session.user.user_metadata.name,
 *             avatar: session.user.user_metadata.avatar_url,
 *             createdAt: session.user.created_at,
 *           });
 *         } else {
 *           callback(null);
 *         }
 *       }
 *     );
 *
 *     return () => subscription.unsubscribe();
 *   },
 * };
 */

// ============================================================================
// Active Adapter
// ============================================================================

/**
 * Change this to use your preferred auth provider
 * Options: mockAuthAdapter, supabaseAuthAdapter, firebaseAuthAdapter, etc.
 */
export const authAdapter: AuthAdapter = mockAuthAdapter;
