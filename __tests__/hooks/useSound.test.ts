import { renderHook, act } from "@testing-library/react-native";
import { useSound, useSoundEffects } from "@/hooks/useSound";
import { SoundManager } from "@/services/sound/sound-manager";

jest.mock("@/services/sound/sound-manager", () => ({
  SoundManager: {
    preload: jest.fn().mockResolvedValue(undefined),
    play: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    unload: jest.fn().mockResolvedValue(undefined),
    unloadAll: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockSoundManager = SoundManager as jest.Mocked<typeof SoundManager>;

describe("useSound", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("preloads the sound on mount", () => {
    const source = { uri: "tap.mp3" };
    renderHook(() => useSound("tap", source));

    expect(mockSoundManager.preload).toHaveBeenCalledWith("tap", source);
  });

  it("unloads the sound on unmount", () => {
    const source = { uri: "tap.mp3" };
    const { unmount } = renderHook(() => useSound("tap", source));

    unmount();

    expect(mockSoundManager.unload).toHaveBeenCalledWith("tap");
  });

  it("play calls SoundManager.play", async () => {
    const source = { uri: "tap.mp3" };
    const { result } = renderHook(() => useSound("tap", source));

    await act(async () => {
      await result.current.play();
    });

    expect(mockSoundManager.play).toHaveBeenCalledWith("tap");
  });

  it("stop calls SoundManager.stop", async () => {
    const source = { uri: "tap.mp3" };
    const { result } = renderHook(() => useSound("tap", source));

    await act(async () => {
      await result.current.stop();
    });

    expect(mockSoundManager.stop).toHaveBeenCalledWith("tap");
  });
});

describe("useSoundEffects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("preloads all effects on mount", () => {
    const effects = {
      tap: { uri: "tap.mp3" },
      ding: { uri: "ding.mp3" },
    };

    renderHook(() => useSoundEffects(effects));

    expect(mockSoundManager.preload).toHaveBeenCalledWith("tap", {
      uri: "tap.mp3",
    });
    expect(mockSoundManager.preload).toHaveBeenCalledWith("ding", {
      uri: "ding.mp3",
    });
  });

  it("unloads all effects on unmount", () => {
    const effects = {
      tap: { uri: "tap.mp3" },
      ding: { uri: "ding.mp3" },
    };

    const { unmount } = renderHook(() => useSoundEffects(effects));
    unmount();

    expect(mockSoundManager.unload).toHaveBeenCalledWith("tap");
    expect(mockSoundManager.unload).toHaveBeenCalledWith("ding");
  });

  it("play delegates to SoundManager.play", async () => {
    const effects = { tap: { uri: "tap.mp3" } };
    const { result } = renderHook(() => useSoundEffects(effects));

    await act(async () => {
      await result.current.play("tap");
    });

    expect(mockSoundManager.play).toHaveBeenCalledWith("tap");
  });

  it("stop delegates to SoundManager.stop", async () => {
    const effects = { tap: { uri: "tap.mp3" } };
    const { result } = renderHook(() => useSoundEffects(effects));

    await act(async () => {
      await result.current.stop("tap");
    });

    expect(mockSoundManager.stop).toHaveBeenCalledWith("tap");
  });
});
