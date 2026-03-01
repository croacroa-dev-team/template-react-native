/**
 * @fileoverview Singleton sound manager using expo-av
 * @module services/sound/sound-manager
 */

import { Audio, AVPlaybackSource } from "expo-av";
import { Logger } from "@/services/logger/logger-adapter";

const log = Logger.withContext({ module: "SoundManager" });

export class SoundManager {
  private static sounds = new Map<string, Audio.Sound>();
  private static volume = 1.0;

  /**
   * Preload a sound so it can be played instantly later.
   */
  static async preload(key: string, source: AVPlaybackSource): Promise<void> {
    try {
      if (this.sounds.has(key)) return;
      const { sound } = await Audio.Sound.createAsync(source, {
        volume: this.volume,
      });
      this.sounds.set(key, sound);
      log.debug(`Preloaded sound: ${key}`);
    } catch (error) {
      log.error(`Failed to preload sound: ${key}`, error as Error);
    }
  }

  /**
   * Play a preloaded sound by key. If not preloaded, loads from source first.
   */
  static async play(key: string, source?: AVPlaybackSource): Promise<void> {
    try {
      let sound = this.sounds.get(key);
      if (!sound && source) {
        await this.preload(key, source);
        sound = this.sounds.get(key);
      }
      if (!sound) {
        log.warn(`Sound not found: ${key}`);
        return;
      }
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (error) {
      log.error(`Failed to play sound: ${key}`, error as Error);
    }
  }

  /**
   * Stop a currently playing sound.
   */
  static async stop(key: string): Promise<void> {
    try {
      const sound = this.sounds.get(key);
      if (sound) {
        await sound.stopAsync();
      }
    } catch (error) {
      log.error(`Failed to stop sound: ${key}`, error as Error);
    }
  }

  /**
   * Set the global volume for all sounds (0.0 to 1.0).
   */
  static async setVolume(volume: number): Promise<void> {
    this.volume = Math.max(0, Math.min(1, volume));
    const promises = Array.from(this.sounds.values()).map((sound) =>
      sound.setVolumeAsync(this.volume).catch(() => {})
    );
    await Promise.all(promises);
  }

  /** Get the current global volume. */
  static getVolume(): number {
    return this.volume;
  }

  /**
   * Unload all sounds and release resources.
   */
  static async unloadAll(): Promise<void> {
    const promises = Array.from(this.sounds.values()).map((sound) =>
      sound.unloadAsync().catch(() => {})
    );
    await Promise.all(promises);
    this.sounds.clear();
    log.debug("All sounds unloaded");
  }

  /**
   * Unload a single sound by key.
   */
  static async unload(key: string): Promise<void> {
    const sound = this.sounds.get(key);
    if (sound) {
      await sound.unloadAsync().catch(() => {});
      this.sounds.delete(key);
    }
  }

  /** Check if a sound is loaded. */
  static isLoaded(key: string): boolean {
    return this.sounds.has(key);
  }
}
