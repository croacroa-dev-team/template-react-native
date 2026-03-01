import { renderHook } from "@testing-library/react-native";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

import { useKeepAwake } from "@/hooks/useKeepAwake";

const mockActivate = activateKeepAwakeAsync as jest.Mock;
const mockDeactivate = deactivateKeepAwake as jest.Mock;

describe("useKeepAwake", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("activates keep awake on mount when active=true (default)", () => {
    renderHook(() => useKeepAwake());

    expect(mockActivate).toHaveBeenCalledWith("game-session");
  });

  it("deactivates keep awake on unmount", () => {
    const { unmount } = renderHook(() => useKeepAwake());

    unmount();

    expect(mockDeactivate).toHaveBeenCalledWith("game-session");
  });

  it("does not activate when active=false", () => {
    renderHook(() => useKeepAwake(false));

    expect(mockActivate).not.toHaveBeenCalled();
  });

  it("does not deactivate on unmount when active=false", () => {
    const { unmount } = renderHook(() => useKeepAwake(false));

    unmount();

    // The cleanup function is not registered when active=false
    expect(mockDeactivate).not.toHaveBeenCalled();
  });

  it("activates when active changes from false to true", () => {
    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => useKeepAwake(active),
      { initialProps: { active: false } }
    );

    expect(mockActivate).not.toHaveBeenCalled();

    rerender({ active: true });

    expect(mockActivate).toHaveBeenCalledWith("game-session");
  });
});
