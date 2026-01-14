import { useEffect } from "react";
import { View, ViewProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { cn } from "@/utils/cn";
import { useTheme } from "@/hooks/useTheme";

interface SkeletonProps extends ViewProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  className?: string;
}

/**
 * Animated skeleton loader component
 * Features shimmer effect that works in both light and dark mode
 */
export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = 8,
  className,
  style,
  ...props
}: SkeletonProps) {
  const { isDark } = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1, // infinite
      false // no reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        {
          width: width as number | `${number}%`,
          height: height as number | `${number}%`,
          borderRadius,
          backgroundColor: isDark ? "#334155" : "#e2e8f0",
        },
        animatedStyle,
        style,
      ]}
      className={cn(className)}
      {...props}
    />
  );
}

/**
 * Text skeleton - for single line text
 */
export function SkeletonText({
  width = "100%",
  height = 16,
  className,
  ...props
}: SkeletonProps) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={4}
      className={className}
      {...props}
    />
  );
}

/**
 * Circle skeleton - for avatars
 */
export function SkeletonCircle({
  size = 48,
  className,
  ...props
}: Omit<SkeletonProps, "width" | "height" | "borderRadius"> & { size?: number }) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      className={className}
      {...props}
    />
  );
}

/**
 * Card skeleton - common pattern for list items
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <View
      className={cn(
        "rounded-xl bg-surface-light p-4 dark:bg-surface-dark",
        className
      )}
    >
      <View className="flex-row items-center gap-3">
        <SkeletonCircle size={48} />
        <View className="flex-1 gap-2">
          <SkeletonText width="60%" height={14} />
          <SkeletonText width="40%" height={12} />
        </View>
      </View>
    </View>
  );
}

/**
 * Profile skeleton - for profile screens
 */
export function SkeletonProfile({ className }: { className?: string }) {
  return (
    <View className={cn("items-center gap-4", className)}>
      <SkeletonCircle size={96} />
      <SkeletonText width={150} height={24} />
      <SkeletonText width={200} height={14} />
    </View>
  );
}

/**
 * List skeleton - for list views
 */
export function SkeletonList({
  count = 5,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <View className={cn("gap-3", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

/**
 * Form skeleton - for form screens
 */
export function SkeletonForm({ className }: { className?: string }) {
  return (
    <View className={cn("gap-4", className)}>
      <View className="gap-2">
        <SkeletonText width={60} height={12} />
        <Skeleton height={48} />
      </View>
      <View className="gap-2">
        <SkeletonText width={80} height={12} />
        <Skeleton height={48} />
      </View>
      <View className="gap-2">
        <SkeletonText width={70} height={12} />
        <Skeleton height={48} />
      </View>
      <Skeleton height={48} className="mt-4" />
    </View>
  );
}
