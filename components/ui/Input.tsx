import { forwardRef, useState } from "react";
import { View, Text, TextInput, TextInputProps, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/utils/cn";
import { useTheme } from "@/hooks/useTheme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerClassName?: string;
  inputClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerClassName,
      inputClassName,
      secureTextEntry,
      ...props
    },
    ref
  ) => {
    const { isDark } = useTheme();
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isPassword = secureTextEntry !== undefined;

    const togglePasswordVisibility = () => {
      setIsPasswordVisible(!isPasswordVisible);
    };

    return (
      <View className={cn("w-full", containerClassName)}>
        {label && (
          <Text className="mb-2 text-sm font-medium text-text-light dark:text-text-dark">
            {label}
          </Text>
        )}

        <View
          className={cn(
            "flex-row items-center rounded-xl border-2 bg-surface-light px-4 dark:bg-surface-dark",
            error
              ? "border-red-500"
              : "border-gray-200 focus-within:border-primary-500 dark:border-gray-700"
          )}
        >
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={20}
              color={isDark ? "#94a3b8" : "#64748b"}
              style={{ marginRight: 8 }}
            />
          )}

          <TextInput
            ref={ref}
            className={cn(
              "flex-1 py-3 text-base text-text-light dark:text-text-dark",
              inputClassName
            )}
            placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
            secureTextEntry={isPassword && !isPasswordVisible}
            {...props}
          />

          {isPassword ? (
            <Pressable onPress={togglePasswordVisibility}>
              <Ionicons
                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={isDark ? "#94a3b8" : "#64748b"}
              />
            </Pressable>
          ) : rightIcon ? (
            <Pressable onPress={onRightIconPress} disabled={!onRightIconPress}>
              <Ionicons
                name={rightIcon}
                size={20}
                color={isDark ? "#94a3b8" : "#64748b"}
              />
            </Pressable>
          ) : null}
        </View>

        {error && <Text className="mt-1 text-sm text-red-500">{error}</Text>}

        {hint && !error && (
          <Text className="mt-1 text-sm text-muted-light dark:text-muted-dark">
            {hint}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";
