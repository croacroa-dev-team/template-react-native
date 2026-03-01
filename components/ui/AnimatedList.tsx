import { ReactNode } from "react";
import { ViewProps } from "react-native";
import Animated from "react-native-reanimated";
import type { WithTimingConfig } from "react-native-reanimated";

import { useStaggeredEntry } from "@/hooks/useAnimatedEntry";
import type { EntryAnimation } from "@/utils/animations/presets";

// ============================================================================
// Types
// ============================================================================

interface AnimatedListItemProps extends Omit<ViewProps, "style"> {
  /**
   * Position of this item in the list (0-based).
   * Used to calculate the stagger delay.
   */
  index: number;

  /**
   * Entry animation type
   * @default 'slideUp'
   */
  animation?: EntryAnimation;

  /**
   * Delay between each item's animation start (ms)
   * @default 50
   */
  staggerDelay?: number;

  /**
   * Timing configuration override
   */
  timing?: WithTimingConfig;

  /**
   * Item content
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
 * List item wrapper that animates in with a stagger effect.
 *
 * Each item plays the same entry animation but starts after a delay
 * proportional to its `index`, creating a cascading reveal.
 *
 * @example
 * ```tsx
 * function UserList({ users }: { users: User[] }) {
 *   return (
 *     <View>
 *       {users.map((user, index) => (
 *         <AnimatedListItem
 *           key={user.id}
 *           index={index}
 *           animation="slideUp"
 *           staggerDelay={60}
 *         >
 *           <UserCard user={user} />
 *         </AnimatedListItem>
 *       ))}
 *     </View>
 *   );
 * }
 * ```
 */
export function AnimatedListItem({
  index,
  animation = "slideUp",
  staggerDelay = 50,
  timing,
  children,
  style,
  ...props
}: AnimatedListItemProps) {
  const { animatedStyle } = useStaggeredEntry(index, {
    animation,
    staggerDelay,
    timing,
  });

  return (
    <Animated.View
      style={[animatedStyle, style]}
      accessible
      accessibilityRole="summary"
      {...props}
    >
      {children}
    </Animated.View>
  );
}
