import { TouchableOpacity, View, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/utils/cn";

interface CheckboxProps {
  /**
   * Whether the checkbox is checked
   */
  checked: boolean;

  /**
   * Callback when the checkbox is toggled
   */
  onChange: (checked: boolean) => void;

  /**
   * Label text
   */
  label?: string;

  /**
   * Description text (below label)
   */
  description?: string;

  /**
   * Whether the checkbox is disabled
   */
  disabled?: boolean;

  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";

  /**
   * Additional class name
   */
  className?: string;

  /**
   * Error message
   */
  error?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

const sizes = {
  sm: { box: 18, icon: 12, label: "text-sm" },
  md: { box: 22, icon: 16, label: "text-base" },
  lg: { box: 26, icon: 20, label: "text-lg" },
};

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = "md",
  className,
  error,
}: CheckboxProps) {
  const { isDark } = useTheme();
  const sizeConfig = sizes[size];

  const animatedBoxStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      checked ? 1 : 0,
      [0, 1],
      ["transparent", "#10b981"]
    );

    const borderColor = interpolateColor(
      checked ? 1 : 0,
      [0, 1],
      [error ? "#ef4444" : isDark ? "#475569" : "#cbd5e1", "#10b981"]
    );

    return {
      backgroundColor: withTiming(backgroundColor, { duration: 150 }),
      borderColor: withTiming(borderColor, { duration: 150 }),
      transform: [
        {
          scale: withSpring(checked ? 1 : 0.95, {
            damping: 15,
            stiffness: 400,
          }),
        },
      ],
    };
  }, [checked, isDark, error]);

  const animatedCheckStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(checked ? 1 : 0, { duration: 150 }),
      transform: [
        {
          scale: withSpring(checked ? 1 : 0.5, {
            damping: 15,
            stiffness: 400,
          }),
        },
      ],
    };
  }, [checked]);

  return (
    <TouchableOpacity
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
      activeOpacity={0.7}
      className={cn(
        "flex-row items-start",
        disabled && "opacity-50",
        className
      )}
    >
      <AnimatedView
        style={[
          animatedBoxStyle,
          {
            width: sizeConfig.box,
            height: sizeConfig.box,
            borderWidth: 2,
            borderRadius: 6,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 2,
          },
        ]}
      >
        <Animated.View style={animatedCheckStyle}>
          <Ionicons name="checkmark" size={sizeConfig.icon} color="white" />
        </Animated.View>
      </AnimatedView>

      {(label || description) && (
        <View className="flex-1 ml-3">
          {label && (
            <Text
              className={cn(
                sizeConfig.label,
                isDark ? "text-text-dark" : "text-text-light",
                disabled && "opacity-70"
              )}
            >
              {label}
            </Text>
          )}
          {description && (
            <Text
              className={cn(
                "text-sm mt-0.5",
                isDark ? "text-muted-dark" : "text-muted-light"
              )}
            >
              {description}
            </Text>
          )}
          {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

/**
 * Checkbox Group component for multiple checkboxes
 */
interface CheckboxGroupProps<T extends string> {
  /**
   * Available options
   */
  options: {
    value: T;
    label: string;
    description?: string;
    disabled?: boolean;
  }[];

  /**
   * Currently selected values
   */
  value: T[];

  /**
   * Callback when selection changes
   */
  onChange: (value: T[]) => void;

  /**
   * Group label
   */
  label?: string;

  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";

  /**
   * Additional class name
   */
  className?: string;
}

export function CheckboxGroup<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  className,
}: CheckboxGroupProps<T>) {
  const { isDark } = useTheme();

  const handleToggle = (optionValue: T) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <View className={className}>
      {label && (
        <Text
          className={cn(
            "text-sm font-medium mb-3",
            isDark ? "text-text-dark" : "text-text-light"
          )}
        >
          {label}
        </Text>
      )}
      <View className="gap-3">
        {options.map((option) => (
          <Checkbox
            key={option.value}
            checked={value.includes(option.value)}
            onChange={() => handleToggle(option.value)}
            label={option.label}
            description={option.description}
            disabled={option.disabled}
            size={size}
          />
        ))}
      </View>
    </View>
  );
}
