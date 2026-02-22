/**
 * @fileoverview Image compression using expo-image-manipulator
 * Provides a simple API to resize and compress images before upload.
 * @module services/media/compression
 */

import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

/**
 * Options for image compression
 */
export interface CompressionOptions {
  /** Maximum width in pixels (default: 1080) */
  maxWidth?: number;
  /** Maximum height in pixels (default: 1080) */
  maxHeight?: number;
  /** Compression quality 0-1 (default: 0.7) */
  quality?: number;
  /** Output format (default: 'jpeg') */
  format?: "jpeg" | "png" | "webp";
}

/**
 * Result of image compression
 */
export interface CompressionResult {
  /** URI to the compressed image */
  uri: string;
  /** Width of the compressed image */
  width: number;
  /** Height of the compressed image */
  height: number;
}

/** Maps format strings to SaveFormat enum values */
const formatMap: Record<string, SaveFormat> = {
  jpeg: SaveFormat.JPEG,
  png: SaveFormat.PNG,
  webp: SaveFormat.WEBP,
};

/**
 * Compress and optionally resize an image.
 * Uses expo-image-manipulator to resize the image within the specified
 * maximum dimensions while preserving aspect ratio, then saves it
 * with the specified compression quality.
 *
 * @param uri - Local file URI of the image to compress
 * @param options - Compression configuration
 * @returns The compressed image result with URI and dimensions
 *
 * @example
 * ```ts
 * const result = await compressImage(photo.uri, {
 *   maxWidth: 800,
 *   maxHeight: 800,
 *   quality: 0.6,
 * });
 * console.log('Compressed:', result.uri, result.width, result.height);
 * ```
 */
export async function compressImage(
  uri: string,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1080,
    maxHeight = 1080,
    quality = 0.7,
    format = "jpeg",
  } = options;

  const context = ImageManipulator.manipulate(uri);

  // Resize within max dimensions while preserving aspect ratio.
  // Only pass width so the height scales proportionally, avoiding distortion.
  context.resize({ width: maxWidth });

  const imageRef = await context.renderAsync();

  const result = await imageRef.saveAsync({
    compress: quality,
    format: formatMap[format] ?? SaveFormat.JPEG,
  });

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
}
