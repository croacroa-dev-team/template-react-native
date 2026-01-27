import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/utils/cn";

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface SelectProps<T = string> {
  /**
   * Available options
   */
  options: SelectOption<T>[];

  /**
   * Currently selected value
   */
  value?: T;

  /**
   * Callback when value changes
   */
  onChange?: (value: T) => void;

  /**
   * Placeholder text when no value selected
   */
  placeholder?: string;

  /**
   * Label displayed above the select
   */
  label?: string;

  /**
   * Error message
   */
  error?: string;

  /**
   * Whether the select is disabled
   */
  disabled?: boolean;

  /**
   * Additional class name for container
   */
  className?: string;

  /**
   * Modal title
   */
  modalTitle?: string;
}

export function Select<T = string>({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label,
  error,
  disabled = false,
  className,
  modalTitle,
}: SelectProps<T>) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = useCallback(
    (option: SelectOption<T>) => {
      if (option.disabled) return;
      onChange?.(option.value);
      setIsOpen(false);
    },
    [onChange]
  );

  const renderOption = ({ item }: { item: SelectOption<T> }) => {
    const isSelected = item.value === value;

    return (
      <TouchableOpacity
        onPress={() => handleSelect(item)}
        disabled={item.disabled}
        className={cn(
          "flex-row items-center px-4 py-3 border-b",
          isDark ? "border-surface-dark" : "border-gray-100",
          isSelected && (isDark ? "bg-surface-dark" : "bg-primary-50"),
          item.disabled && "opacity-50"
        )}
        activeOpacity={0.7}
      >
        {item.icon && (
          <Ionicons
            name={item.icon}
            size={20}
            color={isSelected ? "#10b981" : isDark ? "#94a3b8" : "#64748b"}
            style={styles.optionIcon}
          />
        )}
        <Text
          className={cn(
            "flex-1 text-base",
            isSelected
              ? "text-primary-600 font-medium"
              : isDark
                ? "text-text-dark"
                : "text-text-light"
          )}
        >
          {item.label}
        </Text>
        {isSelected && <Ionicons name="checkmark" size={20} color="#10b981" />}
      </TouchableOpacity>
    );
  };

  return (
    <View className={cn("mb-4", className)}>
      {label && (
        <Text
          className={cn(
            "text-sm font-medium mb-1.5",
            isDark ? "text-text-dark" : "text-text-light"
          )}
        >
          {label}
        </Text>
      )}

      <TouchableOpacity
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={cn(
          "flex-row items-center justify-between px-4 py-3 rounded-xl border",
          isDark
            ? "bg-surface-dark border-gray-700"
            : "bg-white border-gray-200",
          error && "border-red-500",
          disabled && "opacity-50"
        )}
        activeOpacity={0.7}
      >
        <Text
          className={cn(
            "text-base",
            selectedOption
              ? isDark
                ? "text-text-dark"
                : "text-text-light"
              : isDark
                ? "text-muted-dark"
                : "text-muted-light"
          )}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={isDark ? "#94a3b8" : "#64748b"}
        />
      </TouchableOpacity>

      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View
            className={cn(
              "rounded-t-3xl max-h-[70%]",
              isDark ? "bg-background-dark" : "bg-white"
            )}
          >
            {/* Header */}
            <View
              className={cn(
                "flex-row items-center justify-between px-4 py-4 border-b",
                isDark ? "border-surface-dark" : "border-gray-100"
              )}
            >
              <Text
                className={cn(
                  "text-lg font-semibold",
                  isDark ? "text-text-dark" : "text-text-light"
                )}
              >
                {modalTitle || label || "Select"}
              </Text>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={isDark ? "#f8fafc" : "#0f172a"}
                />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item, index) => `${item.value}-${index}`}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  optionIcon: {
    marginRight: 12,
  },
});
