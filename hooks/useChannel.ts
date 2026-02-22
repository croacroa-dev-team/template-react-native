/**
 * @fileoverview Channel subscription hook
 * Subscribes to a specific WebSocket channel and accumulates messages in state.
 * @module hooks/useChannel
 */

import { useEffect, useState, useCallback, useRef } from "react";

import { WebSocketManager } from "@/services/realtime/websocket-manager";
import type { WebSocketMessage } from "@/services/realtime/types";

/**
 * Return type for the useChannel hook.
 *
 * @typeParam T - The shape of the message payload
 */
export interface UseChannelReturn<T = unknown> {
  /** All messages received on this channel (oldest first) */
  messages: WebSocketMessage<T>[];
  /** The most recently received message, or null if none */
  lastMessage: WebSocketMessage<T> | null;
  /** Send a message to this channel */
  send: (type: string, payload: T) => void;
}

/**
 * Hook for subscribing to a WebSocket channel.
 *
 * Subscribes on mount, unsubscribes on unmount, and accumulates all received
 * messages in a state array. Provides a convenience `send` function that
 * automatically targets the subscribed channel.
 *
 * @typeParam T - The shape of the message payload
 * @param manager - The WebSocketManager instance (from useWebSocket)
 * @param channel - The channel name to subscribe to
 * @returns Object with messages array, lastMessage, and channel-scoped send
 *
 * @example
 * ```tsx
 * function ChatRoom({ roomId }: { roomId: string }) {
 *   const { manager } = useWebSocket({ url: WS_URL });
 *   const { messages, lastMessage, send } = useChannel<ChatPayload>(
 *     manager,
 *     `chat:${roomId}`
 *   );
 *
 *   const handleSend = (text: string) => {
 *     send('chat:message', { text, sender: currentUser.id });
 *   };
 *
 *   return (
 *     <FlatList
 *       data={messages}
 *       renderItem={({ item }) => <MessageBubble message={item} />}
 *     />
 *   );
 * }
 * ```
 */
export function useChannel<T = unknown>(
  manager: WebSocketManager,
  channel: string
): UseChannelReturn<T> {
  const [messages, setMessages] = useState<WebSocketMessage<T>[]>([]);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage<T> | null>(
    null
  );
  const channelRef = useRef(channel);
  channelRef.current = channel;

  useEffect(() => {
    // Reset messages when channel changes
    setMessages([]);
    setLastMessage(null);

    const unsubscribe = manager.subscribe<T>(channel, (message) => {
      setMessages((prev) => [...prev, message]);
      setLastMessage(message);
    });

    return () => {
      unsubscribe();
    };
  }, [manager, channel]);

  const send = useCallback(
    (type: string, payload: T) => {
      manager.send(type, payload, channelRef.current);
    },
    [manager]
  );

  return {
    messages,
    lastMessage,
    send,
  };
}
