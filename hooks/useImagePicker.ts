/**
 * @fileoverview Combined image pick, compress, and preview hook
 * Integrates media picker and compression services with permission management.
 * @module hooks/useImagePicker
 */

import { useState, useCallback } from "react";
import { Alert, Platform } from "react-native";

import { usePermission } from "@/hooks/usePermission";
import {
  pickFromLibrary as pickFromLib,
  pickFromCamera as pickFromCam,
  type PickedMedia,
} from "@/services/media/media-picker";
import { compressImage } from "@/services/media/compression";

/**
 * Options for the useImagePicker hook
 */
export interface UseImagePickerOptions {
  /** Whether to compress images after picking (default: true) */
  compress?: boolean;
  /** Maximum width for compression (default: 1080) */
  maxWidth?: number;
  /** Maximum height for compression (default: 1080) */
  maxHeight?: number;
  /** Compression quality 0-1 (default: 0.7) */
  quality?: number;
}

/**
 * Return type for the useImagePicker hook
 */
export interface UseImagePickerReturn {
  /** Pick media from the photo library */
  pickFromLibrary: () => Promise<PickedMedia | null>;
  /** Take a photo with the camera */
  pickFromCamera: () => Promise<PickedMedia | null>;
  /** Currently selected media item */
  selectedMedia: PickedMedia | null;
  /** Whether a pick or compress operation is in progress */
  isLoading: boolean;
  /** Clear the selected media */
  clear: () => void;
  /** Camera permission state from usePermission */
  cameraPermission: ReturnType<typeof usePermission>;
  /** Media library permission state from usePermission */
  mediaLibraryPermission: ReturnType<typeof usePermission>;
}

/**
 * Hook for picking, compressing, and previewing images.
 * Combines the media picker service with compression and centralized
 * permission management via usePermission.
 *
 * @param options - Configuration for compression and behavior
 * @returns Pick functions, selected media state, and permission info
 *
 * @example
 * ```tsx
 * function ProfilePhoto() {
 *   const { pickFromLibrary, pickFromCamera, selectedMedia, isLoading, clear } =
 *     useImagePicker({ maxWidth: 500, quality: 0.8 });
 *
 *   return (
 *     <View>
 *       {selectedMedia ? (
 *         <>
 *           <Image source={{ uri: selectedMedia.uri }} style={{ width: 200, height: 200 }} />
 *           <Button onPress={clear}>Remove</Button>
 *         </>
 *       ) : (
 *         <>
 *           <Button onPress={pickFromLibrary}>Choose Photo</Button>
 *           <Button onPress={pickFromCamera}>Take Photo</Button>
 *         </>
 *       )}
 *       {isLoading && <ActivityIndicator />}
 *     </View>
 *   );
 * }
 * ```
 */
export function useImagePicker(
  options: UseImagePickerOptions = {}
): UseImagePickerReturn {
  const {
    compress = true,
    maxWidth = 1080,
    maxHeight = 1080,
    quality = 0.7,
  } = options;

  const [selectedMedia, setSelectedMedia] = useState<PickedMedia | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const cameraPermission = usePermission("camera");
  const mediaLibraryPermission = usePermission("mediaLibrary");

  /**
   * Ensure a permission is granted, requesting it if needed
   */
  const ensurePermission = useCallback(
    async (
      permission: ReturnType<typeof usePermission>,
      label: string
    ): Promise<boolean> => {
      if (permission.isGranted) {
        return true;
      }

      if (permission.isBlocked) {
        Alert.alert(
          `${label} Permission Required`,
          `Please allow ${label.toLowerCase()} access in your device settings.`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => permission.openSettings() },
          ]
        );
        return false;
      }

      // Request the permission and use the returned status directly
      // to avoid reading stale React state after an async operation.
      const resultStatus = await permission.request();
      return resultStatus === "granted";
    },
    []
  );

  /**
   * Optionally compress a picked image
   */
  const maybeCompress = useCallback(
    async (media: PickedMedia): Promise<PickedMedia> => {
      if (!compress || media.type !== "image") {
        return media;
      }

      try {
        const result = await compressImage(media.uri, {
          maxWidth,
          maxHeight,
          quality,
        });

        return {
          ...media,
          uri: result.uri,
          width: result.width,
          height: result.height,
        };
      } catch (err) {
        console.warn("[useImagePicker] Compression failed, using original:", err);
        return media;
      }
    },
    [compress, maxWidth, maxHeight, quality]
  );

  /**
   * Pick media from the photo library
   */
  const pickFromLibrary = useCallback(async (): Promise<PickedMedia | null> => {
    setIsLoading(true);
    try {
      const hasPermission = await ensurePermission(
        mediaLibraryPermission,
        "Photo Library"
      );
      if (!hasPermission) {
        return null;
      }

      const items = await pickFromLib({ quality: 0.8 });
      if (items.length === 0) {
        return null;
      }

      const compressed = await maybeCompress(items[0]);
      setSelectedMedia(compressed);
      return compressed;
    } catch (err) {
      console.error("[useImagePicker] Library pick error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [ensurePermission, mediaLibraryPermission, maybeCompress]);

  /**
   * Take a photo with the camera
   */
  const pickFromCamera = useCallback(async (): Promise<PickedMedia | null> => {
    setIsLoading(true);
    try {
      const hasPermission = await ensurePermission(
        cameraPermission,
        "Camera"
      );
      if (!hasPermission) {
        return null;
      }

      const item = await pickFromCam({ quality: 0.8 });
      if (!item) {
        return null;
      }

      const compressed = await maybeCompress(item);
      setSelectedMedia(compressed);
      return compressed;
    } catch (err) {
      console.error("[useImagePicker] Camera pick error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [ensurePermission, cameraPermission, maybeCompress]);

  /**
   * Clear the selected media
   */
  const clear = useCallback(() => {
    setSelectedMedia(null);
  }, []);

  return {
    pickFromLibrary,
    pickFromCamera,
    selectedMedia,
    isLoading,
    clear,
    cameraPermission,
    mediaLibraryPermission,
  };
}

/**
 * Utility to get file extension from URI
 */
export function getFileExtension(uri: string): string {
  const match = uri.match(/\.(\w+)$/);
  return match ? match[1].toLowerCase() : "jpg";
}

/**
 * Utility to get MIME type from extension
 */
export function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
  };
  return mimeTypes[extension.toLowerCase()] || "image/jpeg";
}

/**
 * Prepare image for FormData upload
 */
export function prepareImageForUpload(
  media: PickedMedia,
  fieldName = "image"
): { uri: string; type: string; name: string } {
  const extension = getFileExtension(media.uri);
  const type = getMimeType(extension);
  const name = media.fileName || `${fieldName}.${extension}`;

  return {
    uri: Platform.OS === "ios" ? media.uri.replace("file://", "") : media.uri,
    type,
    name,
  };
}
