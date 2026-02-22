/**
 * @fileoverview Image selection button with preview
 * Shows a dashed placeholder when empty and the selected image with
 * a clear button when an image is chosen.
 * @module components/ui/ImagePickerButton
 */

import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useImagePicker, type UseImagePickerOptions } from "@/hooks/useImagePicker";
import type { PickedMedia } from "@/services/media/media-picker";
import { cn } from "@/utils/cn";

/**
 * Props for the ImagePickerButton component
 */
interface ImagePickerButtonProps {
  /** Callback when an image is selected */
  onImageSelected?: (media: PickedMedia) => void;
  /** Size of the button in pixels (default: 100) */
  size?: number;
  /** Placeholder text (default: 'Add Photo') */
  placeholder?: string;
  /** Additional class name for the container */
  className?: string;
  /** Compression options passed to useImagePicker */
  pickerOptions?: UseImagePickerOptions;
}

/**
 * Image picker button with built-in preview.
 * Displays a dashed border placeholder with a camera icon when no image is selected.
 * Shows the selected image with an X button to clear when an image is chosen.
 *
 * @example
 * ```tsx
 * function ProfileForm() {
 *   const [avatar, setAvatar] = useState<PickedMedia | null>(null);
 *
 *   return (
 *     <ImagePickerButton
 *       size={120}
 *       placeholder="Profile Photo"
 *       onImageSelected={setAvatar}
 *     />
 *   );
 * }
 * ```
 */
export function ImagePickerButton({
  onImageSelected,
  size = 100,
  placeholder = "Add Photo",
  className,
  pickerOptions,
}: ImagePickerButtonProps) {
  const { isDark } = useTheme();
  const { pickFromLibrary, pickFromCamera, selectedMedia, isLoading, clear } =
    useImagePicker(pickerOptions);

  const handlePress = async () => {
    const result = await pickFromLibrary();
    if (result && onImageSelected) {
      onImageSelected(result);
    }
  };

  const handleLongPress = async () => {
    const result = await pickFromCamera();
    if (result && onImageSelected) {
      onImageSelected(result);
    }
  };

  const handleClear = () => {
    clear();
  };

  // Loading state
  if (isLoading) {
    return (
      <View
        className={cn("items-center justify-center rounded-xl", className)}
        style={{ width: size, height: size }}
      >
        <ActivityIndicator
          size="small"
          color={isDark ? "#94a3b8" : "#64748b"}
        />
      </View>
    );
  }

  // Image selected state
  if (selectedMedia) {
    return (
      <View
        className={cn("relative", className)}
        style={{ width: size, height: size }}
      >
        <View
          className="overflow-hidden rounded-xl"
          style={{ width: size, height: size }}
        >
          <Image
            source={{ uri: selectedMedia.uri }}
            style={{ width: size, height: size }}
            contentFit="cover"
            transition={200}
          />
        </View>

        {/* Clear button */}
        <Pressable
          onPress={handleClear}
          className={cn(
            "absolute -right-2 -top-2 z-10 items-center justify-center rounded-full",
            isDark ? "bg-gray-700" : "bg-white"
          )}
          style={{
            width: 24,
            height: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 3,
          }}
        >
          <Ionicons
            name="close"
            size={16}
            color={isDark ? "#f87171" : "#ef4444"}
          />
        </Pressable>
      </View>
    );
  }

  // Empty placeholder state
  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      className={cn(
        "items-center justify-center rounded-xl",
        isDark
          ? "border-gray-600 bg-gray-800/50"
          : "border-gray-300 bg-gray-50",
        className
      )}
      style={{
        width: size,
        height: size,
        borderWidth: 2,
        borderStyle: "dashed",
      }}
    >
      <Ionicons
        name="camera-outline"
        size={size * 0.28}
        color={isDark ? "#94a3b8" : "#9ca3af"}
      />
      <Text
        className={cn(
          "mt-1 text-center text-xs",
          isDark ? "text-gray-400" : "text-gray-500"
        )}
        numberOfLines={1}
      >
        {placeholder}
      </Text>
    </Pressable>
  );
}
