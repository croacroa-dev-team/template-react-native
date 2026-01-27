import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  ViewToken,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { storage } from "@/services/storage";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import { STORAGE_KEYS } from "@/constants/config";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  backgroundColor?: string;
}

interface OnboardingScreenProps {
  /**
   * Slides to display
   */
  slides?: OnboardingSlide[];

  /**
   * Called when onboarding is completed
   */
  onComplete?: () => void;

  /**
   * Whether to show skip button
   */
  showSkip?: boolean;

  /**
   * Text for the final button
   */
  finalButtonText?: string;
}

const DEFAULT_SLIDES: OnboardingSlide[] = [
  {
    id: "1",
    title: "Welcome to the App",
    description:
      "Discover a new way to manage your tasks and boost your productivity.",
    icon: "rocket-outline",
    iconColor: "#10b981",
  },
  {
    id: "2",
    title: "Stay Organized",
    description:
      "Keep all your important information in one place. Access it anywhere, anytime.",
    icon: "folder-outline",
    iconColor: "#3b82f6",
  },
  {
    id: "3",
    title: "Secure & Private",
    description:
      "Your data is encrypted and protected. Only you have access to your information.",
    icon: "shield-checkmark-outline",
    iconColor: "#8b5cf6",
  },
  {
    id: "4",
    title: "Ready to Start?",
    description:
      "Create your account and start your journey towards better productivity.",
    icon: "checkmark-circle-outline",
    iconColor: "#10b981",
  },
];

export function OnboardingScreen({
  slides = DEFAULT_SLIDES,
  onComplete,
  showSkip = true,
  finalButtonText = "Get Started",
}: OnboardingScreenProps) {
  const { isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const isLastSlide = currentIndex === slides.length - 1;

  const handleComplete = useCallback(async () => {
    await storage.set(STORAGE_KEYS.ONBOARDING_COMPLETED, true);
    onComplete?.();
    router.replace("/(public)/login");
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      handleComplete();
    } else {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  }, [currentIndex, isLastSlide, handleComplete]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollX.value = event.nativeEvent.contentOffset.x;
    },
    [scrollX]
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const renderSlide = ({
    item,
    index,
  }: {
    item: OnboardingSlide;
    index: number;
  }) => (
    <SlideItem item={item} index={index} scrollX={scrollX} isDark={isDark} />
  );

  return (
    <View
      className={cn(
        "flex-1",
        isDark ? "bg-background-dark" : "bg-background-light"
      )}
    >
      {/* Skip button */}
      {showSkip && !isLastSlide && (
        <View className="absolute top-16 right-6 z-10">
          <Button
            variant="ghost"
            size="sm"
            onPress={handleSkip}
            accessibilityLabel="Skip onboarding"
            accessibilityRole="button"
          >
            Skip
          </Button>
        </View>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Bottom section */}
      <View className="px-6 pb-12">
        {/* Pagination dots */}
        <View className="flex-row justify-center items-center mb-8">
          {slides.map((_, index) => (
            <PaginationDot
              key={index}
              index={index}
              scrollX={scrollX}
              isDark={isDark}
            />
          ))}
        </View>

        {/* Action button */}
        <Button
          variant="primary"
          size="lg"
          onPress={handleNext}
          className="w-full"
          accessibilityLabel={isLastSlide ? finalButtonText : "Next slide"}
          accessibilityRole="button"
        >
          {isLastSlide ? finalButtonText : "Next"}
        </Button>
      </View>
    </View>
  );
}

/**
 * Individual slide component
 */
interface SlideItemProps {
  item: OnboardingSlide;
  index: number;
  scrollX: Animated.SharedValue<number>;
  isDark: boolean;
}

function SlideItem({ item, index, scrollX, isDark }: SlideItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [50, 0, 50],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  return (
    <View
      style={{ width: SCREEN_WIDTH }}
      className="flex-1 items-center justify-center px-8"
      accessibilityRole="text"
      accessibilityLabel={`${item.title}. ${item.description}`}
    >
      <Animated.View style={animatedStyle} className="items-center">
        {/* Icon */}
        <View
          className={cn(
            "w-32 h-32 rounded-full items-center justify-center mb-8",
            isDark ? "bg-surface-dark" : "bg-gray-100"
          )}
        >
          <Ionicons
            name={item.icon}
            size={64}
            color={item.iconColor || "#10b981"}
          />
        </View>

        {/* Title */}
        <Text
          className={cn(
            "text-2xl font-bold text-center mb-4",
            isDark ? "text-text-dark" : "text-text-light"
          )}
        >
          {item.title}
        </Text>

        {/* Description */}
        <Text
          className={cn(
            "text-base text-center leading-6",
            isDark ? "text-muted-dark" : "text-muted-light"
          )}
        >
          {item.description}
        </Text>
      </Animated.View>
    </View>
  );
}

/**
 * Pagination dot component
 */
interface PaginationDotProps {
  index: number;
  scrollX: Animated.SharedValue<number>;
  isDark: boolean;
}

function PaginationDot({ index, scrollX, isDark }: PaginationDotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const width = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolation.CLAMP
    );

    return {
      width: withSpring(width, { damping: 15, stiffness: 200 }),
      opacity,
    };
  });

  return (
    <Animated.View
      style={animatedStyle}
      className={cn(
        "h-2 rounded-full mx-1",
        isDark ? "bg-primary-400" : "bg-primary-500"
      )}
    />
  );
}

export default OnboardingScreen;
