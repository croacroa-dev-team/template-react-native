/**
 * @fileoverview React hooks for sound playback
 * @module hooks/useSound
 */

import { useEffect, useCallback, useState, useRef } from "react";
import { AVPlaybackSource } from "expo-av";
import { SoundManager } from "@/services/sound/sound-manager";

/**
 * Play a single sound with lifecycle management.
 * Automatically unloads the sound when the component unmounts.
 */
export function useSound(key: string, source: AVPlaybackSource) {
  const [isPlaying, setIsPlaying] = useState(false);
  const keyRef = useRef(key);
  keyRef.current = key;

  useEffect(() => {
    SoundManager.preload(key, source);
    return () => {
      SoundManager.unload(key);
    };
  }, [key, source]);

  const play = useCallback(async () => {
    setIsPlaying(true);
    await SoundManager.play(keyRef.current);
    setIsPlaying(false);
  }, []);

  const stop = useCallback(async () => {
    await SoundManager.stop(keyRef.current);
    setIsPlaying(false);
  }, []);

  return { play, stop, isPlaying };
}

/**
 * Manage multiple named sound effects at once.
 * Useful for game UIs with many distinct sounds (tap, correct, wrong, etc.)
 */
export function useSoundEffects(effects: Record<string, AVPlaybackSource>) {
  const effectsRef = useRef(effects);

  useEffect(() => {
    const entries = Object.entries(effectsRef.current);
    entries.forEach(([key, source]) => SoundManager.preload(key, source));

    return () => {
      entries.forEach(([key]) => SoundManager.unload(key));
    };
  }, []);

  const play = useCallback(async (key: string) => {
    await SoundManager.play(key);
  }, []);

  const stop = useCallback(async (key: string) => {
    await SoundManager.stop(key);
  }, []);

  return { play, stop };
}
