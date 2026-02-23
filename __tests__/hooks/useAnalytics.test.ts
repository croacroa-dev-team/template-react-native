import { renderHook, act } from "@testing-library/react-native";
import { usePathname } from "expo-router";

import { useTrackScreen } from "@/hooks/useTrackScreen";
import { useTrackEvent } from "@/hooks/useTrackEvent";
import { Analytics } from "@/services/analytics/analytics-adapter";

// Mock analytics adapter
jest.mock("@/services/analytics/analytics-adapter", () => ({
  Analytics: {
    screen: jest.fn(),
    track: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
    configure: jest.fn(),
    initialize: jest.fn(),
    setUserProperties: jest.fn(),
  },
}));

const mockAnalytics = Analytics as jest.Mocked<typeof Analytics>;
const mockUsePathname = usePathname as jest.Mock;

describe("useTrackScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/home");
  });

  it("should call Analytics.screen when pathname changes", () => {
    mockUsePathname.mockReturnValue("/home");
    const { rerender } = renderHook(() => useTrackScreen());

    expect(mockAnalytics.screen).toHaveBeenCalledWith("/home", {
      segments: [],
    });

    // Change pathname
    mockUsePathname.mockReturnValue("/profile");
    rerender({});

    expect(mockAnalytics.screen).toHaveBeenCalledWith("/profile", {
      segments: [],
    });
    expect(mockAnalytics.screen).toHaveBeenCalledTimes(2);
  });

  it("should not call Analytics.screen with empty pathname", () => {
    mockUsePathname.mockReturnValue("");
    renderHook(() => useTrackScreen());

    expect(mockAnalytics.screen).not.toHaveBeenCalled();
  });

  it("should not fire duplicate events for same pathname", () => {
    mockUsePathname.mockReturnValue("/home");
    const { rerender } = renderHook(() => useTrackScreen());

    expect(mockAnalytics.screen).toHaveBeenCalledTimes(1);

    // Re-render with same pathname
    rerender({});

    expect(mockAnalytics.screen).toHaveBeenCalledTimes(1);
  });
});

describe("useTrackEvent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a track function", () => {
    const { result } = renderHook(() => useTrackEvent());

    expect(typeof result.current.track).toBe("function");
  });

  it("should call Analytics.track with event name and properties", () => {
    const { result } = renderHook(() => useTrackEvent());

    act(() => {
      result.current.track("Button Clicked", { buttonId: "submit" });
    });

    expect(mockAnalytics.track).toHaveBeenCalledWith("Button Clicked", {
      buttonId: "submit",
    });
  });

  it("should return memoized track function (same reference across renders)", () => {
    const { result, rerender } = renderHook(() => useTrackEvent());

    const firstTrack = result.current.track;
    rerender({});
    const secondTrack = result.current.track;

    expect(firstTrack).toBe(secondTrack);
  });
});
