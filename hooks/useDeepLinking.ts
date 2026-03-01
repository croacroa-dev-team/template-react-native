import { useEffect, useCallback } from "react";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { Logger } from "@/services/logger/logger-adapter";

// Define your app's deep link routes
type DeepLinkRoute =
  | { path: "login"; params?: never }
  | { path: "register"; params?: never }
  | { path: "reset-password"; params: { token: string } }
  | { path: "profile"; params?: { userId?: string } }
  | { path: "settings"; params?: never }
  | { path: "post"; params: { postId: string } };

interface ParsedDeepLink {
  route: DeepLinkRoute | null;
  rawUrl: string;
}

/**
 * Parse a deep link URL into a route and params
 */
function parseDeepLink(url: string): ParsedDeepLink {
  try {
    const parsed = Linking.parse(url);
    const { path, queryParams } = parsed;

    if (!path) {
      return { route: null, rawUrl: url };
    }

    // Map URL paths to app routes
    switch (path) {
      case "login":
        return { route: { path: "login" }, rawUrl: url };

      case "register":
      case "signup":
        return { route: { path: "register" }, rawUrl: url };

      case "reset-password":
        if (queryParams?.token && typeof queryParams.token === "string") {
          return {
            route: {
              path: "reset-password",
              params: { token: queryParams.token },
            },
            rawUrl: url,
          };
        }
        return { route: null, rawUrl: url };

      case "profile":
        return {
          route: {
            path: "profile",
            params: queryParams?.userId
              ? { userId: String(queryParams.userId) }
              : undefined,
          },
          rawUrl: url,
        };

      case "settings":
        return { route: { path: "settings" }, rawUrl: url };

      case "post":
        if (queryParams?.id && typeof queryParams.id === "string") {
          return {
            route: { path: "post", params: { postId: queryParams.id } },
            rawUrl: url,
          };
        }
        return { route: null, rawUrl: url };

      default: {
        // Try to handle paths like /post/123
        const pathParts = path.split("/");
        if (pathParts[0] === "post" && pathParts[1]) {
          return {
            route: { path: "post", params: { postId: pathParts[1] } },
            rawUrl: url,
          };
        }
        if (pathParts[0] === "profile" && pathParts[1]) {
          return {
            route: { path: "profile", params: { userId: pathParts[1] } },
            rawUrl: url,
          };
        }
        return { route: null, rawUrl: url };
      }
    }
  } catch (error) {
    Logger.error("Failed to parse deep link:", error as Error);
    return { route: null, rawUrl: url };
  }
}

/**
 * Navigate to a deep link route
 */
function navigateToRoute(route: DeepLinkRoute): void {
  switch (route.path) {
    case "login":
      router.replace("/(public)/login");
      break;

    case "register":
      router.replace("/(public)/register");
      break;

    case "reset-password":
      // Navigate to forgot password with token
      router.push({
        pathname: "/(public)/forgot-password",
        params: { token: route.params.token },
      });
      break;

    case "profile":
      if (route.params?.userId) {
        // Navigate to specific user profile
        router.push({
          pathname: "/(auth)/profile",
          params: { userId: route.params.userId },
        });
      } else {
        // Navigate to own profile
        router.push("/(auth)/profile");
      }
      break;

    case "settings":
      router.push("/(auth)/settings");
      break;

    case "post":
      // You'll need to create this route
      router.push({
        pathname: "/(auth)/post/[id]" as const,
        params: { id: route.params.postId },
      } as Parameters<typeof router.push>[0]);
      break;
  }
}

interface UseDeepLinkingOptions {
  /**
   * Called when a deep link is received but couldn't be parsed
   */
  onUnknownLink?: (url: string) => void;

  /**
   * Called before navigating to allow custom handling
   * Return false to prevent default navigation
   */
  onBeforeNavigate?: (route: DeepLinkRoute) => boolean | void;

  /**
   * Whether deep linking is enabled
   * @default true
   */
  enabled?: boolean;
}

/**
 * Hook to handle deep links in your app
 *
 * @example
 * ```tsx
 * function App() {
 *   useDeepLinking({
 *     onUnknownLink: (url) => console.log('Unknown link:', url),
 *     onBeforeNavigate: (route) => {
 *       // Custom validation before navigating
 *       if (route.path === 'profile' && !isAuthenticated) {
 *         router.push('/login');
 *         return false; // Prevent default navigation
 *       }
 *     },
 *   });
 *
 *   return <App />;
 * }
 * ```
 */
export function useDeepLinking(options: UseDeepLinkingOptions = {}): void {
  const { onUnknownLink, onBeforeNavigate, enabled = true } = options;

  const handleDeepLink = useCallback(
    (event: { url: string }) => {
      if (!enabled) return;

      const { route, rawUrl } = parseDeepLink(event.url);

      if (!route) {
        onUnknownLink?.(rawUrl);
        Logger.debug("Unknown deep link", { url: rawUrl });
        return;
      }

      // Allow custom handling before navigation
      const shouldNavigate = onBeforeNavigate?.(route);
      if (shouldNavigate === false) {
        return;
      }

      navigateToRoute(route);
    },
    [enabled, onUnknownLink, onBeforeNavigate]
  );

  useEffect(() => {
    if (!enabled) return;

    // Handle deep links when app is already open
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Handle deep link that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, handleDeepLink]);
}

/**
 * Get the app's deep link URL prefix
 */
export function getDeepLinkPrefix(): string {
  return Linking.createURL("/");
}

/**
 * Create a deep link URL for the app
 *
 * @example
 * ```ts
 * const url = createDeepLink('profile', { userId: '123' });
 * // Returns: yourapp://profile?userId=123
 * ```
 */
export function createDeepLink(
  path: string,
  params?: Record<string, string>
): string {
  return Linking.createURL(path, { queryParams: params });
}

export { parseDeepLink, navigateToRoute };
export type { DeepLinkRoute, ParsedDeepLink };
