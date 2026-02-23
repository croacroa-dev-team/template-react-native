import { useMemo } from "react";
import { Logger } from "@/services/logger/logger-adapter";

/**
 * Hook that returns a scoped logger instance.
 * The component name is automatically included in all log context.
 */
export function useLogger(componentName: string) {
  return useMemo(
    () => Logger.withContext({ component: componentName }),
    [componentName],
  );
}
