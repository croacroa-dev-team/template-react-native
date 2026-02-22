/**
 * @fileoverview User presence tracking hook
 * Tracks online users in a channel via presence_join, presence_leave,
 * and presence_sync WebSocket messages.
 * @module hooks/usePresence
 */

import { useEffect, useState, useCallback, useRef } from "react";

import { WebSocketManager } from "@/services/realtime/websocket-manager";
import type { PresenceUser } from "@/services/realtime/types";

/**
 * Return type for the usePresence hook.
 */
export interface UsePresenceReturn {
  /** Array of currently online users in the channel */
  onlineUsers: PresenceUser[];
  /** Check whether a specific user is currently online */
  isUserOnline: (userId: string) => boolean;
}

/**
 * Hook for tracking user presence in a WebSocket channel.
 *
 * Subscribes to the given channel and listens for presence-related message types:
 * - `presence_join` — A user has come online
 * - `presence_leave` — A user has gone offline
 * - `presence_sync` — Full list of currently online users (requested on mount)
 *
 * On mount, sends a `presence_sync` request to the server so the initial state
 * is populated.
 *
 * @param manager - The WebSocketManager instance (from useWebSocket)
 * @param channel - The channel to track presence for
 * @returns Object with onlineUsers array and isUserOnline helper
 *
 * @example
 * ```tsx
 * function OnlineIndicator({ roomId }: { roomId: string }) {
 *   const { manager } = useWebSocket({ url: WS_URL });
 *   const { onlineUsers, isUserOnline } = usePresence(manager, `room:${roomId}`);
 *
 *   return (
 *     <View>
 *       <Text>{onlineUsers.length} online</Text>
 *       {onlineUsers.map((user) => (
 *         <Text key={user.id}>{user.name ?? user.id}</Text>
 *       ))}
 *     </View>
 *   );
 * }
 * ```
 */
export function usePresence(
  manager: WebSocketManager,
  channel: string
): UsePresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const usersRef = useRef<Map<string, PresenceUser>>(new Map());

  useEffect(() => {
    // Reset state when channel changes
    usersRef.current = new Map();
    setOnlineUsers([]);

    const unsubscribe = manager.subscribe(channel, (message) => {
      const { type, payload } = message;

      switch (type) {
        case "presence_join": {
          const user = payload as PresenceUser;
          usersRef.current.set(user.id, {
            ...user,
            lastSeen: user.lastSeen ?? new Date().toISOString(),
          });
          setOnlineUsers(Array.from(usersRef.current.values()));
          break;
        }

        case "presence_leave": {
          const { id } = payload as { id: string };
          usersRef.current.delete(id);
          setOnlineUsers(Array.from(usersRef.current.values()));
          break;
        }

        case "presence_sync": {
          const users = payload as PresenceUser[];
          usersRef.current = new Map(
            users.map((user) => [
              user.id,
              {
                ...user,
                lastSeen: user.lastSeen ?? new Date().toISOString(),
              },
            ])
          );
          setOnlineUsers(Array.from(usersRef.current.values()));
          break;
        }

        default:
          break;
      }
    });

    // Request a full sync from the server on mount
    manager.send("presence_sync", { channel }, channel);

    return () => {
      unsubscribe();
    };
  }, [manager, channel]);

  const isUserOnline = useCallback(
    (userId: string): boolean => {
      return usersRef.current.has(userId);
    },
    []
  );

  return {
    onlineUsers,
    isUserOnline,
  };
}
