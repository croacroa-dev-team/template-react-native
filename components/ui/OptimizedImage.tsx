import { useState, useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Image, ImageProps, ImageContentFit } from "expo-image";
import Animated, {
  useAnimatedStyle,
  withTiming,
  withRepeat,
  cancelAnimation,
  interpolate,
  useSharedValue,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/utils/cn";

const AnimatedImage = Animated.createAnimatedComponent(Image);

type ImagePriority = "low" | "normal" | "high";

interface OptimizedImageProps {
  /**
   * Image source URL
   */
  source: string | number;

  /**
   * Alt text for accessibility
   */
  alt?: string;

  /**
   * Image width
   */
  width?: number;

  /**
   * Image height
   */
  height?: number;

  /**
   * Aspect ratio (e.g., 16/9, 1, 4/3)
   */
  aspectRatio?: number;

  /**
   * How to fit the image in the container
   */
  contentFit?: ImageContentFit;

  /**
   * Blur hash or thumbhash for placeholder
   */
  placeholder?: string | number;

  /**
   * Loading priority
   */
  priority?: ImagePriority;

  /**
   * Whether to enable caching
   */
  cachePolicy?: "none" | "disk" | "memory" | "memory-disk";

  /**
   * Transition duration in ms
   */
  transitionDuration?: number;

  /**
   * Additional class name for container
   */
  className?: string;

  /**
   * Whether to show loading skeleton
   */
  showSkeleton?: boolean;

  /**
   * Border radius
   */
  borderRadius?: number;

  /**
   * Called when image loads successfully
   */
  onLoad?: () => void;

  /**
   * Called when image fails to load
   */
  onError?: (error: Error) => void;

  /**
   * Style override
   */
  style?: ImageProps["style"];
}

export function OptimizedImage({
  source,
  alt,
  width,
  height,
  aspectRatio,
  contentFit = "cover",
  placeholder,
  priority = "normal",
  cachePolicy = "memory-disk",
  transitionDuration = 300,
  className,
  showSkeleton = true,
  borderRadius = 0,
  onLoad,
  onError,
  style,
}: OptimizedImageProps) {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const opacity = useSharedValue(0);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    opacity.value = withTiming(1, { duration: transitionDuration });
    onLoad?.();
  }, [opacity, transitionDuration, onLoad]);

  const handleError = useCallback(
    (error: { error: string }) => {
      setIsLoading(false);
      setHasError(true);
      onError?.(new Error(error.error));
    },
    [onError]
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(opacity.value, [0, 1], [0, 1]),
    };
  });

  // Determine the source
  const imageSource = typeof source === "string" ? { uri: source } : source;

  // Map priority to expo-image priority
  const imagePriority =
    priority === "high" ? "high" : priority === "low" ? "low" : "normal";

  return (
    <View
      className={cn("overflow-hidden", className)}
      style={[
        {
          width,
          height,
          aspectRatio,
          borderRadius,
          backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
        },
      ]}
    >
      {/* Skeleton loader */}
      {showSkeleton && isLoading && !hasError && (
        <SkeletonLoader borderRadius={borderRadius} />
      )}

      {/* Error state */}
      {hasError && (
        <View
          style={[styles.errorContainer, { borderRadius }]}
          className={isDark ? "bg-gray-800" : "bg-gray-100"}
        >
          <View className="items-center justify-center">
            <View
              className={cn(
                "w-12 h-12 rounded-full items-center justify-center mb-2",
                isDark ? "bg-gray-700" : "bg-gray-200"
              )}
            >
              <ErrorIcon isDark={isDark} />
            </View>
          </View>
        </View>
      )}

      {/* Actual image */}
      {!hasError && (
        <AnimatedImage
          source={imageSource}
          contentFit={contentFit}
          placeholder={placeholder}
          placeholderContentFit="cover"
          transition={transitionDuration}
          priority={imagePriority}
          cachePolicy={cachePolicy}
          onLoad={handleLoad}
          onError={handleError}
          accessibilityLabel={alt}
          style={[styles.image, { borderRadius }, animatedStyle, style]}
        />
      )}
    </View>
  );
}

/**
 * Skeleton loader with shimmer effect
 */
function SkeletonLoader({ borderRadius }: { borderRadius: number }) {
  const { isDark } = useTheme();
  const shimmer = useSharedValue(0);

  // Start shimmer animation
  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1500 }), -1, true);
    return () => {
      cancelAnimation(shimmer);
    };
  }, [shimmer]);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
    };
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { borderRadius },
        shimmerStyle,
        { backgroundColor: isDark ? "#334155" : "#e2e8f0" },
      ]}
    />
  );
}

/**
 * Error icon component
 */
function ErrorIcon({ isDark }: { isDark: boolean }) {
  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: isDark ? "#475569" : "#cbd5e1",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 12,
          height: 2,
          backgroundColor: isDark ? "#94a3b8" : "#64748b",
          transform: [{ rotate: "45deg" }],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },
  skeleton: {
    ...StyleSheet.absoluteFillObject,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  backgroundContainer: {
    flex: 1,
  },
  backgroundContent: {
    flex: 1,
    zIndex: 1,
  },
});

/**
 * Background Image component
 */
interface BackgroundImageProps extends OptimizedImageProps {
  children?: React.ReactNode;
  overlayColor?: string;
  overlayOpacity?: number;
}

export function BackgroundImage({
  children,
  overlayColor = "#000000",
  overlayOpacity = 0.4,
  ...props
}: BackgroundImageProps) {
  return (
    <View style={styles.backgroundContainer}>
      <OptimizedImage {...props} style={StyleSheet.absoluteFill} />
      {overlayOpacity > 0 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: overlayColor,
              opacity: overlayOpacity,
            },
          ]}
        />
      )}
      <View style={styles.backgroundContent}>{children}</View>
    </View>
  );
}

/**
 * Image with progressive loading (blur to sharp)
 */
interface ProgressiveImageProps extends OptimizedImageProps {
  /**
   * Low-quality placeholder image
   */
  thumbnail?: string;
}

export function ProgressiveImage({
  thumbnail,
  source,
  ...props
}: ProgressiveImageProps) {
  const [isFullLoaded, setIsFullLoaded] = useState(false);

  return (
    <View style={{ position: "relative", overflow: "hidden" }}>
      {/* Thumbnail (blurred) */}
      {thumbnail && !isFullLoaded && (
        <Image
          source={{ uri: thumbnail }}
          style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
          contentFit="cover"
          blurRadius={10}
        />
      )}

      {/* Full resolution image */}
      <OptimizedImage
        {...props}
        source={source}
        onLoad={() => {
          setIsFullLoaded(true);
          props.onLoad?.();
        }}
        showSkeleton={!thumbnail}
      />
    </View>
  );
}
