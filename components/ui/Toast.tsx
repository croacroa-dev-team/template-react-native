/**
 * @fileoverview Custom Toast component with animations
 * Provides a flexible toast notification system as an alternative to Burnt.
 * @module components/ui/Toast
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  AccessibilityInfo,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  SlideInUp,
  SlideOutUp,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ============================================================================
// Types
// ============================================================================

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastConfig {
  /** Unique identifier */
  id: string;
  /** Toast type determines icon and colors */
  type: ToastType;
  /** Main message */
  title: string;
  /** Optional description */
  message?: string;
  /** Duration in ms (0 = persistent) */
  duration?: number;
  /** Action button */
  action?: {
    label: string;
    onPress: () => void;
  };
  /** Called when toast is dismissed */
  onDismiss?: () => void;
}

interface ToastContextValue {
  show: (config: Omit<ToastConfig, "id">) => string;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook to access toast functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const toast = useToast();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       toast.success("Saved!", "Your changes have been saved.");
 *     } catch (e) {
 *       toast.error("Error", "Failed to save changes.");
 *     }
 *   };
 * }
 * ```
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// ============================================================================
// Toast Item Component
// ============================================================================

const TOAST_CONFIG = {
  success: {
    icon: "checkmark-circle" as const,
    bgColor: "bg-green-500",
    iconColor: "#22c55e",
  },
  error: {
    icon: "close-circle" as const,
    bgColor: "bg-red-500",
    iconColor: "#ef4444",
  },
  warning: {
    icon: "warning" as const,
    bgColor: "bg-amber-500",
    iconColor: "#f59e0b",
  },
  info: {
    icon: "information-circle" as const,
    bgColor: "bg-blue-500",
    iconColor: "#3b82f6",
  },
};

interface ToastItemProps {
  config: ToastConfig;
  onDismiss: (id: string) => void;
}

function ToastItem({ config, onDismiss }: ToastItemProps) {
  const { type, title, message, duration = 4000, action, id } = config;
  const { icon, iconColor } = TOAST_CONFIG[type];
  const progress = useSharedValue(1);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Announce to screen readers
    AccessibilityInfo.announceForAccessibility(
      `${type}: ${title}. ${message || ""}`
    );

    if (duration > 0) {
      // Start progress animation
      progress.value = withTiming(0, { duration });

      // Auto-dismiss timer
      timerRef.current = setTimeout(() => {
        onDismiss(id);
      }, duration);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [duration, id, onDismiss, progress, type, title, message]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handleDismiss = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    config.onDismiss?.();
    onDismiss(id);
  };

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(15)}
      exiting={SlideOutUp.springify().damping(15)}
      style={styles.toastContainer}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Pressable
        onPress={handleDismiss}
        style={styles.toastContent}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
      >
        {/* Icon */}
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>

        {/* Text */}
        <View style={styles.textContainer}>
          <Text
            className="text-base font-semibold text-gray-900 dark:text-white"
            numberOfLines={1}
          >
            {title}
          </Text>
          {message && (
            <Text
              className="text-sm text-gray-600 dark:text-gray-300 mt-0.5"
              numberOfLines={2}
            >
              {message}
            </Text>
          )}
        </View>

        {/* Action Button */}
        {action && (
          <Pressable
            onPress={() => {
              action.onPress();
              handleDismiss();
            }}
            className="ml-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg"
          >
            <Text className="text-sm font-medium text-primary-600 dark:text-primary-400">
              {action.label}
            </Text>
          </Pressable>
        )}

        {/* Close button */}
        <Pressable
          onPress={handleDismiss}
          className="ml-2 p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Dismiss notification"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={20} color="#9ca3af" />
        </Pressable>
      </Pressable>

      {/* Progress bar */}
      {duration > 0 && (
        <View className="absolute bottom-0 left-4 right-4 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <Animated.View
            style={[
              styles.progressBar,
              progressStyle,
              { backgroundColor: iconColor },
            ]}
          />
        </View>
      )}
    </Animated.View>
  );
}

// ============================================================================
// Toast Provider
// ============================================================================

interface ToastProviderProps {
  children: ReactNode;
  /** Maximum number of toasts to show at once */
  maxToasts?: number;
}

/**
 * Toast provider component. Wrap your app with this to enable toasts.
 *
 * @example
 * ```tsx
 * export default function App() {
 *   return (
 *     <ToastProvider maxToasts={3}>
 *       <NavigationContainer>
 *         <RootNavigator />
 *       </NavigationContainer>
 *     </ToastProvider>
 *   );
 * }
 * ```
 */
export function ToastProvider({ children, maxToasts = 3 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);
  const insets = useSafeAreaInsets();
  const idCounter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const show = useCallback(
    (config: Omit<ToastConfig, "id">): string => {
      const id = `toast-${++idCounter.current}`;
      const newToast: ToastConfig = { ...config, id };

      setToasts((prev) => {
        const updated = [newToast, ...prev];
        // Limit number of toasts
        return updated.slice(0, maxToasts);
      });

      return id;
    },
    [maxToasts]
  );

  const success = useCallback(
    (title: string, message?: string) =>
      show({ type: "success", title, message }),
    [show]
  );

  const error = useCallback(
    (title: string, message?: string) =>
      show({ type: "error", title, message }),
    [show]
  );

  const warning = useCallback(
    (title: string, message?: string) =>
      show({ type: "warning", title, message }),
    [show]
  );

  const info = useCallback(
    (title: string, message?: string) => show({ type: "info", title, message }),
    [show]
  );

  return (
    <ToastContext.Provider
      value={{ show, success, error, warning, info, dismiss, dismissAll }}
    >
      {children}
      <View
        style={[styles.container, { top: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} config={toast} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

// ============================================================================
// Styles
// ============================================================================

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
  },
  toastContainer: {
    width: width - 32,
    marginBottom: 8,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingBottom: 16,
  },
  textContainer: {
    flex: 1,
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
});

// ============================================================================
// Imperative API (for use outside React components)
// ============================================================================

let toastRef: ToastContextValue | null = null;

export function setToastRef(ref: ToastContextValue | null) {
  toastRef = ref;
}

/**
 * Imperative toast API for use outside React components.
 * Must call setToastRef first from within ToastProvider.
 *
 * @example
 * ```tsx
 * // In your root component:
 * function App() {
 *   const toastContext = useToast();
 *   useEffect(() => {
 *     setToastRef(toastContext);
 *     return () => setToastRef(null);
 *   }, [toastContext]);
 *   // ...
 * }
 *
 * // Then anywhere:
 * import { toastManager } from '@/components/ui/Toast';
 * toastManager.success('Done!');
 * ```
 */
export const toastManager = {
  show: (config: Omit<ToastConfig, "id">) => toastRef?.show(config),
  success: (title: string, message?: string) =>
    toastRef?.success(title, message),
  error: (title: string, message?: string) => toastRef?.error(title, message),
  warning: (title: string, message?: string) =>
    toastRef?.warning(title, message),
  info: (title: string, message?: string) => toastRef?.info(title, message),
  dismiss: (id: string) => toastRef?.dismiss(id),
  dismissAll: () => toastRef?.dismissAll(),
};
