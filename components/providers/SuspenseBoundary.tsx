/**
 * @fileoverview React 19-ready Suspense and Error Boundary components
 * Provides production-ready async UI patterns compatible with React 18 and 19.
 * @module components/providers/SuspenseBoundary
 */

import React, {
  Suspense,
  Component,
  ReactNode,
  ErrorInfo,
  createContext,
  useContext,
  useCallback,
  useState,
} from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";

// ============================================================================
// Error Boundary
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback component when error occurs */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show error details in development */
  showDetails?: boolean;
}

/**
 * Error Boundary component for catching and handling React errors.
 * Compatible with React 18 and ready for React 19's improved error handling.
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={(error, reset) => (
 *     <View>
 *       <Text>Something went wrong</Text>
 *       <Button onPress={reset}>Try Again</Button>
 *     </View>
 *   )}
 *   onError={(error) => logToSentry(error)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class LocalErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (__DEV__) {
      console.error("[ErrorBoundary] Caught error:", error);
      console.error(
        "[ErrorBoundary] Component stack:",
        errorInfo.componentStack
      );
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails = __DEV__ } = this.props;

    if (hasError && error) {
      // Custom fallback
      if (fallback) {
        if (typeof fallback === "function") {
          return fallback(error, this.reset);
        }
        return fallback;
      }

      // Default fallback
      return (
        <View className="flex-1 items-center justify-center p-6 bg-red-50 dark:bg-red-900/20">
          <Text className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
            Something went wrong
          </Text>
          <Text className="text-sm text-red-500 dark:text-red-300 text-center mb-4">
            {error.message}
          </Text>
          {showDetails && errorInfo && (
            <View className="bg-white dark:bg-gray-800 p-3 rounded-lg mb-4 max-h-40">
              <Text className="text-xs font-mono text-gray-600 dark:text-gray-300">
                {errorInfo.componentStack?.slice(0, 500)}
              </Text>
            </View>
          )}
          <Pressable
            onPress={this.reset}
            className="bg-red-600 px-6 py-3 rounded-xl"
            accessibilityLabel="Try again"
            accessibilityRole="button"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return children;
  }
}

// ============================================================================
// Suspense Boundary
// ============================================================================

interface SuspenseBoundaryProps {
  children: ReactNode;
  /** Loading fallback component */
  fallback?: ReactNode;
  /** Minimum time to show loading state (prevents flash) */
  minLoadingMs?: number;
  /** Custom loading component */
  LoadingComponent?: React.ComponentType<{ message?: string }>;
  /** Loading message */
  loadingMessage?: string;
}

/**
 * Default loading component
 */
function DefaultLoadingFallback({ message }: { message?: string }) {
  return (
    <View
      className="flex-1 items-center justify-center p-6"
      accessibilityLabel={message || "Loading"}
      accessibilityRole="progressbar"
    >
      <ActivityIndicator size="large" color="#3b82f6" />
      {message && (
        <Text className="mt-4 text-sm text-muted-light dark:text-muted-dark">
          {message}
        </Text>
      )}
    </View>
  );
}

/**
 * Enhanced Suspense Boundary with loading state management.
 * Ready for React 19's improved Suspense features.
 *
 * @example
 * ```tsx
 * <SuspenseBoundary
 *   loadingMessage="Loading profile..."
 *   minLoadingMs={300}
 * >
 *   <ProfileContent />
 * </SuspenseBoundary>
 * ```
 */
export function SuspenseBoundary({
  children,
  fallback,
  minLoadingMs: _minLoadingMs,
  LoadingComponent = DefaultLoadingFallback,
  loadingMessage,
}: SuspenseBoundaryProps) {
  const loadingFallback = fallback || (
    <LoadingComponent message={loadingMessage} />
  );

  // Note: minLoadingMs would require a custom implementation
  // React 19 may provide better APIs for this

  return <Suspense fallback={loadingFallback}>{children}</Suspense>;
}

// ============================================================================
// Combined Boundary
// ============================================================================

interface AsyncBoundaryProps extends SuspenseBoundaryProps, ErrorBoundaryProps {
  /** Unique key to reset boundary on navigation */
  resetKey?: string | number;
}

/**
 * Combined Error + Suspense boundary for async components.
 * The recommended pattern for data fetching components.
 *
 * @example
 * ```tsx
 * <AsyncBoundary
 *   loadingMessage="Loading data..."
 *   fallback={(error, reset) => <ErrorView error={error} onRetry={reset} />}
 *   onError={logError}
 * >
 *   <DataFetchingComponent />
 * </AsyncBoundary>
 * ```
 */
export function AsyncBoundary({
  children,
  fallback: errorFallback,
  onError,
  showDetails,
  loadingMessage,
  minLoadingMs,
  LoadingComponent,
  resetKey,
  fallback: loadingFallback,
}: AsyncBoundaryProps) {
  return (
    <LocalErrorBoundary
      key={resetKey}
      fallback={errorFallback}
      onError={onError}
      showDetails={showDetails}
    >
      <SuspenseBoundary
        fallback={loadingFallback}
        loadingMessage={loadingMessage}
        minLoadingMs={minLoadingMs}
        LoadingComponent={LoadingComponent}
      >
        {children}
      </SuspenseBoundary>
    </LocalErrorBoundary>
  );
}

// ============================================================================
// Query Boundary (React Query + Suspense)
// ============================================================================

interface QueryBoundaryProps {
  children: ReactNode;
  /** Loading state */
  loadingFallback?: ReactNode;
  /** Error state */
  errorFallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Empty state */
  emptyFallback?: ReactNode;
  /** Check if data is empty */
  isEmpty?: boolean;
}

/**
 * Specialized boundary for React Query with Suspense mode.
 * Handles loading, error, and empty states.
 *
 * @example
 * ```tsx
 * function UserList() {
 *   const { data } = useSuspenseQuery(userQueryOptions);
 *
 *   return (
 *     <QueryBoundary
 *       isEmpty={data.length === 0}
 *       emptyFallback={<EmptyState message="No users found" />}
 *     >
 *       {data.map(user => <UserCard key={user.id} user={user} />)}
 *     </QueryBoundary>
 *   );
 * }
 * ```
 */
export function QueryBoundary({
  children,
  loadingFallback,
  errorFallback,
  emptyFallback,
  isEmpty = false,
}: QueryBoundaryProps) {
  if (isEmpty && emptyFallback) {
    return <>{emptyFallback}</>;
  }

  return (
    <LocalErrorBoundary fallback={errorFallback}>
      <Suspense fallback={loadingFallback || <DefaultLoadingFallback />}>
        {children}
      </Suspense>
    </LocalErrorBoundary>
  );
}

// ============================================================================
// Context for Boundary Control
// ============================================================================

interface BoundaryContextValue {
  /** Reset all boundaries */
  resetAll: () => void;
  /** Report an error to parent boundaries */
  reportError: (error: Error) => void;
}

const BoundaryContext = createContext<BoundaryContextValue | null>(null);

/**
 * Hook to access boundary controls from child components
 */
export function useBoundary(): BoundaryContextValue {
  const context = useContext(BoundaryContext);
  if (!context) {
    // Return no-op functions if not in a boundary
    return {
      resetAll: () => {},
      reportError: () => {},
    };
  }
  return context;
}

/**
 * Provider for boundary controls
 */
export function BoundaryProvider({ children }: { children: ReactNode }) {
  const [resetKey, setResetKey] = useState(0);

  const resetAll = useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

  const reportError = useCallback((error: Error) => {
    // Could be used to propagate errors to error tracking
    console.error("[BoundaryProvider] Error reported:", error);
  }, []);

  return (
    <BoundaryContext.Provider value={{ resetAll, reportError }}>
      <LocalErrorBoundary key={resetKey}>{children}</LocalErrorBoundary>
    </BoundaryContext.Provider>
  );
}
