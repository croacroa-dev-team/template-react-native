/**
 * @fileoverview Sharing hook using expo-sharing with RN Share fallback
 * @module hooks/useShare
 */

import { useCallback, useEffect, useState } from "react";
import { Share, Platform } from "react-native";
import * as Sharing from "expo-sharing";

/**
 * Cross-platform sharing with expo-sharing (file sharing) and RN Share (text).
 * expo-sharing is preferred for files; RN Share handles plain text/URL sharing.
 */
export function useShare() {
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    Sharing.isAvailableAsync()
      .then(setIsAvailable)
      .catch(() => setIsAvailable(false));
  }, []);

  /**
   * Share a local file (image, PDF, etc.) via the native share sheet.
   */
  const share = useCallback(
    async (
      fileUri: string,
      options?: { mimeType?: string; dialogTitle?: string }
    ) => {
      if (!isAvailable) return;
      await Sharing.shareAsync(fileUri, {
        mimeType: options?.mimeType,
        dialogTitle: options?.dialogTitle,
      });
    },
    [isAvailable]
  );

  /**
   * Share text and/or a URL via the native share sheet (uses RN Share).
   */
  const shareText = useCallback(
    async (options: { message: string; title?: string; url?: string }) => {
      await Share.share(
        {
          message: options.message,
          title: options.title,
          ...(Platform.OS === "ios" && options.url ? { url: options.url } : {}),
        },
        { dialogTitle: options.title }
      );
    },
    []
  );

  /**
   * Share an image from a local file path.
   */
  const shareImage = useCallback(
    async (fileUri: string, dialogTitle?: string) => {
      await share(fileUri, { mimeType: "image/*", dialogTitle });
    },
    [share]
  );

  return { share, shareText, shareImage, isAvailable };
}
