/**
 * @fileoverview Image picker hook with permissions handling
 * Provides a simple interface for picking images from library or camera.
 * @module hooks/useImagePicker
 */

import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";

/**
 * Image picker options
 */
export interface ImagePickerOptions {
  /** Allow editing/cropping the image */
  allowsEditing?: boolean;
  /** Aspect ratio for cropping [width, height] */
  aspect?: [number, number];
  /** Image quality (0-1) */
  quality?: number;
  /** Media types to allow */
  mediaTypes?: ImagePicker.MediaTypeOptions;
  /** Allow multiple selection (library only) */
  allowsMultipleSelection?: boolean;
  /** Maximum number of images to select */
  selectionLimit?: number;
  /** Base64 encode the image */
  base64?: boolean;
  /** Include EXIF data */
  exif?: boolean;
}

/**
 * Selected image result
 */
export interface SelectedImage {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string;
  fileSize?: number;
  base64?: string;
  exif?: Record<string, unknown>;
}

/**
 * Hook return type
 */
export interface UseImagePickerReturn {
  /** Currently selected image(s) */
  images: SelectedImage[];
  /** Whether an operation is in progress */
  isLoading: boolean;
  /** Last error that occurred */
  error: string | null;
  /** Pick image from library */
  pickFromLibrary: (options?: ImagePickerOptions) => Promise<SelectedImage[] | null>;
  /** Take photo with camera */
  takePhoto: (options?: ImagePickerOptions) => Promise<SelectedImage | null>;
  /** Show action sheet to choose source */
  pickImage: (options?: ImagePickerOptions) => Promise<SelectedImage[] | null>;
  /** Clear selected images */
  clear: () => void;
  /** Remove specific image by index */
  removeImage: (index: number) => void;
}

const DEFAULT_OPTIONS: ImagePickerOptions = {
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsMultipleSelection: false,
  base64: false,
  exif: false,
};

/**
 * Convert ImagePicker asset to SelectedImage
 */
function assetToSelectedImage(asset: ImagePicker.ImagePickerAsset): SelectedImage {
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    type: asset.mimeType,
    fileName: asset.fileName ?? undefined,
    fileSize: asset.fileSize ?? undefined,
    base64: asset.base64 ?? undefined,
    exif: asset.exif ?? undefined,
  };
}

/**
 * Hook for picking images from library or camera.
 * Handles permissions automatically and provides a clean API.
 *
 * @example
 * ```tsx
 * function AvatarPicker() {
 *   const { images, pickImage, isLoading } = useImagePicker();
 *
 *   return (
 *     <Pressable onPress={() => pickImage({ aspect: [1, 1] })}>
 *       {images[0] ? (
 *         <Image source={{ uri: images[0].uri }} style={styles.avatar} />
 *       ) : (
 *         <Text>Select Avatar</Text>
 *       )}
 *     </Pressable>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Multiple image selection
 * function GalleryPicker() {
 *   const { images, pickFromLibrary, removeImage } = useImagePicker();
 *
 *   const handlePick = () => {
 *     pickFromLibrary({
 *       allowsMultipleSelection: true,
 *       selectionLimit: 5,
 *     });
 *   };
 *
 *   return (
 *     <View>
 *       <Button onPress={handlePick}>Add Photos</Button>
 *       {images.map((img, i) => (
 *         <ImageThumb key={i} uri={img.uri} onRemove={() => removeImage(i)} />
 *       ))}
 *     </View>
 *   );
 * }
 * ```
 */
export function useImagePicker(): UseImagePickerReturn {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Request camera permissions
   */
  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Permission Required",
        "Please allow camera access in your device settings to take photos.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  }, []);

  /**
   * Request media library permissions
   */
  const requestLibraryPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Photo Library Permission Required",
        "Please allow photo library access in your device settings to select images.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  }, []);

  /**
   * Pick image from library
   */
  const pickFromLibrary = useCallback(
    async (options: ImagePickerOptions = {}): Promise<SelectedImage[] | null> => {
      setError(null);
      setIsLoading(true);

      try {
        const hasPermission = await requestLibraryPermission();
        if (!hasPermission) {
          return null;
        }

        const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: mergedOptions.mediaTypes,
          allowsEditing: mergedOptions.allowsMultipleSelection
            ? false
            : mergedOptions.allowsEditing,
          aspect: mergedOptions.aspect,
          quality: mergedOptions.quality,
          allowsMultipleSelection: mergedOptions.allowsMultipleSelection,
          selectionLimit: mergedOptions.selectionLimit,
          base64: mergedOptions.base64,
          exif: mergedOptions.exif,
        });

        if (result.canceled) {
          return null;
        }

        const selectedImages = result.assets.map(assetToSelectedImage);

        if (mergedOptions.allowsMultipleSelection) {
          setImages((prev) => [...prev, ...selectedImages]);
        } else {
          setImages(selectedImages);
        }

        return selectedImages;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to pick image";
        setError(message);
        console.error("[useImagePicker] Library error:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [requestLibraryPermission]
  );

  /**
   * Take photo with camera
   */
  const takePhoto = useCallback(
    async (options: ImagePickerOptions = {}): Promise<SelectedImage | null> => {
      setError(null);
      setIsLoading(true);

      try {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          return null;
        }

        const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: mergedOptions.mediaTypes,
          allowsEditing: mergedOptions.allowsEditing,
          aspect: mergedOptions.aspect,
          quality: mergedOptions.quality,
          base64: mergedOptions.base64,
          exif: mergedOptions.exif,
        });

        if (result.canceled) {
          return null;
        }

        const selectedImage = assetToSelectedImage(result.assets[0]);
        setImages([selectedImage]);

        return selectedImage;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to take photo";
        setError(message);
        console.error("[useImagePicker] Camera error:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [requestCameraPermission]
  );

  /**
   * Show action sheet to choose source (library or camera)
   */
  const pickImage = useCallback(
    async (options: ImagePickerOptions = {}): Promise<SelectedImage[] | null> => {
      return new Promise((resolve) => {
        Alert.alert("Select Image", "Choose image source", [
          {
            text: "Camera",
            onPress: async () => {
              const result = await takePhoto(options);
              resolve(result ? [result] : null);
            },
          },
          {
            text: "Photo Library",
            onPress: async () => {
              const result = await pickFromLibrary(options);
              resolve(result);
            },
          },
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => resolve(null),
          },
        ]);
      });
    },
    [takePhoto, pickFromLibrary]
  );

  /**
   * Clear all selected images
   */
  const clear = useCallback(() => {
    setImages([]);
    setError(null);
  }, []);

  /**
   * Remove image by index
   */
  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    images,
    isLoading,
    error,
    pickFromLibrary,
    takePhoto,
    pickImage,
    clear,
    removeImage,
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
  image: SelectedImage,
  fieldName = "image"
): { uri: string; type: string; name: string } {
  const extension = getFileExtension(image.uri);
  const type = image.type || getMimeType(extension);
  const name = image.fileName || `${fieldName}.${extension}`;

  return {
    uri: Platform.OS === "ios" ? image.uri.replace("file://", "") : image.uri,
    type,
    name,
  };
}
