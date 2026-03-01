import { Audio } from "expo-av";
import { SoundManager } from "@/services/sound/sound-manager";

// Mock Logger so SoundManager doesn't blow up
jest.mock("@/services/logger/logger-adapter", () => ({
  Logger: {
    withContext: () => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
    }),
  },
}));

const mockCreateAsync = Audio.Sound.createAsync as jest.Mock;

describe("SoundManager", () => {
  let mockSound: {
    playAsync: jest.Mock;
    stopAsync: jest.Mock;
    setPositionAsync: jest.Mock;
    setVolumeAsync: jest.Mock;
    unloadAsync: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset SoundManager state between tests
    await SoundManager.unloadAll();

    // Re-create mock sound for each test
    mockSound = {
      playAsync: jest.fn().mockResolvedValue(undefined),
      stopAsync: jest.fn().mockResolvedValue(undefined),
      setPositionAsync: jest.fn().mockResolvedValue(undefined),
      setVolumeAsync: jest.fn().mockResolvedValue(undefined),
      unloadAsync: jest.fn().mockResolvedValue(undefined),
    };

    mockCreateAsync.mockResolvedValue({ sound: mockSound });
  });

  it("preload creates a sound via Audio.Sound.createAsync", async () => {
    const source = { uri: "test.mp3" };
    await SoundManager.preload("tap", source);

    expect(mockCreateAsync).toHaveBeenCalledWith(source, { volume: 1 });
    expect(SoundManager.isLoaded("tap")).toBe(true);
  });

  it("preload does not create duplicate if already loaded", async () => {
    const source = { uri: "test.mp3" };
    await SoundManager.preload("tap", source);
    await SoundManager.preload("tap", source);

    expect(mockCreateAsync).toHaveBeenCalledTimes(1);
  });

  it("play calls setPositionAsync(0) then playAsync", async () => {
    await SoundManager.preload("tap", { uri: "test.mp3" });
    await SoundManager.play("tap");

    expect(mockSound.setPositionAsync).toHaveBeenCalledWith(0);
    expect(mockSound.playAsync).toHaveBeenCalled();
  });

  it("stop calls stopAsync on the sound", async () => {
    await SoundManager.preload("tap", { uri: "test.mp3" });
    await SoundManager.stop("tap");

    expect(mockSound.stopAsync).toHaveBeenCalled();
  });

  it("setVolume clamps value between 0 and 1", async () => {
    await SoundManager.preload("tap", { uri: "test.mp3" });

    await SoundManager.setVolume(1.5);
    expect(SoundManager.getVolume()).toBe(1);
    expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(1);

    await SoundManager.setVolume(-0.5);
    expect(SoundManager.getVolume()).toBe(0);
    expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(0);

    await SoundManager.setVolume(0.5);
    expect(SoundManager.getVolume()).toBe(0.5);
    expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(0.5);
  });

  it("unloadAll unloads all sounds and clears the map", async () => {
    await SoundManager.preload("tap", { uri: "tap.mp3" });

    // Create a second mock sound for a second preload
    const mockSound2 = {
      playAsync: jest.fn().mockResolvedValue(undefined),
      stopAsync: jest.fn().mockResolvedValue(undefined),
      setPositionAsync: jest.fn().mockResolvedValue(undefined),
      setVolumeAsync: jest.fn().mockResolvedValue(undefined),
      unloadAsync: jest.fn().mockResolvedValue(undefined),
    };
    mockCreateAsync.mockResolvedValueOnce({ sound: mockSound2 });
    await SoundManager.preload("ding", { uri: "ding.mp3" });

    await SoundManager.unloadAll();

    expect(mockSound.unloadAsync).toHaveBeenCalled();
    expect(mockSound2.unloadAsync).toHaveBeenCalled();
    expect(SoundManager.isLoaded("tap")).toBe(false);
    expect(SoundManager.isLoaded("ding")).toBe(false);
  });

  it("isLoaded returns false for unknown keys", () => {
    expect(SoundManager.isLoaded("nonexistent")).toBe(false);
  });

  it("play with source auto-preloads if not yet loaded", async () => {
    await SoundManager.play("lazy", { uri: "lazy.mp3" });

    expect(mockCreateAsync).toHaveBeenCalledWith(
      { uri: "lazy.mp3" },
      expect.objectContaining({ volume: expect.any(Number) })
    );
    expect(mockSound.playAsync).toHaveBeenCalled();
  });
});
