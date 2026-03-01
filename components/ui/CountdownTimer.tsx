/**
 * @fileoverview Visual countdown timer component with animated progress
 * @module components/ui/CountdownTimer
 */

import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { cn } from "@/utils/cn";
import { useCountdown, UseCountdownOptions } from "@/hooks/useCountdown";

type TimerSize = "sm" | "md" | "lg";

interface CountdownTimerProps extends UseCountdownOptions {
  /** Size variant for the timer display */
  size?: TimerSize;
  /** Show the progress bar underneath the number */
  showProgress?: boolean;
  /** Custom className for the container */
  className?: string;
  /** Color of the progress bar. Defaults to primary blue. */
  progressColor?: string;
  /** Color when time is running low (last 25%). Defaults to red. */
  urgentColor?: string;
}

const sizeConfig: Record<TimerSize, { text: string; barHeight: number }> = {
  sm: { text: "text-2xl", barHeight: 4 },
  md: { text: "text-4xl", barHeight: 6 },
  lg: { text: "text-6xl", barHeight: 8 },
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
  return `${secs}`;
}

/**
 * Visual countdown timer with animated text and optional progress bar.
 * Uses Reanimated for smooth progress bar animation.
 */
export function CountdownTimer({
  size = "md",
  showProgress = true,
  className,
  progressColor = "#3b82f6",
  urgentColor = "#ef4444",
  ...countdownOptions
}: CountdownTimerProps) {
  const { remaining, isFinished, progress } = useCountdown(countdownOptions);

  const config = sizeConfig[size];
  const isUrgent = progress <= 0.25 && !isFinished;
  const activeColor = isUrgent ? urgentColor : progressColor;

  // Animate progress bar width
  const progressWidth = useSharedValue(progress);

  useEffect(() => {
    progressWidth.value = withTiming(progress, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
  }, [progress, progressWidth]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  return (
    <View className={cn("items-center", className)}>
      <Text
        className={cn(
          config.text,
          "font-bold tabular-nums",
          isFinished
            ? "text-gray-400 dark:text-gray-600"
            : isUrgent
              ? "text-red-500"
              : "text-text-light dark:text-text-dark"
        )}
        accessibilityLabel={`${remaining} seconds remaining`}
        accessibilityRole="timer"
      >
        {formatTime(remaining)}
      </Text>

      {showProgress && (
        <View
          className="w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mt-2"
          style={{ height: config.barHeight }}
        >
          <Animated.View
            className="h-full rounded-full"
            style={[progressStyle, { backgroundColor: activeColor }]}
          />
        </View>
      )}

      {isFinished && (
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Time's up!
        </Text>
      )}
    </View>
  );
}
