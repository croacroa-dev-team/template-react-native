import { renderHook, act, waitFor } from "@testing-library/react-native";
import * as ScreenOrientation from "expo-screen-orientation";

import { useScreenOrientation } from "@/hooks/useScreenOrientation";

const mockGetOrientation = ScreenOrientation.getOrientationAsync as jest.Mock;
const mockLockAsync = ScreenOrientation.lockAsync as jest.Mock;
const mockUnlockAsync = ScreenOrientation.unlockAsync as jest.Mock;
const mockAddListener =
  ScreenOrientation.addOrientationChangeListener as jest.Mock;
const mockRemoveListener =
  ScreenOrientation.removeOrientationChangeListener as jest.Mock;

describe("useScreenOrientation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOrientation.mockResolvedValue(
      ScreenOrientation.Orientation.PORTRAIT_UP
    );
  });

  it("reads the initial orientation", async () => {
    mockGetOrientation.mockResolvedValue(
      ScreenOrientation.Orientation.PORTRAIT_UP
    );

    const { result } = renderHook(() => useScreenOrientation());

    await waitFor(() => {
      expect(result.current.orientation).toBe("portrait");
    });
  });

  it("reads landscape initial orientation", async () => {
    mockGetOrientation.mockResolvedValue(
      ScreenOrientation.Orientation.LANDSCAPE_LEFT
    );

    const { result } = renderHook(() => useScreenOrientation());

    await waitFor(() => {
      expect(result.current.orientation).toBe("landscape");
    });
  });

  it("lockToPortrait calls lockAsync with PORTRAIT_UP", async () => {
    const { result } = renderHook(() => useScreenOrientation());

    await act(async () => {
      await result.current.lockToPortrait();
    });

    expect(mockLockAsync).toHaveBeenCalledWith(
      ScreenOrientation.OrientationLock.PORTRAIT_UP
    );
  });

  it("lockToLandscape calls lockAsync with LANDSCAPE", async () => {
    const { result } = renderHook(() => useScreenOrientation());

    await act(async () => {
      await result.current.lockToLandscape();
    });

    expect(mockLockAsync).toHaveBeenCalledWith(
      ScreenOrientation.OrientationLock.LANDSCAPE
    );
  });

  it("unlock calls unlockAsync", async () => {
    const { result } = renderHook(() => useScreenOrientation());

    await act(async () => {
      await result.current.unlock();
    });

    expect(mockUnlockAsync).toHaveBeenCalled();
  });

  it("auto-unlocks on unmount", () => {
    const { unmount } = renderHook(() => useScreenOrientation());

    unmount();

    // unlockAsync is called in cleanup
    expect(mockUnlockAsync).toHaveBeenCalled();
  });

  it("registers and removes orientation change listener", () => {
    const mockSubscription = { remove: jest.fn() };
    mockAddListener.mockReturnValue(mockSubscription);

    const { unmount } = renderHook(() => useScreenOrientation());

    expect(mockAddListener).toHaveBeenCalled();

    unmount();

    expect(mockRemoveListener).toHaveBeenCalledWith(mockSubscription);
  });
});
