/**
 * @fileoverview File upload service with progress tracking
 * Uses XMLHttpRequest for real-time upload progress reporting and abort support.
 * @module services/media/media-upload
 */

/**
 * Upload progress information
 */
export interface UploadProgress {
  /** Bytes uploaded so far */
  loaded: number;
  /** Total bytes to upload */
  total: number;
  /** Upload percentage (0-100) */
  percentage: number;
}

/**
 * Options for file upload
 */
export interface UploadOptions {
  /** Server URL to upload to */
  url: string;
  /** Local file URI to upload */
  uri: string;
  /** Form field name for the file (default: 'file') */
  fieldName?: string;
  /** MIME type of the file (default: 'image/jpeg') */
  mimeType?: string;
  /** Additional HTTP headers */
  headers?: Record<string, string>;
  /** Extra form fields to include */
  extraFields?: Record<string, string>;
  /** Progress callback */
  onProgress?: (progress: UploadProgress) => void;
}

/**
 * Upload result from the server
 */
export interface UploadResult {
  /** HTTP status code */
  status: number;
  /** Response body as string */
  body: string;
}

/**
 * Upload a file to a server with progress tracking.
 * Returns both a promise that resolves with the upload result and
 * an abort function to cancel the upload.
 *
 * Uses XMLHttpRequest instead of fetch to support upload progress events.
 *
 * @param options - Upload configuration
 * @returns Object with `promise` (resolves with UploadResult) and `abort` function
 *
 * @example
 * ```ts
 * const { promise, abort } = uploadFile({
 *   url: 'https://api.example.com/upload',
 *   uri: image.uri,
 *   mimeType: 'image/jpeg',
 *   headers: { Authorization: 'Bearer token' },
 *   onProgress: ({ percentage }) => console.log(`${percentage}%`),
 * });
 *
 * // Cancel if needed
 * // abort();
 *
 * const result = await promise;
 * console.log('Upload complete:', result.status, result.body);
 * ```
 */
export function uploadFile(options: UploadOptions): {
  promise: Promise<UploadResult>;
  abort: () => void;
} {
  const {
    url,
    uri,
    fieldName = "file",
    mimeType = "image/jpeg",
    headers = {},
    extraFields = {},
    onProgress,
  } = options;

  const xhr = new XMLHttpRequest();

  const promise = new Promise<UploadResult>((resolve, reject) => {
    // Build FormData
    const formData = new FormData();

    // Extract file name from URI
    const uriParts = uri.split("/");
    const fileName = uriParts[uriParts.length - 1] || "upload";

    // Append the file — React Native's XMLHttpRequest accepts this format
    formData.append(fieldName, {
      uri,
      type: mimeType,
      name: fileName,
    } as unknown as Blob);

    // Append any extra form fields
    for (const [key, value] of Object.entries(extraFields)) {
      formData.append(key, value);
    }

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });
    }

    // Handle successful completion
    xhr.addEventListener("load", () => {
      resolve({
        status: xhr.status,
        body: xhr.responseText,
      });
    });

    // Handle network errors
    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed: network error"));
    });

    // Handle abort
    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled"));
    });

    // Open and configure the request
    xhr.open("POST", url);

    // Set custom headers
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    // Send the form data
    xhr.send(formData);
  });

  const abort = () => {
    xhr.abort();
  };

  return { promise, abort };
}
