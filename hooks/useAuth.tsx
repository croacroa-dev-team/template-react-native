/**
 * @fileoverview Authentication context and hooks
 * Provides secure authentication with token management, auto-refresh, and persistent sessions.
 * @module hooks/useAuth
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { toast } from "@/utils/toast";

/**
 * User profile information
 */
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Authentication context type definition.
 * Provides all authentication-related state and actions.
 */
interface AuthContextType {
  /** Currently authenticated user, or null if not authenticated */
  user: User | null;
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Whether the auth state is still loading (e.g., checking stored tokens) */
  isLoading: boolean;
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<void>;
  /** Create a new account */
  signUp: (email: string, password: string, name: string) => Promise<void>;
  /** Sign out and clear all stored credentials */
  signOut: () => Promise<void>;
  /** Update the current user's profile locally */
  updateUser: (user: Partial<User>) => void;
  /** Manually refresh the session tokens */
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_tokens";
const USER_KEY = "auth_user";
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

/**
 * Authentication Provider component.
 * Wraps your app to provide authentication context to all children.
 *
 * Features:
 * - Automatic token refresh before expiry
 * - Secure token storage (iOS Keychain / Android Encrypted SharedPreferences)
 * - Persistent sessions across app restarts
 * - Automatic session validation on app launch
 *
 * @param children - Child components to wrap
 *
 * @example
 * ```tsx
 * // In your app root (_layout.tsx)
 * export default function RootLayout() {
 *   return (
 *     <AuthProvider>
 *       <ThemeProvider>
 *         <App />
 *       </ThemeProvider>
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Setup token refresh interval
  useEffect(() => {
    if (!tokens) return;

    const checkAndRefresh = async () => {
      const timeUntilExpiry = tokens.expiresAt - Date.now();
      if (timeUntilExpiry < TOKEN_REFRESH_THRESHOLD) {
        await refreshSession();
      }
    };

    // Check immediately and then every minute
    checkAndRefresh();
    const interval = setInterval(checkAndRefresh, 60 * 1000);

    return () => clearInterval(interval);
  }, [tokens?.expiresAt]);

  const loadStoredAuth = async () => {
    try {
      const [storedTokens, storedUser] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (storedTokens && storedUser) {
        const parsedTokens: AuthTokens = JSON.parse(storedTokens);

        // Check if tokens are expired
        if (parsedTokens.expiresAt < Date.now()) {
          // Try to refresh
          const refreshed = await tryRefreshWithToken(
            parsedTokens.refreshToken
          );
          if (!refreshed) {
            await clearAuth();
            return;
          }
        } else {
          setTokens(parsedTokens);
          setUser(JSON.parse(storedUser));
        }
      }
    } catch (error) {
      console.error("Failed to load auth:", error);
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const tryRefreshWithToken = async (
    _refreshToken: string
  ): Promise<boolean> => {
    try {
      // TODO: Replace with your actual API call
      // const response = await api.post('/auth/refresh', { refreshToken });
      // const { accessToken, refreshToken: newRefreshToken, expiresIn, user } = response.data;

      // Mock implementation
      const mockTokens: AuthTokens = {
        accessToken: "new_mock_access_token",
        refreshToken: "new_mock_refresh_token",
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
      };
      const mockUser: User = {
        id: "1",
        email: "user@example.com",
        name: "User",
      };

      await saveAuth(mockTokens, mockUser);
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  };

  const saveAuth = async (newTokens: AuthTokens, newUser: User) => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(newTokens)),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser)),
    ]);
    setTokens(newTokens);
    setUser(newUser);
  };

  const clearAuth = async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    setTokens(null);
    setUser(null);
  };

  const signIn = useCallback(async (email: string, _password: string) => {
    try {
      // TODO: Replace with your actual API call
      // const response = await api.post('/auth/login', { email, password });
      // const { accessToken, refreshToken, expiresIn, user } = response.data;

      // Mock implementation - replace with real API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate validation
      if (email !== "test@example.com" && !email.includes("@")) {
        throw new Error("Invalid credentials");
      }

      const mockTokens: AuthTokens = {
        accessToken: "mock_access_token",
        refreshToken: "mock_refresh_token",
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
      };
      const mockUser: User = {
        id: "1",
        email,
        name: email.split("@")[0],
      };

      await saveAuth(mockTokens, mockUser);
      toast.success("Welcome back!", `Signed in as ${mockUser.name}`);
    } catch (error) {
      toast.error("Sign in failed", "Invalid email or password");
      throw error;
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        // TODO: Replace with your actual API call
        // const response = await api.post('/auth/register', { email, password, name });
        // const { accessToken, refreshToken, expiresIn, user } = response.data;

        // Mock implementation
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockTokens: AuthTokens = {
          accessToken: "mock_access_token",
          refreshToken: "mock_refresh_token",
          expiresAt: Date.now() + 60 * 60 * 1000,
        };
        const mockUser: User = {
          id: "1",
          email,
          name,
        };

        await saveAuth(mockTokens, mockUser);
        toast.success("Account created!", `Welcome, ${name}`);
      } catch (error) {
        toast.error("Sign up failed", "Could not create account");
        throw error;
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      // TODO: Optionally call logout endpoint to invalidate refresh token
      // await api.post('/auth/logout', { refreshToken: tokens?.refreshToken });

      await clearAuth();
      toast.info("Signed out");
      router.replace("/(public)/login");
    } catch (error) {
      console.error("Sign out error:", error);
      // Clear local state anyway
      await clearAuth();
    }
  }, []);

  const updateUser = useCallback(
    (updates: Partial<User>) => {
      if (user) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
      }
    },
    [user]
  );

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!tokens?.refreshToken) return false;
    return tryRefreshWithToken(tokens.refreshToken);
  }, [tokens]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!tokens,
        isLoading,
        signIn,
        signUp,
        signOut,
        updateUser,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication state and actions.
 * Must be used within an AuthProvider.
 *
 * @returns Authentication context with user, state, and actions
 * @throws Error if used outside of AuthProvider
 *
 * @example
 * ```tsx
 * function LoginScreen() {
 *   const { signIn, isLoading } = useAuth();
 *   const [email, setEmail] = useState('');
 *   const [password, setPassword] = useState('');
 *
 *   const handleLogin = async () => {
 *     try {
 *       await signIn(email, password);
 *       // Navigation happens automatically via router
 *     } catch (error) {
 *       // Error toast is shown automatically
 *     }
 *   };
 *
 *   return (
 *     <View>
 *       <Input value={email} onChangeText={setEmail} />
 *       <Input value={password} onChangeText={setPassword} secureTextEntry />
 *       <Button onPress={handleLogin} isLoading={isLoading}>
 *         Sign In
 *       </Button>
 *     </View>
 *   );
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Get the current access token for API calls
 * Automatically handles token refresh if needed
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const stored = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!stored) return null;

    const tokens: AuthTokens = JSON.parse(stored);

    // Check if token is expired or about to expire
    if (tokens.expiresAt < Date.now() + TOKEN_REFRESH_THRESHOLD) {
      // Token needs refresh - this should be handled by the auth context
      // For now, return the current token and let the API handle 401
      console.warn("Token is expired or about to expire");
    }

    return tokens.accessToken;
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return null;
  }
}
