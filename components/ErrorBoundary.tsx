import { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Updates from "expo-updates";
import { captureException, addBreadcrumb } from "@/services/sentry";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log to your error reporting service (Sentry, Bugsnag, etc.)
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

    // Also log to console in dev
    console.error("ErrorBoundary caught an error:", error);
    console.error("Component stack:", errorInfo.componentStack);
  }

  private handleRestart = async () => {
    try {
      // Try to reload the app using expo-updates
      if (!__DEV__) {
        await Updates.reloadAsync();
      } else {
        // In dev, just reset the error state
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
        });
      }
    } catch (e) {
      // If Updates.reloadAsync fails, reset state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  };

  private handleReset = () => {
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

      return (
        <View className="flex-1 items-center justify-center bg-background-light px-6 dark:bg-background-dark">
          {/* Error Icon */}
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Ionicons name="warning-outline" size={48} color="#ef4444" />
          </View>

          {/* Title */}
          <Text className="mb-2 text-center text-2xl font-bold text-text-light dark:text-text-dark">
            Oops! Something went wrong
          </Text>

          {/* Description */}
          <Text className="mb-8 text-center text-muted-light dark:text-muted-dark">
            The app ran into a problem and could not continue. We apologize for
            any inconvenience.
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
            <Pressable
              onPress={this.handleRestart}
              className="w-full items-center rounded-xl bg-primary-600 py-4"
            >
              <Text className="font-semibold text-white">Restart App</Text>
            </Pressable>

            <Pressable
              onPress={this.handleReset}
              className="w-full items-center rounded-xl border-2 border-gray-300 py-4 dark:border-gray-600"
            >
              <Text className="font-semibold text-text-light dark:text-text-dark">
                Try Again
              </Text>
            </Pressable>
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
