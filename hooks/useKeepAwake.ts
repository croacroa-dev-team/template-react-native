/**
 * @fileoverview Hook to prevent the screen from sleeping
 * @module hooks/useKeepAwake
 */

import { useEffect } from "react";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

const TAG = "game-session";

/**
 * Keep the screen awake while a component is mounted.
 * @param active - Whether to keep the screen awake (defaults to true). Pass false to deactivate.
 */
export function useKeepAwake(active = true): void {
  useEffect(() => {
    if (!active) return;

    activateKeepAwakeAsync(TAG).catch(() => {});

    return () => {
      deactivateKeepAwake(TAG);
    };
  }, [active]);
}
