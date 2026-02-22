/**
 * @fileoverview WebSocket connection lifecycle hook
 * Manages a WebSocketManager instance with auto-connect on mount
 * and clean disconnect on unmount.
 * @module hooks/useWebSocket
 */

import { useEffect, useRef, useState, useCallback } from "react";

import { WebSocketManager } from "@/services/realtime/websocket-manager";
import type {
  ConnectionStatus,
  WebSocketConfig,
} from "@/services/realtime/types";

/**
 * Return type for the useWebSocket hook.
 */
export interface UseWebSocketReturn {
  /** Current connection status */
  status: ConnectionStatus;
  /** Send a typed message over the WebSocket */
  send: <T = unknown>(type: string, payload: T, channel?: string) => void;
  /** Manually open the WebSocket connection */
  connect: () => Promise<void>;
  /** Manually close the WebSocket connection */
  disconnect: () => void;
  /** The underlying WebSocketManager instance */
  manager: WebSocketManager;
}

/**
 * Hook for managing a WebSocket connection lifecycle.
 *
 * Creates a single `WebSocketManager` instance (persisted across re-renders via ref),
 * connects on mount, and disconnects on unmount. Tracks the connection status
 * in React state so the component re-renders on status changes.
 *
 * @param config - WebSocket configuration (url, auth, reconnect settings)
 * @returns Object with status, send, connect, disconnect, and the manager instance
 *
 * @example
 * ```tsx
 * function ChatScreen() {
 *   const { status, send, manager } = useWebSocket({
 *     url: 'wss://api.example.com/ws',
 *     getToken: async () => authStore.getState().token,
 *   });
 *
 *   const handleSend = () => {
 *     send('chat:message', { text: 'Hello!' }, 'room-1');
 *   };
 *
 *   return (
 *     <View>
 *       <Text>Status: {status}</Text>
 *       <Button onPress={handleSend} title="Send" />
 *     </View>
 *   );
 * }
 * ```
 */
export function useWebSocket(config: WebSocketConfig): UseWebSocketReturn {
  const managerRef = useRef<WebSocketManager | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  // Create the manager once and keep it stable across re-renders
  if (!managerRef.current) {
    managerRef.current = new WebSocketManager(config);
  }

  const manager = managerRef.current;

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = manager.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // Auto-connect on mount
    manager.connect();

    return () => {
      unsubscribe();
      manager.disconnect();
    };
  }, [manager]);

  const send = useCallback(
    <T = unknown>(type: string, payload: T, channel?: string) => {
      manager.send(type, payload, channel);
    },
    [manager]
  );

  const connect = useCallback(async () => {
    await manager.connect();
  }, [manager]);

  const disconnect = useCallback(() => {
    manager.disconnect();
  }, [manager]);

  return {
    status,
    send,
    connect,
    disconnect,
    manager,
  };
}
