import { forwardRef } from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableProps,
  View,
} from "react-native";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  className?: string;
  textClassName?: string;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary-600 active:bg-primary-700",
  secondary: "bg-gray-200 dark:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600",
  outline: "border-2 border-gray-300 dark:border-gray-600 bg-transparent active:bg-gray-100 dark:active:bg-gray-800",
  ghost: "bg-transparent active:bg-gray-100 dark:active:bg-gray-800",
  danger: "bg-red-600 active:bg-red-700",
};

const variantTextStyles: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-text-light dark:text-text-dark",
  outline: "text-text-light dark:text-text-dark",
  ghost: "text-primary-600 dark:text-primary-400",
  danger: "text-white",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-2",
  md: "px-4 py-3",
  lg: "px-6 py-4",
};

const textSizeStyles: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export const Button = forwardRef<View, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      className,
      textClassName,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <Pressable
        ref={ref}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        className={cn(
          "flex-row items-center justify-center rounded-xl",
          variantStyles[variant],
          sizeStyles[size],
          isDisabled && "opacity-50",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator
            color={variant === "primary" || variant === "danger" ? "#ffffff" : "#3b82f6"}
            size="small"
          />
        ) : typeof children === "string" ? (
          <Text
            className={cn(
              "font-semibold",
              variantTextStyles[variant],
              textSizeStyles[size],
              textClassName
            )}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  }
);

Button.displayName = "Button";
