/**
 * @fileoverview Screen orientation management hook
 * @module hooks/useScreenOrientation
 */

import { useState, useCallback, useEffect } from "react";
import * as ScreenOrientation from "expo-screen-orientation";

export type Orientation = "portrait" | "landscape" | "unknown";

function mapOrientation(
  orientation: ScreenOrientation.Orientation
): Orientation {
  switch (orientation) {
    case ScreenOrientation.Orientation.PORTRAIT_UP:
    case ScreenOrientation.Orientation.PORTRAIT_DOWN:
      return "portrait";
    case ScreenOrientation.Orientation.LANDSCAPE_LEFT:
    case ScreenOrientation.Orientation.LANDSCAPE_RIGHT:
      return "landscape";
    default:
      return "unknown";
  }
}

/**
 * Hook for reading and locking screen orientation.
 * Automatically unlocks orientation on unmount to avoid leaving the app stuck.
 */
export function useScreenOrientation() {
  const [orientation, setOrientation] = useState<Orientation>("portrait");

  useEffect(() => {
    // Read initial orientation
    ScreenOrientation.getOrientationAsync().then((o) =>
      setOrientation(mapOrientation(o))
    );

    const sub = ScreenOrientation.addOrientationChangeListener((event) => {
      setOrientation(mapOrientation(event.orientationInfo.orientation));
    });

    return () => {
      ScreenOrientation.removeOrientationChangeListener(sub);
      // Auto-unlock when the component using this hook unmounts
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

  const lockToPortrait = useCallback(async () => {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP
    );
  }, []);

  const lockToLandscape = useCallback(async () => {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE
    );
  }, []);

  const unlock = useCallback(async () => {
    await ScreenOrientation.unlockAsync();
  }, []);

  return { orientation, lockToPortrait, lockToLandscape, unlock };
}
