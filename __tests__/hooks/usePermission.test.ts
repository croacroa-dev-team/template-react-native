import { renderHook, act, waitFor } from "@testing-library/react-native";
import { AppState } from "react-native";

import { usePermission } from "@/hooks/usePermission";
import { PermissionManager } from "@/services/permissions/permission-manager";
import { DEFAULT_PERMISSION_CONFIGS } from "@/services/permissions/types";

// Mock PermissionManager
jest.mock("@/services/permissions/permission-manager", () => ({
  PermissionManager: {
    check: jest.fn(),
    request: jest.fn(),
    openSettings: jest.fn(),
  },
}));

const mockPermissionManager = PermissionManager as jest.Mocked<
  typeof PermissionManager
>;

// Track the AppState listener
let appStateCallback: ((state: string) => void) | null = null;
const mockRemove = jest.fn();

// Ensure AppState.currentState is set to a string value
// (the hook uses appStateRef.current.match() which requires a string)
(AppState as any).currentState = "active";

// Override AppState.addEventListener to capture the callback
const originalAddEventListener = AppState.addEventListener;
beforeAll(() => {
  (AppState as any).addEventListener = jest.fn((event: string, callback: any) => {
    if (event === "change") {
      appStateCallback = callback;
    }
    return { remove: mockRemove };
  });
});

afterAll(() => {
  (AppState as any).addEventListener = originalAddEventListener;
});

describe("usePermission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    appStateCallback = null;
    mockPermissionManager.check.mockResolvedValue({
      status: "undetermined",
      canAskAgain: true,
    });
    mockPermissionManager.request.mockResolvedValue({
      status: "granted",
      canAskAgain: true,
    });
    mockPermissionManager.openSettings.mockResolvedValue();
  });

  it("should return loading state initially", () => {
    const { result } = renderHook(() => usePermission("camera"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.status).toBe("undetermined");
  });

  it("should return granted status after check", async () => {
    mockPermissionManager.check.mockResolvedValue({
      status: "granted",
      canAskAgain: true,
    });

    const { result } = renderHook(() => usePermission("camera"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.status).toBe("granted");
    expect(result.current.isGranted).toBe(true);
    expect(result.current.isBlocked).toBe(false);
  });

  it("should return denied status after check", async () => {
    mockPermissionManager.check.mockResolvedValue({
      status: "denied",
      canAskAgain: true,
    });

    const { result } = renderHook(() => usePermission("camera"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.status).toBe("denied");
    expect(result.current.isGranted).toBe(false);
    expect(result.current.isBlocked).toBe(false);
  });

  it("should return blocked status after check", async () => {
    mockPermissionManager.check.mockResolvedValue({
      status: "blocked",
      canAskAgain: false,
    });

    const { result } = renderHook(() => usePermission("camera"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.status).toBe("blocked");
    expect(result.current.isGranted).toBe(false);
    expect(result.current.isBlocked).toBe(true);
  });

  it("should request permission and return status", async () => {
    mockPermissionManager.request.mockResolvedValue({
      status: "granted",
      canAskAgain: true,
    });

    const { result } = renderHook(() => usePermission("camera"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let requestResult: string = "";
    await act(async () => {
      requestResult = await result.current.request();
    });

    expect(requestResult).toBe("granted");
    expect(mockPermissionManager.request).toHaveBeenCalledWith("camera");
    expect(result.current.status).toBe("granted");
  });

  it("should call PermissionManager.openSettings", async () => {
    const { result } = renderHook(() => usePermission("camera"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.openSettings();
    });

    expect(mockPermissionManager.openSettings).toHaveBeenCalled();
  });

  it("should re-check permission when app becomes active", async () => {
    mockPermissionManager.check.mockResolvedValue({
      status: "denied",
      canAskAgain: true,
    });

    const { result } = renderHook(() => usePermission("camera"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.status).toBe("denied");
    expect(mockPermissionManager.check).toHaveBeenCalledTimes(1);

    // Simulate going to background and coming back
    mockPermissionManager.check.mockResolvedValue({
      status: "granted",
      canAskAgain: true,
    });

    // Simulate AppState change: go to background, then back to active
    act(() => {
      appStateCallback?.("background");
    });
    act(() => {
      appStateCallback?.("active");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("granted");
    });

    expect(mockPermissionManager.check).toHaveBeenCalledTimes(2);
  });

  it("should handle different permission types", async () => {
    mockPermissionManager.check.mockResolvedValue({
      status: "granted",
      canAskAgain: true,
    });

    const { result } = renderHook(() => usePermission("location"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockPermissionManager.check).toHaveBeenCalledWith("location");
    expect(result.current.config.title).toBe(
      DEFAULT_PERMISSION_CONFIGS.location.title
    );
  });

  it("should merge custom config with defaults", async () => {
    const customConfig = {
      title: "Custom Title",
      message: "Custom message for camera access",
    };

    const { result } = renderHook(() =>
      usePermission("camera", customConfig)
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.config.title).toBe("Custom Title");
    expect(result.current.config.message).toBe(
      "Custom message for camera access"
    );
    // icon should still be from defaults
    expect(result.current.config.icon).toBe(
      DEFAULT_PERMISSION_CONFIGS.camera.icon
    );
  });
});
