/**
 * @fileoverview Image/video selection wrapper around expo-image-picker
 * Provides a unified interface for picking media from library or camera.
 * @module services/media/media-picker
 */

import * as ImagePicker from "expo-image-picker";

/**
 * Represents a media item selected by the user
 */
export interface PickedMedia {
  /** Local file URI */
  uri: string;
  /** Type of media */
  type: "image" | "video";
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** File size in bytes */
  fileSize?: number;
  /** Original file name */
  fileName?: string;
  /** Duration in milliseconds (video only) */
  duration?: number;
}

/**
 * Options for picking media
 */
export interface PickOptions {
  /** Type of media to allow */
  mediaTypes?: "images" | "videos" | "all";
  /** Allow editing/cropping */
  allowsEditing?: boolean;
  /** Image quality (0-1) */
  quality?: number;
  /** Aspect ratio for cropping [width, height] */
  aspect?: [number, number];
  /** Allow multiple selection (library only) */
  allowsMultipleSelection?: boolean;
  /** Maximum number of items to select */
  selectionLimit?: number;
}

/**
 * Maps our simplified media type strings to ImagePicker.MediaTypeOptions
 */
const mediaTypeMap: Record<string, ImagePicker.MediaTypeOptions> = {
  images: ImagePicker.MediaTypeOptions.Images,
  videos: ImagePicker.MediaTypeOptions.Videos,
  all: ImagePicker.MediaTypeOptions.All,
};

/**
 * Convert an ImagePickerAsset to our PickedMedia interface
 */
function mapAsset(asset: ImagePicker.ImagePickerAsset): PickedMedia {
  return {
    uri: asset.uri,
    type: asset.type === "video" ? "video" : "image",
    width: asset.width,
    height: asset.height,
    fileSize: asset.fileSize ?? undefined,
    fileName: asset.fileName ?? undefined,
    duration: asset.duration ?? undefined,
  };
}

/**
 * Pick media from the device photo library.
 * Returns an empty array if the user cancels.
 *
 * @param options - Configuration for the picker
 * @returns Array of picked media items (empty if cancelled)
 *
 * @example
 * ```ts
 * const images = await pickFromLibrary({ mediaTypes: 'images', quality: 0.8 });
 * if (images.length > 0) {
 *   console.log('Selected:', images[0].uri);
 * }
 * ```
 */
export async function pickFromLibrary(
  options: PickOptions = {}
): Promise<PickedMedia[]> {
  const {
    mediaTypes = "images",
    allowsEditing = false,
    quality = 0.8,
    aspect,
    allowsMultipleSelection = false,
    selectionLimit,
  } = options;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: mediaTypeMap[mediaTypes] ?? ImagePicker.MediaTypeOptions.Images,
    allowsEditing: allowsMultipleSelection ? false : allowsEditing,
    quality,
    aspect,
    allowsMultipleSelection,
    selectionLimit,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets.map(mapAsset);
}

/**
 * Take a photo or video using the device camera.
 * Returns null if the user cancels.
 *
 * @param options - Configuration for the camera
 * @returns The captured media or null if cancelled
 *
 * @example
 * ```ts
 * const photo = await pickFromCamera({ quality: 0.7, allowsEditing: true });
 * if (photo) {
 *   console.log('Captured:', photo.uri);
 * }
 * ```
 */
export async function pickFromCamera(
  options: PickOptions = {}
): Promise<PickedMedia | null> {
  const {
    mediaTypes = "images",
    allowsEditing = false,
    quality = 0.8,
    aspect,
  } = options;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: mediaTypeMap[mediaTypes] ?? ImagePicker.MediaTypeOptions.Images,
    allowsEditing,
    quality,
    aspect,
  });

  if (result.canceled) {
    return null;
  }

  return mapAsset(result.assets[0]);
}
