import { renderHook, act } from "@testing-library/react-native";

import { useImagePicker } from "@/hooks/useImagePicker";
import { useUpload } from "@/hooks/useUpload";
import type { PickedMedia } from "@/services/media/media-picker";
import type { UploadResult } from "@/services/media/media-upload";

// Mock usePermission
const mockRequest = jest.fn();
const mockOpenSettings = jest.fn();

jest.mock("@/hooks/usePermission", () => ({
  usePermission: jest.fn((type: string) => ({
    status: "granted",
    isGranted: true,
    isBlocked: false,
    isLoading: false,
    config: { title: `${type} Access`, message: "Test message", icon: "test" },
    request: mockRequest,
    openSettings: mockOpenSettings,
    refresh: jest.fn(),
  })),
}));

// Mock media picker
const mockPickFromLibrary = jest.fn();
const mockPickFromCamera = jest.fn();

jest.mock("@/services/media/media-picker", () => ({
  pickFromLibrary: (...args: any[]) => mockPickFromLibrary(...args),
  pickFromCamera: (...args: any[]) => mockPickFromCamera(...args),
}));

// Mock compression
const mockCompressImage = jest.fn();

jest.mock("@/services/media/compression", () => ({
  compressImage: (...args: any[]) => mockCompressImage(...args),
}));

// Mock media upload
const mockUploadFile = jest.fn();

jest.mock("@/services/media/media-upload", () => ({
  uploadFile: (...args: any[]) => mockUploadFile(...args),
}));

// Mock Alert
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  RN.Alert.alert = jest.fn();
  return RN;
});

// Test data
const mockMedia: PickedMedia = {
  uri: "file:///test/photo.jpg",
  width: 1920,
  height: 1080,
  type: "image",
  fileName: "photo.jpg",
};

const mockCompressedMedia = {
  uri: "file:///test/compressed.jpg",
  width: 1080,
  height: 607,
};

describe("useImagePicker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest.mockResolvedValue("granted");
    mockCompressImage.mockResolvedValue(mockCompressedMedia);

    // Reset usePermission to default "granted" state
    const { usePermission } = require("@/hooks/usePermission");
    (usePermission as jest.Mock).mockImplementation((type: string) => ({
      status: "granted",
      isGranted: true,
      isBlocked: false,
      isLoading: false,
      config: {
        title: `${type} Access`,
        message: "Test message",
        icon: "test",
      },
      request: mockRequest,
      openSettings: mockOpenSettings,
      refresh: jest.fn(),
    }));
  });

  it("should pick and compress image from library", async () => {
    mockPickFromLibrary.mockResolvedValue([mockMedia]);

    const { result } = renderHook(() => useImagePicker());

    let picked: PickedMedia | null = null;
    await act(async () => {
      picked = await result.current.pickFromLibrary();
    });

    expect(mockPickFromLibrary).toHaveBeenCalled();
    expect(mockCompressImage).toHaveBeenCalledWith(mockMedia.uri, {
      maxWidth: 1080,
      maxHeight: 1080,
      quality: 0.7,
    });
    expect(picked).toBeTruthy();
    expect(picked!.uri).toBe(mockCompressedMedia.uri);
    expect(result.current.selectedMedia).toBeTruthy();
  });

  it("should pick and compress image from camera", async () => {
    mockPickFromCamera.mockResolvedValue(mockMedia);

    const { result } = renderHook(() => useImagePicker());

    let picked: PickedMedia | null = null;
    await act(async () => {
      picked = await result.current.pickFromCamera();
    });

    expect(mockPickFromCamera).toHaveBeenCalled();
    expect(mockCompressImage).toHaveBeenCalled();
    expect(picked).toBeTruthy();
    expect(result.current.selectedMedia).toBeTruthy();
  });

  it("should return preview URI after pick", async () => {
    mockPickFromLibrary.mockResolvedValue([mockMedia]);

    const { result } = renderHook(() => useImagePicker());

    await act(async () => {
      await result.current.pickFromLibrary();
    });

    expect(result.current.selectedMedia?.uri).toBe(mockCompressedMedia.uri);
  });

  it("should clear state when clear() is called", async () => {
    mockPickFromLibrary.mockResolvedValue([mockMedia]);

    const { result } = renderHook(() => useImagePicker());

    await act(async () => {
      await result.current.pickFromLibrary();
    });

    expect(result.current.selectedMedia).toBeTruthy();

    act(() => {
      result.current.clear();
    });

    expect(result.current.selectedMedia).toBeNull();
  });

  it("should handle permission denied", async () => {
    const { usePermission } = require("@/hooks/usePermission");
    (usePermission as jest.Mock).mockImplementation((type: string) => ({
      status: "denied",
      isGranted: false,
      isBlocked: false,
      isLoading: false,
      config: {
        title: `${type} Access`,
        message: "Test message",
        icon: "test",
      },
      request: mockRequest,
      openSettings: mockOpenSettings,
      refresh: jest.fn(),
    }));

    mockRequest.mockResolvedValue("denied");

    const { result } = renderHook(() => useImagePicker());

    let picked: PickedMedia | null = null;
    await act(async () => {
      picked = await result.current.pickFromLibrary();
    });

    expect(picked).toBeNull();
    expect(mockPickFromLibrary).not.toHaveBeenCalled();
  });
});

describe("useUpload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call uploadFile and track progress", async () => {
    const mockResult: UploadResult = { status: 200, body: '{"ok":true}' };
    mockUploadFile.mockReturnValue({
      promise: Promise.resolve(mockResult),
      abort: jest.fn(),
    });

    const { result } = renderHook(() =>
      useUpload({ url: "https://api.example.com/upload" })
    );

    let uploadResult: UploadResult | null = null;
    await act(async () => {
      uploadResult = await result.current.upload("file:///test/photo.jpg");
    });

    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api.example.com/upload",
        uri: "file:///test/photo.jpg",
        fieldName: "file",
      })
    );
    expect(uploadResult).toEqual(mockResult);
  });

  it("should report progress updates", async () => {
    let onProgressCallback: ((p: any) => void) | null = null;
    mockUploadFile.mockImplementation((options: any) => {
      onProgressCallback = options.onProgress;
      return {
        promise: new Promise((resolve) => {
          // Simulate progress then resolve
          setTimeout(() => {
            if (onProgressCallback) {
              onProgressCallback({ loaded: 50, total: 100, percentage: 50 });
            }
            resolve({ status: 200, body: "ok" });
          }, 0);
        }),
        abort: jest.fn(),
      };
    });

    const { result } = renderHook(() =>
      useUpload({ url: "https://api.example.com/upload" })
    );

    await act(async () => {
      await result.current.upload("file:///test/photo.jpg");
    });

    // The onProgress callback was provided to uploadFile
    expect(onProgressCallback).toBeDefined();
  });

  it("should cancel upload when cancel() is called", async () => {
    const mockAbort = jest.fn();
    mockUploadFile.mockReturnValue({
      promise: new Promise(() => {}), // Never resolves
      abort: mockAbort,
    });

    const { result } = renderHook(() =>
      useUpload({ url: "https://api.example.com/upload" })
    );

    act(() => {
      result.current.upload("file:///test/photo.jpg");
    });

    act(() => {
      result.current.cancel();
    });

    expect(mockAbort).toHaveBeenCalled();
  });

  it("should reset all state when reset() is called", async () => {
    const mockResult: UploadResult = { status: 200, body: '{"ok":true}' };
    mockUploadFile.mockReturnValue({
      promise: Promise.resolve(mockResult),
      abort: jest.fn(),
    });

    const { result } = renderHook(() =>
      useUpload({ url: "https://api.example.com/upload" })
    );

    await act(async () => {
      await result.current.upload("file:///test/photo.jpg");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.progress).toBeNull();
    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle upload error", async () => {
    mockUploadFile.mockReturnValue({
      promise: Promise.reject(new Error("Network error")),
      abort: jest.fn(),
    });

    const { result } = renderHook(() =>
      useUpload({ url: "https://api.example.com/upload" })
    );

    let uploadResult: UploadResult | null = null;
    await act(async () => {
      uploadResult = await result.current.upload("file:///test/photo.jpg");
    });

    expect(uploadResult).toBeNull();
    expect(result.current.error).toBe("Network error");
    expect(result.current.isUploading).toBe(false);
  });
});
