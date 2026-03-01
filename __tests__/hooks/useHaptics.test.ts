import { renderHook, act } from "@testing-library/react-native";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

import { useHaptics } from "@/hooks/useHaptics";

const mockImpactAsync = Haptics.impactAsync as jest.Mock;
const mockNotificationAsync = Haptics.notificationAsync as jest.Mock;
const mockSelectionAsync = Haptics.selectionAsync as jest.Mock;

describe("useHaptics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to iOS so haptics are available
    (Platform as any).OS = "ios";
  });

  it("impact calls impactAsync with the correct style", async () => {
    const { result } = renderHook(() => useHaptics());

    await act(async () => {
      await result.current.impact("light");
    });

    expect(mockImpactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Light
    );

    await act(async () => {
      await result.current.impact("heavy");
    });

    expect(mockImpactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Heavy
    );
  });

  it("impact defaults to medium style", async () => {
    const { result } = renderHook(() => useHaptics());

    await act(async () => {
      await result.current.impact();
    });

    expect(mockImpactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Medium
    );
  });

  it("notification calls notificationAsync with the correct type", async () => {
    const { result } = renderHook(() => useHaptics());

    await act(async () => {
      await result.current.notification("success");
    });

    expect(mockNotificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success
    );

    await act(async () => {
      await result.current.notification("error");
    });

    expect(mockNotificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Error
    );
  });

  it("selection calls selectionAsync", async () => {
    const { result } = renderHook(() => useHaptics());

    await act(async () => {
      await result.current.selection();
    });

    expect(mockSelectionAsync).toHaveBeenCalled();
  });

  it("isAvailable is true on ios", () => {
    (Platform as any).OS = "ios";
    const { result } = renderHook(() => useHaptics());
    expect(result.current.isAvailable).toBe(true);
  });

  it("isAvailable is true on android", () => {
    (Platform as any).OS = "android";
    const { result } = renderHook(() => useHaptics());
    expect(result.current.isAvailable).toBe(true);
  });

  it("isAvailable is false on web and methods are no-ops", async () => {
    (Platform as any).OS = "web";
    const { result } = renderHook(() => useHaptics());

    expect(result.current.isAvailable).toBe(false);

    await act(async () => {
      await result.current.impact("light");
    });

    expect(mockImpactAsync).not.toHaveBeenCalled();
  });
});
