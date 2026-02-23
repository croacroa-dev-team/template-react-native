import React, {
  useState,
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import { DebugMenu } from "./DebugMenu";
import { IS_DEV } from "@/constants/config";

interface DebugMenuContextValue {
  open: () => void;
}

const DebugMenuContext = createContext<DebugMenuContextValue>({
  open: () => {},
});

/**
 * Hook to programmatically open the debug menu.
 */
export function useDebugMenu(): DebugMenuContextValue {
  return useContext(DebugMenuContext);
}

/**
 * Provider that wraps the app and provides the debug menu in dev mode.
 * In production, this is a pass-through (no-op).
 */
export function DebugMenuProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  if (!IS_DEV) {
    return <>{children}</>;
  }

  return (
    <DebugMenuContext.Provider value={{ open }}>
      {children}
      <DebugMenu visible={visible} onClose={close} />
    </DebugMenuContext.Provider>
  );
}
