import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Share } from "react-native";
import * as Sharing from "expo-sharing";

import { useShare } from "@/hooks/useShare";

const mockShareAsync = Sharing.shareAsync as jest.Mock;
const mockIsAvailableAsync = Sharing.isAvailableAsync as jest.Mock;

describe("useShare", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailableAsync.mockResolvedValue(true);
    mockShareAsync.mockResolvedValue(undefined);
    jest
      .spyOn(Share, "share")
      .mockResolvedValue({ action: "sharedAction" } as any);
  });

  it("share calls Sharing.shareAsync with the file URI", async () => {
    const { result } = renderHook(() => useShare());

    await waitFor(() => {
      expect(result.current.isAvailable).toBe(true);
    });

    await act(async () => {
      await result.current.share("/path/to/file.pdf", {
        mimeType: "application/pdf",
        dialogTitle: "Share file",
      });
    });

    expect(mockShareAsync).toHaveBeenCalledWith("/path/to/file.pdf", {
      mimeType: "application/pdf",
      dialogTitle: "Share file",
    });
  });

  it("shareText calls RN Share.share", async () => {
    const shareSpy = jest.spyOn(Share, "share");
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.shareText({
        message: "Check this out!",
        title: "Cool Stuff",
      });
    });

    expect(shareSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Check this out!",
        title: "Cool Stuff",
      }),
      expect.objectContaining({ dialogTitle: "Cool Stuff" })
    );
  });

  it("shareImage calls shareAsync with image/* mimeType", async () => {
    const { result } = renderHook(() => useShare());

    await waitFor(() => {
      expect(result.current.isAvailable).toBe(true);
    });

    await act(async () => {
      await result.current.shareImage("/path/to/photo.jpg", "Share Photo");
    });

    expect(mockShareAsync).toHaveBeenCalledWith("/path/to/photo.jpg", {
      mimeType: "image/*",
      dialogTitle: "Share Photo",
    });
  });

  it("isAvailable reflects Sharing.isAvailableAsync result (true)", async () => {
    mockIsAvailableAsync.mockResolvedValue(true);

    const { result } = renderHook(() => useShare());

    await waitFor(() => {
      expect(result.current.isAvailable).toBe(true);
    });
  });

  it("isAvailable reflects Sharing.isAvailableAsync result (false)", async () => {
    mockIsAvailableAsync.mockResolvedValue(false);

    const { result } = renderHook(() => useShare());

    await waitFor(() => {
      expect(result.current.isAvailable).toBe(false);
    });
  });

  it("share is a no-op when not available", async () => {
    mockIsAvailableAsync.mockResolvedValue(false);

    const { result } = renderHook(() => useShare());

    await waitFor(() => {
      expect(result.current.isAvailable).toBe(false);
    });

    await act(async () => {
      await result.current.share("/path/to/file.pdf");
    });

    expect(mockShareAsync).not.toHaveBeenCalled();
  });
});
