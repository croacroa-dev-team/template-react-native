/**
 * @fileoverview Upload hook with progress tracking, cancellation, and retry
 * Wraps the media-upload service in a React hook with state management.
 * @module hooks/useUpload
 */

import { useState, useCallback, useRef } from "react";

import {
  uploadFile,
  type UploadProgress,
  type UploadResult,
} from "@/services/media/media-upload";

/**
 * Options for the useUpload hook
 */
export interface UseUploadOptions {
  /** Server URL to upload to */
  url: string;
  /** Additional HTTP headers */
  headers?: Record<string, string>;
  /** Form field name for the file (default: 'file') */
  fieldName?: string;
}

/**
 * Return type for the useUpload hook
 */
export interface UseUploadReturn {
  /** Start an upload */
  upload: (
    uri: string,
    extraFields?: Record<string, string>
  ) => Promise<UploadResult | null>;
  /** Current upload progress */
  progress: UploadProgress | null;
  /** Whether an upload is in progress */
  isUploading: boolean;
  /** Last upload error */
  error: string | null;
  /** Cancel the current upload */
  cancel: () => void;
  /** Reset all state */
  reset: () => void;
}

/**
 * Hook for uploading files with progress tracking, cancellation, and retry support.
 *
 * @param options - Upload configuration
 * @returns Upload function, progress state, and control functions
 *
 * @example
 * ```tsx
 * function UploadScreen() {
 *   const { upload, progress, isUploading, error, cancel, reset } = useUpload({
 *     url: 'https://api.example.com/upload',
 *     headers: { Authorization: `Bearer ${token}` },
 *   });
 *
 *   const handleUpload = async (uri: string) => {
 *     const result = await upload(uri, { userId: '123' });
 *     if (result) {
 *       console.log('Upload complete:', result.status);
 *     }
 *   };
 *
 *   return (
 *     <View>
 *       {isUploading && (
 *         <>
 *           <Text>Uploading... {progress?.percentage ?? 0}%</Text>
 *           <Button onPress={cancel}>Cancel</Button>
 *         </>
 *       )}
 *       {error && (
 *         <>
 *           <Text>{error}</Text>
 *           <Button onPress={() => handleUpload(lastUri)}>Retry</Button>
 *         </>
 *       )}
 *     </View>
 *   );
 * }
 * ```
 */
export function useUpload(options: UseUploadOptions): UseUploadReturn {
  const { url, headers, fieldName = "file" } = options;

  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<(() => void) | null>(null);

  /**
   * Start uploading a file
   */
  const upload = useCallback(
    async (
      uri: string,
      extraFields?: Record<string, string>
    ): Promise<UploadResult | null> => {
      setError(null);
      setProgress(null);
      setIsUploading(true);

      try {
        const { promise, abort } = uploadFile({
          url,
          uri,
          fieldName,
          headers,
          extraFields,
          onProgress: (p) => {
            setProgress(p);
          },
        });

        abortRef.current = abort;

        const result = await promise;
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed";
        setError(message);
        return null;
      } finally {
        abortRef.current = null;
        setIsUploading(false);
      }
    },
    [url, headers, fieldName]
  );

  /**
   * Cancel the current upload
   */
  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    cancel();
    setProgress(null);
    setIsUploading(false);
    setError(null);
  }, [cancel]);

  return {
    upload,
    progress,
    isUploading,
    error,
    cancel,
    reset,
  };
}
