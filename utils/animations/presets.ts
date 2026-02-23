import { Easing } from "react-native-reanimated";
import type {
  WithTimingConfig,
  WithSpringConfig,
} from "react-native-reanimated";

// ============================================================================
// Types
// ============================================================================

/**
 * Available entry animation types
 */
export type EntryAnimation =
  | "fadeIn"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "scale"
  | "none";

/**
 * Initial values for an entry animation
 */
export interface EntryConfig {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
}

// ============================================================================
// Timing Presets
// ============================================================================

/**
 * Timing-based animation presets
 *
 * @example
 * ```ts
 * withTiming(targetValue, TIMING.fast);
 * withTiming(targetValue, TIMING.bounce);
 * ```
 */
export const TIMING = {
  /** Quick interactions - 200ms */
  fast: {
    duration: 200,
    easing: Easing.out(Easing.quad),
  },
  /** Standard transitions - 300ms */
  normal: {
    duration: 300,
    easing: Easing.out(Easing.quad),
  },
  /** Deliberate, emphasis animations - 500ms */
  slow: {
    duration: 500,
    easing: Easing.out(Easing.quad),
  },
  /** Playful overshoot effect - 400ms */
  bounce: {
    duration: 400,
    easing: Easing.out(Easing.back(1.5)),
  },
} satisfies Record<string, WithTimingConfig>;

// ============================================================================
// Spring Presets
// ============================================================================

/**
 * Spring-based animation presets
 *
 * @example
 * ```ts
 * withSpring(targetValue, SPRING.gentle);
 * withSpring(targetValue, SPRING.bouncy);
 * ```
 */
export const SPRING = {
  /** Soft, slow spring - great for large movements */
  gentle: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },
  /** Playful spring with visible overshoot */
  bouncy: {
    damping: 8,
    stiffness: 150,
    mass: 0.8,
  },
  /** Rigid, fast spring - minimal overshoot */
  stiff: {
    damping: 20,
    stiffness: 400,
    mass: 0.5,
  },
  /** Quick response with slight bounce */
  snappy: {
    damping: 15,
    stiffness: 300,
    mass: 0.6,
  },
} satisfies Record<string, WithSpringConfig>;

// ============================================================================
// Entry Configs
// ============================================================================

/**
 * Initial transform values for each entry animation type.
 * The animation interpolates from these values (progress=0) to the
 * identity transform (progress=1): opacity 1, translate 0, scale 1.
 */
export const ENTRY_CONFIGS: Record<EntryAnimation, EntryConfig> = {
  fadeIn: {
    opacity: 0,
    translateX: 0,
    translateY: 0,
    scale: 1,
  },
  slideUp: {
    opacity: 0,
    translateX: 0,
    translateY: 30,
    scale: 1,
  },
  slideDown: {
    opacity: 0,
    translateX: 0,
    translateY: -30,
    scale: 1,
  },
  slideLeft: {
    opacity: 0,
    translateX: 30,
    translateY: 0,
    scale: 1,
  },
  slideRight: {
    opacity: 0,
    translateX: -30,
    translateY: 0,
    scale: 1,
  },
  scale: {
    opacity: 0,
    translateX: 0,
    translateY: 0,
    scale: 0.85,
  },
  none: {
    opacity: 1,
    translateX: 0,
    translateY: 0,
    scale: 1,
  },
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Calculate stagger delay for a list item at the given index.
 *
 * @param index - The item index in the list
 * @param baseDelay - Delay between each item in ms (default 50)
 * @returns Total delay in ms for this item
 *
 * @example
 * ```ts
 * // Stagger 5 items, each 80ms apart
 * items.map((item, i) => staggerDelay(i, 80)); // [0, 80, 160, 240, 320]
 * ```
 */
export function staggerDelay(index: number, baseDelay: number = 50): number {
  return index * baseDelay;
}
