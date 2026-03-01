import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/utils/cn";

type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info";

type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  /**
   * Badge content
   */
  children: React.ReactNode;

  /**
   * Visual variant
   */
  variant?: BadgeVariant;

  /**
   * Size variant
   */
  size?: BadgeSize;

  /**
   * Icon name (Ionicons)
   */
  icon?: keyof typeof Ionicons.glyphMap;

  /**
   * Whether the badge is outlined
   */
  outlined?: boolean;

  /**
   * Whether to make it a pill shape
   */
  pill?: boolean;

  /**
   * Additional class name
   */
  className?: string;
}

const sizeStyles: Record<
  BadgeSize,
  { container: string; text: string; icon: number }
> = {
  sm: { container: "px-2 py-0.5", text: "text-xs", icon: 12 },
  md: { container: "px-2.5 py-1", text: "text-sm", icon: 14 },
  lg: { container: "px-3 py-1.5", text: "text-base", icon: 16 },
};

const variantStyles: Record<
  BadgeVariant,
  {
    bg: string;
    bgDark: string;
    text: string;
    textDark: string;
    border: string;
    borderDark: string;
  }
> = {
  default: {
    bg: "bg-gray-100",
    bgDark: "bg-gray-800",
    text: "text-gray-700",
    textDark: "text-gray-300",
    border: "border-gray-300",
    borderDark: "border-gray-600",
  },
  primary: {
    bg: "bg-primary-100",
    bgDark: "bg-primary-900/30",
    text: "text-primary-700",
    textDark: "text-primary-400",
    border: "border-primary-300",
    borderDark: "border-primary-700",
  },
  secondary: {
    bg: "bg-slate-100",
    bgDark: "bg-slate-800",
    text: "text-slate-700",
    textDark: "text-slate-300",
    border: "border-slate-300",
    borderDark: "border-slate-600",
  },
  success: {
    bg: "bg-green-100",
    bgDark: "bg-green-900/30",
    text: "text-green-700",
    textDark: "text-green-400",
    border: "border-green-300",
    borderDark: "border-green-700",
  },
  warning: {
    bg: "bg-yellow-100",
    bgDark: "bg-yellow-900/30",
    text: "text-yellow-700",
    textDark: "text-yellow-400",
    border: "border-yellow-300",
    borderDark: "border-yellow-700",
  },
  error: {
    bg: "bg-red-100",
    bgDark: "bg-red-900/30",
    text: "text-red-700",
    textDark: "text-red-400",
    border: "border-red-300",
    borderDark: "border-red-700",
  },
  info: {
    bg: "bg-blue-100",
    bgDark: "bg-blue-900/30",
    text: "text-blue-700",
    textDark: "text-blue-400",
    border: "border-blue-300",
    borderDark: "border-blue-700",
  },
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  icon,
  outlined = false,
  pill = false,
  className,
}: BadgeProps) {
  const { isDark } = useTheme();
  const sizeStyle = sizeStyles[size];
  const variantStyle = variantStyles[variant];

  return (
    <View
      className={cn(
        "flex-row items-center self-start",
        sizeStyle.container,
        pill ? "rounded-full" : "rounded-md",
        outlined
          ? cn(
              "border bg-transparent",
              isDark ? variantStyle.borderDark : variantStyle.border
            )
          : isDark
            ? variantStyle.bgDark
            : variantStyle.bg,
        className
      )}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${variant} badge: ${typeof children === "string" ? children : ""}`}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={sizeStyle.icon}
          color={
            isDark
              ? getTextColor(variantStyle.textDark)
              : getTextColor(variantStyle.text)
          }
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        className={cn(
          sizeStyle.text,
          "font-medium",
          isDark ? variantStyle.textDark : variantStyle.text
        )}
      >
        {children}
      </Text>
    </View>
  );
}

// Helper to extract color from class name
function getTextColor(className: string): string {
  const colorMap: Record<string, string> = {
    "text-gray-700": "#374151",
    "text-gray-300": "#d1d5db",
    "text-primary-700": "#047857",
    "text-primary-400": "#34d399",
    "text-slate-700": "#334155",
    "text-slate-300": "#cbd5e1",
    "text-green-700": "#15803d",
    "text-green-400": "#4ade80",
    "text-yellow-700": "#a16207",
    "text-yellow-400": "#facc15",
    "text-red-700": "#b91c1c",
    "text-red-400": "#f87171",
    "text-blue-700": "#1d4ed8",
    "text-blue-400": "#60a5fa",
  };
  return colorMap[className] || "#6b7280";
}

/**
 * Chip component (interactive badge)
 */
interface ChipProps extends Omit<BadgeProps, "children"> {
  /**
   * Chip label
   */
  label: string;

  /**
   * Called when the chip is pressed
   */
  onPress?: () => void;

  /**
   * Whether the chip is selected
   */
  selected?: boolean;

  /**
   * Whether to show remove button
   */
  removable?: boolean;

  /**
   * Called when remove button is pressed
   */
  onRemove?: () => void;

  /**
   * Whether the chip is disabled
   */
  disabled?: boolean;
}

export function Chip({
  label,
  variant = "default",
  size = "md",
  icon,
  onPress,
  selected = false,
  removable = false,
  onRemove,
  disabled = false,
  pill = true,
  className,
}: ChipProps) {
  const { isDark } = useTheme();
  const sizeStyle = sizeStyles[size];
  const variantStyle = selected
    ? variantStyles.primary
    : variantStyles[variant];

  const content = (
    <View
      className={cn(
        "flex-row items-center",
        sizeStyle.container,
        pill ? "rounded-full" : "rounded-md",
        selected
          ? isDark
            ? "bg-primary-600"
            : "bg-primary-500"
          : isDark
            ? variantStyle.bgDark
            : variantStyle.bg,
        disabled && "opacity-50",
        className
      )}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={sizeStyle.icon}
          color={
            selected
              ? "#ffffff"
              : isDark
                ? getTextColor(variantStyle.textDark)
                : getTextColor(variantStyle.text)
          }
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        className={cn(
          sizeStyle.text,
          "font-medium",
          selected
            ? "text-white"
            : isDark
              ? variantStyle.textDark
              : variantStyle.text
        )}
      >
        {label}
      </Text>
      {removable && (
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={disabled}
          className="ml-1"
        >
          <Ionicons
            name="close-circle"
            size={sizeStyle.icon + 2}
            color={
              selected
                ? "#ffffff"
                : isDark
                  ? getTextColor(variantStyle.textDark)
                  : getTextColor(variantStyle.text)
            }
          />
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

/**
 * Count Badge (for notifications, cart items, etc.)
 */
interface CountBadgeProps {
  /**
   * Count to display
   */
  count: number;

  /**
   * Maximum count to show before showing "99+"
   */
  max?: number;

  /**
   * Variant color
   */
  variant?: "primary" | "error" | "warning";

  /**
   * Size variant
   */
  size?: "sm" | "md";

  /**
   * Additional class name
   */
  className?: string;
}

export function CountBadge({
  count,
  max = 99,
  variant = "error",
  size = "sm",
  className,
}: CountBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  const bgColors = {
    primary: "bg-primary-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
  };

  const sizes = {
    sm: { min: 18, text: "text-xs", px: 4 },
    md: { min: 22, text: "text-sm", px: 6 },
  };

  const sizeConfig = sizes[size];

  return (
    <View
      className={cn(
        "items-center justify-center rounded-full",
        bgColors[variant],
        className
      )}
      style={{
        minWidth: sizeConfig.min,
        height: sizeConfig.min,
        paddingHorizontal: sizeConfig.px,
      }}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${count} ${count === 1 ? "notification" : "notifications"}`}
    >
      <Text className={cn(sizeConfig.text, "font-bold text-white")}>
        {displayCount}
      </Text>
    </View>
  );
}
