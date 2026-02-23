import { useState, useEffect } from "react";
import NetInfo, {
  NetInfoState,
  NetInfoStateType,
} from "@react-native-community/netinfo";

export type NetworkQuality =
  | "excellent"
  | "good"
  | "poor"
  | "offline";

interface NetworkQualityInfo {
  quality: NetworkQuality;
  connectionType: string;
  isMetered: boolean;
}

function deriveQuality(state: NetInfoState): NetworkQuality {
  if (!state.isConnected) return "offline";

  if (
    state.type === NetInfoStateType.wifi ||
    state.type === NetInfoStateType.ethernet
  ) {
    return "excellent";
  }

  if (state.type === NetInfoStateType.cellular) {
    const gen = (
      state.details as { cellularGeneration?: string }
    )?.cellularGeneration;
    if (gen === "5g" || gen === "4g") return "good";
    return "poor";
  }

  return "good";
}

/**
 * Hook that monitors network connection quality.
 */
export function useNetworkQuality(): NetworkQualityInfo {
  const [info, setInfo] = useState<NetworkQualityInfo>({
    quality: "excellent",
    connectionType: "unknown",
    isMetered: false,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setInfo({
        quality: deriveQuality(state),
        connectionType: state.type,
        isMetered:
          (
            state.details as {
              isConnectionExpensive?: boolean;
            }
          )?.isConnectionExpensive ?? false,
      });
    });

    return () => unsubscribe();
  }, []);

  return info;
}
