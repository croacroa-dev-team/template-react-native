import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  ModalProps as RNModalProps,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/utils/cn";
import { useTheme } from "@/hooks/useTheme";
import { buttonA11y } from "@/utils/accessibility";

interface ModalProps extends Omit<RNModalProps, "children"> {
  title?: string;
  onClose: () => void;
  showCloseButton?: boolean;
  size?: "sm" | "md" | "lg" | "full";
  className?: string;
  children: React.ReactNode;
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  full: "w-full h-full",
};

export function Modal({
  visible,
  title,
  onClose,
  showCloseButton = true,
  size = "md",
  className,
  children,
  ...props
}: ModalProps) {
  const { isDark } = useTheme();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
      {...props}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Pressable
          onPress={onClose}
          className="flex-1 items-center justify-center bg-black/50 px-4"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className={cn(
              "w-full rounded-2xl bg-background-light p-6 dark:bg-background-dark",
              size !== "full" && sizeStyles[size],
              className
            )}
            accessibilityRole="none"
            accessible
            accessibilityLabel={title ? `${title} dialog` : "Dialog"}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <View className="mb-4 flex-row items-center justify-between">
                {title ? (
                  <Text className="text-xl font-semibold text-text-light dark:text-text-dark">
                    {title}
                  </Text>
                ) : (
                  <View />
                )}
                {showCloseButton && (
                  <Pressable
                    onPress={onClose}
                    className="h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
                    {...buttonA11y("Close dialog")}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={isDark ? "#f8fafc" : "#0f172a"}
                    />
                  </Pressable>
                )}
              </View>
            )}

            {/* Content */}
            {children}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  );
}
