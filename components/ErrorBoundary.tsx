import { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Updates from "expo-updates";
import i18next from "i18next";
import { captureException, addBreadcrumb, Sentry } from "@/services/sentry";
import { Logger } from "@/services/logger/logger-adapter";
import { useAppStore } from "@/stores/appStore";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  crashCount: number;
}

const MAX_SOFT_RESETS = 3;

/**
 * Global Error Boundary component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app.
 *
 * After multiple consecutive soft-reset failures, automatically
 * offers a hard reset (clears stores + full app restart).
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      crashCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState((prev) => {
      const crashCount = prev.crashCount + 1;
      const lastCrashTime = new Date().toISOString();

      // Set Sentry context for crash recovery debugging
      Sentry.setContext("crash_recovery", { crashCount, lastCrashTime });

      return { errorInfo, crashCount };
    });

    // Log to error reporting service
    this.logError(error, errorInfo);
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    // Add breadcrumb for context
    addBreadcrumb("error-boundary", "Error caught by ErrorBoundary", {
      componentStack: errorInfo.componentStack?.slice(0, 500),
    });

    // Send to Sentry
    captureException(error, {
      componentStack: errorInfo.componentStack,
    });

    // Log via Logger facade
    Logger.error("ErrorBoundary caught an error", error, {
      componentStack: errorInfo.componentStack?.slice(0, 500),
    });
  }

  /**
   * Hard reset: clears all Zustand persisted state and reloads the app.
   */
  private handleHardReset = async () => {
    try {
      // Reset Zustand stores
      useAppStore.getState().reset();

      // Full app restart via expo-updates
      if (!__DEV__) {
        await Updates.reloadAsync();
      } else {
        // In dev, just reset the error state and crash counter
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          crashCount: 0,
        });
      }
    } catch {
      // Last resort: reset error state so user isn't stuck
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        crashCount: 0,
      });
    }
  };

  /**
   * Soft reset: simply re-renders the children by clearing the error state.
   */
  private handleSoftReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const showHardReset = this.state.crashCount >= MAX_SOFT_RESETS;

      return (
        <View className="flex-1 items-center justify-center bg-background-light px-6 dark:bg-background-dark">
          {/* Error Icon */}
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Ionicons name="warning-outline" size={48} color="#ef4444" />
          </View>

          {/* Title */}
          <Text className="mb-2 text-center text-2xl font-bold text-text-light dark:text-text-dark">
            {i18next.t("errors.crashTitle")}
          </Text>

          {/* Description */}
          <Text className="mb-8 text-center text-muted-light dark:text-muted-dark">
            {i18next.t("errors.crashMessage")}
          </Text>

          {/* Error details (dev only) */}
          {__DEV__ && this.state.error && (
            <ScrollView className="mb-6 max-h-32 w-full rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
              <Text className="font-mono text-xs text-red-600 dark:text-red-400">
                {this.state.error.toString()}
              </Text>
              {this.state.errorInfo && (
                <Text className="mt-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                  {this.state.errorInfo.componentStack?.slice(0, 500)}...
                </Text>
              )}
            </ScrollView>
          )}

          {/* Action buttons */}
          <View className="w-full gap-3">
            {showHardReset ? (
              // After MAX_SOFT_RESETS consecutive failures, show hard reset
              <Pressable
                onPress={this.handleHardReset}
                className="w-full items-center rounded-xl bg-red-600 py-4"
              >
                <Text className="font-semibold text-white">
                  {i18next.t("errors.restartApp")}
                </Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  onPress={this.handleSoftReset}
                  className="w-full items-center rounded-xl bg-primary-600 py-4"
                >
                  <Text className="font-semibold text-white">
                    {i18next.t("errors.tryAgain")}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={this.handleHardReset}
                  className="w-full items-center rounded-xl border-2 border-gray-300 py-4 dark:border-gray-600"
                >
                  <Text className="font-semibold text-text-light dark:text-text-dark">
                    {i18next.t("errors.restartApp")}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap any component with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
