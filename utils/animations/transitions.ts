import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

// ============================================================================
// Screen Transition Presets
// ============================================================================

/**
 * Pre-configured screen transition options for Expo Router / React Navigation.
 *
 * Apply to individual `Stack.Screen` components or to `screenOptions` on a
 * `Stack` navigator.
 *
 * @example
 * ```tsx
 * // Single screen
 * <Stack.Screen name="details" options={screenTransitions.slide} />
 *
 * // All screens in a navigator
 * <Stack screenOptions={screenTransitions.fade}>
 *   ...
 * </Stack>
 * ```
 */
export const screenTransitions = {
  /** Standard platform slide (iOS: slide from right, Android: slide from bottom) */
  slide: {
    animation: "slide_from_right",
  } satisfies NativeStackNavigationOptions,

  /** Cross-fade between screens */
  fade: {
    animation: "fade",
  } satisfies NativeStackNavigationOptions,

  /** Modal presentation (slides up from bottom with card styling) */
  modal: {
    animation: "slide_from_bottom",
    presentation: "modal",
  } satisfies NativeStackNavigationOptions,

  /** Full-screen modal (no card inset) */
  fullScreenModal: {
    animation: "slide_from_bottom",
    presentation: "fullScreenModal",
  } satisfies NativeStackNavigationOptions,

  /** Transparent modal (overlay on top of current screen) */
  transparentModal: {
    animation: "fade",
    presentation: "transparentModal",
  } satisfies NativeStackNavigationOptions,

  /** No animation at all */
  none: {
    animation: "none",
  } satisfies NativeStackNavigationOptions,
} as const;

/**
 * Type of available screen transition keys
 */
export type ScreenTransitionName = keyof typeof screenTransitions;
