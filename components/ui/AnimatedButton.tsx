import { forwardRef } from "react";
import { Text, ActivityIndicator, PressableProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { cn } from "@/utils/cn";
import { buttonA11y } from "@/utils/accessibility";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface AnimatedButtonProps extends Omit<PressableProps, "style"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  className?: string;
  textClassName?: string;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary-600",
  secondary: "bg-gray-200 dark:bg-gray-700",
  outline: "border-2 border-gray-300 dark:border-gray-600 bg-transparent",
  ghost: "bg-transparent",
  danger: "bg-red-600",
};

const variantTextStyles: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-text-light dark:text-text-dark",
  outline: "text-text-light dark:text-text-dark",
  ghost: "text-primary-600 dark:text-primary-400",
  danger: "text-white",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-2",
  md: "px-4 py-3",
  lg: "px-6 py-4",
};

const textSizeStyles: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

/**
 * Animated Button component with spring physics
 * Features:
 * - Scale down on press with spring animation
 * - Opacity change on press
 * - Smooth loading state transition
 */
export const AnimatedButton = forwardRef<Animated.View, AnimatedButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      className,
      textClassName,
      children,
      onPress,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const tap = Gesture.Tap()
      .enabled(!isDisabled)
      .onBegin(() => {
        scale.value = withSpring(0.95, {
          damping: 15,
          stiffness: 400,
        });
        opacity.value = withTiming(0.8, { duration: 100 });
      })
      .onFinalize(() => {
        scale.value = withSpring(1, {
          damping: 15,
          stiffness: 400,
        });
        opacity.value = withTiming(1, { duration: 100 });
      })
      .onEnd(() => {
        if (onPress) {
          // Run on JS thread
          onPress({} as any);
        }
      });

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: isDisabled ? 0.5 : opacity.value,
    }));

    return (
      <GestureDetector gesture={tap}>
        <Animated.View
          ref={ref}
          style={animatedStyle}
          className={cn(
            "flex-row items-center justify-center rounded-xl overflow-hidden",
            variantStyles[variant],
            sizeStyles[size],
            className
          )}
          {...buttonA11y(typeof children === "string" ? children : "Button", {
            disabled: isDisabled,
            loading: isLoading,
          })}
          {...props}
        >
          {isLoading ? (
            <ActivityIndicator
              color={
                variant === "primary" || variant === "danger"
                  ? "#ffffff"
                  : "#3b82f6"
              }
              size="small"
            />
          ) : typeof children === "string" ? (
            <Text
              className={cn(
                "font-semibold",
                variantTextStyles[variant],
                textSizeStyles[size],
                textClassName
              )}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </Animated.View>
      </GestureDetector>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";
