import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { Logger } from "@/services/logger/logger-adapter";

interface AppLifecycleCallbacks {
  onForeground?: () => void;
  onBackground?: () => void;
  onInactive?: () => void;
}

/**
 * Hook that tracks app lifecycle transitions and logs breadcrumbs.
 */
export function useAppLifecycle(
  callbacks?: AppLifecycleCallbacks,
): { appState: AppStateStatus } {
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState,
  );
  const previousState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const handleChange = (nextState: AppStateStatus) => {
      const prev = previousState.current;

      Logger.addBreadcrumb(
        "lifecycle",
        `App state: ${prev} → ${nextState}`,
      );

      if (prev !== "active" && nextState === "active") {
        callbacks?.onForeground?.();
      } else if (prev === "active" && nextState === "background") {
        callbacks?.onBackground?.();
      } else if (nextState === "inactive") {
        callbacks?.onInactive?.();
      }

      previousState.current = nextState;
      setAppState(nextState);
    };

    const subscription = AppState.addEventListener("change", handleChange);
    return () => subscription.remove();
  }, [callbacks]);

  return { appState };
}
