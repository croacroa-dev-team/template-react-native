/**
 * @fileoverview Upload progress bar component
 * Displays upload progress with percentage, cancel, retry, and error states.
 * @module components/ui/UploadProgress
 */

import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import type { UploadProgress as UploadProgressType } from "@/services/media/media-upload";
import { cn } from "@/utils/cn";
import { progressA11y, buttonA11y } from "@/utils/accessibility";

/**
 * Props for the UploadProgress component
 */
interface UploadProgressProps {
  /** Current upload progress */
  progress: UploadProgressType | null;
  /** Whether an upload is currently in progress */
  isUploading: boolean;
  /** Error message if the upload failed */
  error?: string | null;
  /** Callback to cancel the upload */
  onCancel?: () => void;
  /** Callback to retry a failed upload */
  onRetry?: () => void;
  /** Additional class name for the container */
  className?: string;
}

/**
 * Upload progress indicator with error and cancel/retry support.
 * Returns null when there is nothing to show (not uploading, no error).
 *
 * @example
 * ```tsx
 * function FileUploader() {
 *   const { upload, progress, isUploading, error, cancel, reset } = useUpload({
 *     url: 'https://api.example.com/upload',
 *   });
 *
 *   return (
 *     <View>
 *       <Button onPress={() => upload(fileUri)}>Upload</Button>
 *       <UploadProgress
 *         progress={progress}
 *         isUploading={isUploading}
 *         error={error}
 *         onCancel={cancel}
 *         onRetry={() => upload(fileUri)}
 *       />
 *     </View>
 *   );
 * }
 * ```
 */
export function UploadProgress({
  progress,
  isUploading,
  error,
  onCancel,
  onRetry,
  className,
}: UploadProgressProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  // Nothing to show
  if (!isUploading && !error) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <View
        className={cn(
          "flex-row items-center rounded-lg px-4 py-3",
          isDark ? "bg-red-900/30" : "bg-red-50",
          className
        )}
      >
        <Ionicons
          name="alert-circle"
          size={20}
          color={isDark ? "#fca5a5" : "#ef4444"}
        />
        <Text
          className={cn(
            "ml-2 flex-1 text-sm font-medium",
            isDark ? "text-red-300" : "text-red-600"
          )}
          numberOfLines={2}
        >
          {t("upload.failed")}
        </Text>
        {onRetry && (
          <Pressable
            onPress={onRetry}
            className={cn(
              "ml-2 rounded-md px-3 py-1.5",
              isDark
                ? "bg-red-800/50 active:bg-red-800"
                : "bg-red-100 active:bg-red-200"
            )}
            {...buttonA11y("Retry upload")}
          >
            <Text
              className={cn(
                "text-sm font-semibold",
                isDark ? "text-red-300" : "text-red-600"
              )}
            >
              {t("upload.retry")}
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  // Uploading state
  const percentage = progress?.percentage ?? 0;

  return (
    <View
      className={cn(
        "rounded-lg px-4 py-3",
        isDark ? "bg-gray-800" : "bg-gray-50",
        className
      )}
      {...progressA11y("Upload", percentage)}
    >
      {/* Header row */}
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text
            className={cn(
              "text-sm font-medium",
              isDark ? "text-gray-200" : "text-gray-700"
            )}
          >
            {t("upload.uploading")}
          </Text>
          <Text
            className={cn(
              "ml-2 text-sm",
              isDark ? "text-gray-400" : "text-gray-500"
            )}
          >
            {percentage}%
          </Text>
        </View>
        {onCancel && (
          <Pressable
            onPress={onCancel}
            className={cn(
              "rounded-md px-3 py-1",
              isDark
                ? "bg-gray-700 active:bg-gray-600"
                : "bg-gray-200 active:bg-gray-300"
            )}
            {...buttonA11y("Cancel upload")}
          >
            <Text
              className={cn(
                "text-xs font-semibold",
                isDark ? "text-gray-300" : "text-gray-600"
              )}
            >
              Cancel
            </Text>
          </Pressable>
        )}
      </View>

      {/* Progress bar */}
      <View
        className={cn(
          "h-2 overflow-hidden rounded-full",
          isDark ? "bg-gray-700" : "bg-gray-200"
        )}
      >
        <View
          className="h-full rounded-full bg-primary-500"
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
}
