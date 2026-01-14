import { ReactNode } from "react";
import { ViewProps, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
  Layout,
} from "react-native-reanimated";
import { cn } from "@/utils/cn";

interface AnimatedCardProps extends Omit<ViewProps, "style"> {
  variant?: "default" | "elevated" | "outlined";
  className?: string;
  children: ReactNode;
  onPress?: () => void;
  entering?: boolean;
  index?: number;
}

/**
 * Animated Card component with various effects
 * Features:
 * - Entrance animation with stagger based on index
 * - Press animation with scale
 * - Layout animation for list reordering
 */
export function AnimatedCard({
  variant = "default",
  className,
  children,
  onPress,
  entering = true,
  index = 0,
  ...props
}: AnimatedCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const content = (
    <Animated.View
      entering={entering ? FadeIn.delay(index * 50).springify() : undefined}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify()}
      style={animatedStyle}
      className={cn(
        "rounded-xl",
        variant === "default" && "bg-surface-light dark:bg-surface-dark",
        variant === "elevated" &&
          "bg-surface-light shadow-lg dark:bg-surface-dark",
        variant === "outlined" &&
          "border-2 border-gray-200 bg-transparent dark:border-gray-700",
        className
      )}
      {...props}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

/**
 * Animated list wrapper for staggered animations
 */
export function AnimatedList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className={cn("gap-3", className)}
    >
      {children}
    </Animated.View>
  );
}
