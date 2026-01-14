import { View, ViewProps } from "react-native";
import { cn } from "@/utils/cn";

interface CardProps extends ViewProps {
  variant?: "default" | "elevated" | "outlined";
  className?: string;
  children: React.ReactNode;
}

export function Card({
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <View
      className={cn(
        "rounded-xl",
        variant === "default" && "bg-surface-light dark:bg-surface-dark",
        variant === "elevated" &&
          "bg-surface-light shadow-lg dark:bg-surface-dark",
        variant === "outlined" &&
          "border-2 border-gray-200 bg-transparent dark:border-gray-700",
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}
