import { useState, useEffect } from "react";
import {
  getDeviceDiagnostics,
  DeviceDiagnostics,
} from "@/utils/deviceInfo";

/**
 * Hook that fetches device diagnostics once on mount.
 */
export function useDeviceInfo(): DeviceDiagnostics | null {
  const [info, setInfo] = useState<DeviceDiagnostics | null>(null);

  useEffect(() => {
    getDeviceDiagnostics().then(setInfo);
  }, []);

  return info;
}
