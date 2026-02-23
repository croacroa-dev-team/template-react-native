import { useState, useEffect } from "react";
import { RemoteConfig } from "@/services/config/config-adapter";

/**
 * Hook to read a remote config value with real-time updates.
 */
export function useRemoteConfig<T>(
  key: string,
  defaultValue: T
): { value: T; isLoading: boolean } {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setValue(RemoteConfig.getValue(key, defaultValue));
    setIsLoading(false);

    const unsubscribe = RemoteConfig.onConfigUpdate((keys) => {
      if (keys.includes(key)) {
        setValue(RemoteConfig.getValue(key, defaultValue));
      }
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { value, isLoading };
}
