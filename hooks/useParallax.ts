import {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

// ============================================================================
// Types
// ============================================================================

export interface UseParallaxOptions {
  /**
   * Parallax speed factor. 0 = no movement, 1 = moves with scroll.
   * Values between 0 and 1 create a lagging effect; values > 1 amplify.
   * @default 0.5
   */
  speed?: number;

  /**
   * Height of the parallax header area in pixels.
   * Used for interpolation ranges.
   * @default 250
   */
  headerHeight?: number;
}

export interface UseParallaxReturn {
  /** Shared value tracking the current vertical scroll offset */
  scrollY: SharedValue<number>;

  /** Animated scroll handler — attach to an Animated.ScrollView's onScroll */
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;

  /** Style with translateY for a parallax background layer */
  parallaxStyle: ReturnType<typeof useAnimatedStyle>;

  /**
   * Style for a header element:
   * - Fades out as the user scrolls up
   * - Scales up on pull-down (overscroll)
   */
  headerStyle: ReturnType<typeof useAnimatedStyle>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for parallax scroll effects.
 *
 * Returns scroll tracking state plus two animated styles:
 * - `parallaxStyle` for a background layer that moves slower than content
 * - `headerStyle` for a header that fades out on scroll and scales on pull-down
 *
 * @example
 * ```tsx
 * function ParallaxScreen() {
 *   const { scrollHandler, parallaxStyle, headerStyle } = useParallax({
 *     speed: 0.5,
 *     headerHeight: 300,
 *   });
 *
 *   return (
 *     <View style={{ flex: 1 }}>
 *       <Animated.View style={[styles.background, parallaxStyle]}>
 *         <Image source={backgroundImage} style={StyleSheet.absoluteFill} />
 *       </Animated.View>
 *
 *       <Animated.View style={[styles.header, headerStyle]}>
 *         <Text>Header Content</Text>
 *       </Animated.View>
 *
 *       <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
 *         {content}
 *       </Animated.ScrollView>
 *     </View>
 *   );
 * }
 * ```
 */
export function useParallax(
  options: UseParallaxOptions = {}
): UseParallaxReturn {
  const { speed = 0.5, headerHeight = 250 } = options;

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Background layer: translates at a fraction of scroll speed
  const parallaxStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, headerHeight],
      [0, headerHeight * speed],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }],
    };
  });

  // Header: fades out on scroll up, scales up on pull-down
  const headerStyle = useAnimatedStyle(() => {
    // Fade out as user scrolls past the header
    const opacity = interpolate(
      scrollY.value,
      [0, headerHeight * 0.6],
      [1, 0],
      Extrapolation.CLAMP
    );

    // Scale up on overscroll (pull-down)
    const scale = interpolate(
      scrollY.value,
      [-headerHeight, 0],
      [1.5, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return {
    scrollY,
    scrollHandler,
    parallaxStyle,
    headerStyle,
  };
}
