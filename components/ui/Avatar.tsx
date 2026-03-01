import { View, Text } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/utils/cn";
import { imageA11y } from "@/utils/accessibility";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const avatarPlaceholder = require("@/assets/images/icon.png");

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface AvatarProps {
  /**
   * Image source URL
   */
  source?: string | null;

  /**
   * User's name (used for initials fallback)
   */
  name?: string;

  /**
   * Size variant
   */
  size?: AvatarSize;

  /**
   * Custom size in pixels (overrides size variant)
   */
  customSize?: number;

  /**
   * Whether to show online indicator
   */
  showOnlineIndicator?: boolean;

  /**
   * Whether the user is online
   */
  isOnline?: boolean;

  /**
   * Additional class name
   */
  className?: string;

  /**
   * Border color class
   */
  borderClassName?: string;
}

const sizeConfig: Record<
  AvatarSize,
  { container: number; text: string; icon: number; indicator: number }
> = {
  xs: { container: 24, text: "text-xs", icon: 12, indicator: 6 },
  sm: { container: 32, text: "text-sm", icon: 16, indicator: 8 },
  md: { container: 40, text: "text-base", icon: 20, indicator: 10 },
  lg: { container: 48, text: "text-lg", icon: 24, indicator: 12 },
  xl: { container: 64, text: "text-xl", icon: 32, indicator: 14 },
  "2xl": { container: 80, text: "text-2xl", icon: 40, indicator: 16 },
};

/**
 * Get initials from a name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Get a consistent color based on the name
 */
function getAvatarColor(name: string): string {
  const colors = [
    "#ef4444", // red
    "#f97316", // orange
    "#f59e0b", // amber
    "#84cc16", // lime
    "#10b981", // emerald
    "#14b8a6", // teal
    "#06b6d4", // cyan
    "#0ea5e9", // sky
    "#3b82f6", // blue
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#a855f7", // purple
    "#d946ef", // fuchsia
    "#ec4899", // pink
    "#f43f5e", // rose
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  source,
  name,
  size = "md",
  customSize,
  showOnlineIndicator = false,
  isOnline = false,
  className,
  borderClassName,
}: AvatarProps) {
  const { isDark } = useTheme();
  const config = sizeConfig[size];
  const containerSize = customSize || config.container;

  const initials = name ? getInitials(name) : "";
  const backgroundColor = name
    ? getAvatarColor(name)
    : isDark
      ? "#475569"
      : "#cbd5e1";

  const renderContent = () => {
    // Image avatar
    if (source) {
      return (
        <Image
          source={{ uri: source }}
          style={{
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
          }}
          contentFit="cover"
          transition={200}
          placeholder={avatarPlaceholder}
        />
      );
    }

    // Initials avatar
    if (name) {
      return (
        <View
          style={{
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            backgroundColor,
          }}
          className="items-center justify-center"
        >
          <Text
            className={cn(config.text, "font-semibold text-white")}
            style={{
              fontSize: customSize ? customSize * 0.4 : undefined,
            }}
          >
            {initials}
          </Text>
        </View>
      );
    }

    // Default placeholder
    return (
      <View
        style={{
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
        }}
        className={cn(
          "items-center justify-center",
          isDark ? "bg-gray-700" : "bg-gray-200"
        )}
      >
        <Ionicons
          name="person"
          size={customSize ? customSize * 0.5 : config.icon}
          color={isDark ? "#94a3b8" : "#64748b"}
        />
      </View>
    );
  };

  const a11yDescription = name
    ? `${name}'s avatar`
    : source
      ? "User avatar"
      : "Default avatar placeholder";

  return (
    <View
      className={cn("relative", className)}
      style={{ width: containerSize, height: containerSize }}
      {...imageA11y(a11yDescription)}
    >
      <View
        className={cn("overflow-hidden rounded-full", borderClassName)}
        style={{
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
        }}
      >
        {renderContent()}
      </View>

      {/* Online indicator */}
      {showOnlineIndicator && (
        <View
          style={{
            width: config.indicator,
            height: config.indicator,
            borderRadius: config.indicator / 2,
            borderWidth: 2,
            position: "absolute",
            bottom: 0,
            right: 0,
          }}
          className={cn(
            isOnline ? "bg-green-500" : "bg-gray-400",
            isDark ? "border-background-dark" : "border-white"
          )}
        />
      )}
    </View>
  );
}

/**
 * Avatar Group component for displaying multiple avatars
 */
interface AvatarGroupProps {
  /**
   * Array of avatar data
   */
  avatars: {
    source?: string | null;
    name?: string;
  }[];

  /**
   * Maximum number of avatars to display
   */
  max?: number;

  /**
   * Size variant
   */
  size?: AvatarSize;

  /**
   * Additional class name
   */
  className?: string;
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = "md",
  className,
}: AvatarGroupProps) {
  const { isDark } = useTheme();
  const config = sizeConfig[size];
  const displayAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <View className={cn("flex-row items-center", className)}>
      {displayAvatars.map((avatar, index) => (
        <View
          key={index}
          style={{
            marginLeft: index > 0 ? -config.container / 3 : 0,
            zIndex: displayAvatars.length - index,
          }}
        >
          <Avatar
            source={avatar.source}
            name={avatar.name}
            size={size}
            borderClassName={cn(
              "border-2",
              isDark ? "border-background-dark" : "border-white"
            )}
          />
        </View>
      ))}

      {remainingCount > 0 && (
        <View
          style={{
            marginLeft: -config.container / 3,
            width: config.container,
            height: config.container,
            borderRadius: config.container / 2,
          }}
          className={cn(
            "items-center justify-center border-2",
            isDark
              ? "bg-gray-700 border-background-dark"
              : "bg-gray-200 border-white"
          )}
        >
          <Text
            className={cn(
              config.text,
              "font-medium",
              isDark ? "text-text-dark" : "text-text-light"
            )}
          >
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
}
