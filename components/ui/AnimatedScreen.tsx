import { ReactNode } from "react";
import { ViewProps, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import type { WithTimingConfig } from "react-native-reanimated";

import { useAnimatedEntry } from "@/hooks/useAnimatedEntry";
import type { EntryAnimation } from "@/utils/animations/presets";

// ============================================================================
// Types
// ============================================================================

interface AnimatedScreenProps extends Omit<ViewProps, "style"> {
  /**
   * Entry animation to play when the screen mounts
   * @default 'fadeIn'
   */
  animation?: EntryAnimation;

  /**
   * Delay before the animation starts (ms)
   * @default 0
   */
  delay?: number;

  /**
   * Timing configuration override
   */
  timing?: WithTimingConfig;

  /**
   * Screen content
   */
  children: ReactNode;

  /**
   * Additional style applied to the wrapper
   */
  style?: ViewProps["style"];
}

// ============================================================================
// Component
// ============================================================================

/**
 * Screen wrapper that plays an entry animation on mount.
 *
 * Wraps children in an `Animated.View` with `flex: 1` so it fills the
 * available space, then applies the chosen entry animation via
 * `useAnimatedEntry`.
 *
 * @example
 * ```tsx
 * export default function HomeScreen() {
 *   return (
 *     <AnimatedScreen animation="slideUp" delay={100}>
 *       <Text>Welcome home!</Text>
 *     </AnimatedScreen>
 *   );
 * }
 * ```
 */
export function AnimatedScreen({
  animation = "fadeIn",
  delay = 0,
  timing,
  children,
  style,
  ...props
}: AnimatedScreenProps) {
  const { animatedStyle } = useAnimatedEntry({
    animation,
    delay,
    timing,
  });

  return (
    <Animated.View style={[styles.container, animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
