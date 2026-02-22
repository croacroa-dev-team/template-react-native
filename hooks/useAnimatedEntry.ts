import { useCallback, useEffect } from "react";
import { ViewStyle } from "react-native";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
} from "react-native-reanimated";
import type { WithTimingConfig, SharedValue } from "react-native-reanimated";

import {
  TIMING,
  ENTRY_CONFIGS,
  staggerDelay,
} from "@/utils/animations/presets";
import type { EntryAnimation } from "@/utils/animations/presets";

// ============================================================================
// Types
// ============================================================================

export interface UseAnimatedEntryOptions {
  /**
   * Which entry animation to use
   * @default 'fadeIn'
   */
  animation?: EntryAnimation;

  /**
   * Delay before the animation starts (ms)
   * @default 0
   */
  delay?: number;

  /**
   * Timing configuration for the animation
   * @default TIMING.normal
   */
  timing?: WithTimingConfig;

  /**
   * Whether the animation plays automatically on mount
   * @default true
   */
  autoPlay?: boolean;
}

export interface UseAnimatedEntryReturn {
  /** Animated style to spread onto an Animated.View */
  animatedStyle: ViewStyle;

  /** Manually trigger the entry animation */
  play: () => void;

  /** Reset animation back to start (progress = 0) */
  reset: () => void;

  /** Shared value tracking animation progress (0 = start, 1 = done) */
  progress: SharedValue<number>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for declarative entry animations.
 *
 * Returns an animated style that interpolates opacity, translateX, translateY,
 * and scale from the chosen preset's initial values to their identity values
 * as `progress` goes from 0 to 1.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { animatedStyle } = useAnimatedEntry({
 *     animation: 'slideUp',
 *     delay: 200,
 *   });
 *
 *   return (
 *     <Animated.View style={animatedStyle}>
 *       <Text>Hello</Text>
 *     </Animated.View>
 *   );
 * }
 * ```
 */
export function useAnimatedEntry(
  options: UseAnimatedEntryOptions = {}
): UseAnimatedEntryReturn {
  const {
    animation = "fadeIn",
    delay = 0,
    timing = TIMING.normal,
    autoPlay = true,
  } = options;

  const progress = useSharedValue(0);
  const config = ENTRY_CONFIGS[animation];

  const play = useCallback(() => {
    progress.value = 0;
    if (delay > 0) {
      progress.value = withDelay(delay, withTiming(1, timing));
    } else {
      progress.value = withTiming(1, timing);
    }
  }, [delay, timing, progress]);

  const reset = useCallback(() => {
    progress.value = 0;
  }, [progress]);

  // Auto-play on mount
  useEffect(() => {
    if (autoPlay) {
      play();
    }
  }, [autoPlay, play]);

  const animatedStyle = useAnimatedStyle((): ViewStyle => {
    return {
      opacity: interpolate(progress.value, [0, 1], [config.opacity, 1]),
      transform: [
        {
          translateX: interpolate(
            progress.value,
            [0, 1],
            [config.translateX, 0]
          ),
        },
        {
          translateY: interpolate(
            progress.value,
            [0, 1],
            [config.translateY, 0]
          ),
        },
        {
          scale: interpolate(progress.value, [0, 1], [config.scale, 1]),
        },
      ],
    };
  });

  return { animatedStyle, play, reset, progress };
}

// ============================================================================
// Staggered Entry
// ============================================================================

export interface UseStaggeredEntryOptions
  extends Omit<UseAnimatedEntryOptions, "delay"> {
  /**
   * Base delay between each staggered item (ms)
   * @default 50
   */
  staggerDelay?: number;
}

/**
 * Convenience wrapper around `useAnimatedEntry` that adds an index-based
 * stagger delay. Use this for list items that should animate in sequentially.
 *
 * @param index - The item's position in the list (0-based)
 * @param options - Same as useAnimatedEntry options, plus `staggerDelay`
 *
 * @example
 * ```tsx
 * function ListItem({ index }: { index: number }) {
 *   const { animatedStyle } = useStaggeredEntry(index, {
 *     animation: 'slideUp',
 *     staggerDelay: 80,
 *   });
 *
 *   return (
 *     <Animated.View style={animatedStyle}>
 *       <Text>Item {index}</Text>
 *     </Animated.View>
 *   );
 * }
 * ```
 */
export function useStaggeredEntry(
  index: number,
  options: UseStaggeredEntryOptions = {}
): UseAnimatedEntryReturn {
  const { staggerDelay: baseDelay = 50, ...rest } = options;

  return useAnimatedEntry({
    ...rest,
    delay: staggerDelay(index, baseDelay),
  });
}
