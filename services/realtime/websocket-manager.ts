/**
 * @fileoverview WebSocket connection manager with auto-reconnect
 * Provides a robust WebSocket client with heartbeat, message queuing,
 * channel subscriptions, and exponential backoff reconnection.
 * @module services/realtime/websocket-manager
 */

import type {
  ConnectionStatus,
  WebSocketConfig,
  WebSocketMessage,
  MessageHandler,
  StatusHandler,
} from "./types";

/** Maximum reconnect delay cap in milliseconds */
const MAX_RECONNECT_DELAY = 30_000;

/**
 * WebSocket connection manager.
 *
 * Manages a single WebSocket connection with support for:
 * - Automatic reconnection with exponential backoff
 * - Heartbeat keep-alive messages
 * - Message queuing when disconnected
 * - Channel-based subscriptions
 * - Global and per-channel message handlers
 * - Status change listeners
 *
 * @example
 * ```ts
 * import { WebSocketManager } from '@/services/realtime/websocket-manager';
 *
 * const manager = new WebSocketManager({
 *   url: 'wss://api.example.com/ws',
 *   getToken: async () => authStore.getState().token,
 * });
 *
 * manager.onStatusChange((status) => console.log('WS status:', status));
 * manager.connect();
 *
 * const unsub = manager.subscribe('chat:room-1', (msg) => {
 *   console.log('New message:', msg.payload);
 * });
 *
 * manager.send('chat:message', { text: 'Hello!' }, 'chat:room-1');
 *
 * // Later: cleanup
 * unsub();
 * manager.disconnect();
 * ```
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private status: ConnectionStatus = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private connectionTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private shouldReconnect = true;

  /** Per-channel message handlers */
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  /** Global message handlers (receive all messages) */
  private globalHandlers: Set<MessageHandler> = new Set();
  /** Connection status change handlers */
  private statusHandlers: Set<StatusHandler> = new Set();

  constructor(config: WebSocketConfig) {
    this.config = {
      url: config.url,
      getToken: config.getToken ?? (async () => null),
      autoReconnect: config.autoReconnect ?? true,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      reconnectBaseDelay: config.reconnectBaseDelay ?? 1000,
      heartbeatInterval: config.heartbeatInterval ?? 30_000,
      connectionTimeout: config.connectionTimeout ?? 10_000,
    };
  }

  /**
   * Open the WebSocket connection.
   * If a `getToken` function was provided in the config, the token is appended
   * as a `token` query parameter on the connection URL.
   */
  async connect(): Promise<void> {
    if (this.status === "connecting" || this.status === "connected") {
      return;
    }

    this.shouldReconnect = this.config.autoReconnect;
    this.setStatus("connecting");

    try {
      let url = this.config.url;

      // Inject auth token as query param if available
      const token = await this.config.getToken();
      if (token) {
        const separator = url.includes("?") ? "&" : "?";
        url = `${url}${separator}token=${encodeURIComponent(token)}`;
      }

      this.ws = new WebSocket(url);

      // Set a connection timeout
      this.connectionTimeoutTimer = setTimeout(() => {
        if (this.status === "connecting") {
          console.warn("[WebSocketManager] Connection timeout");
          this.ws?.close();
          this.attemptReconnect();
        }
      }, this.config.connectionTimeout);

      this.ws.onopen = () => {
        this.clearConnectionTimeout();
        this.reconnectAttempts = 0;
        this.setStatus("connected");
        this.startHeartbeat();
        this.flushQueue();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.handleMessage(event);
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.clearConnectionTimeout();
        if (this.status !== "disconnected") {
          this.setStatus("disconnected");
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error: Event) => {
        console.error("[WebSocketManager] WebSocket error:", error);
        // onclose will fire after onerror, so reconnect logic is handled there
      };
    } catch (error) {
      console.error("[WebSocketManager] Failed to connect:", error);
      this.setStatus("disconnected");
      this.attemptReconnect();
    }
  }

  /**
   * Gracefully close the WebSocket connection.
   * Disables auto-reconnect and clears all timers.
   */
  disconnect(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    this.stopHeartbeat();
    this.clearConnectionTimeout();

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }

    this.setStatus("disconnected");
  }

  /**
   * Send a typed message over the WebSocket.
   * If the connection is not open, the message is queued and sent
   * once the connection is (re)established.
   *
   * @typeParam T - The shape of the message payload
   * @param type - Message type identifier
   * @param payload - The message payload
   * @param channel - Optional channel to target
   */
  send<T = unknown>(type: string, payload: T, channel?: string): void {
    const message: WebSocketMessage<T> = {
      type,
      channel,
      payload,
      timestamp: new Date().toISOString(),
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message as WebSocketMessage);
    }
  }

  /**
   * Subscribe to messages on a specific channel.
   * Sends a `subscribe` message to the server and registers a local handler.
   *
   * @param channel - The channel name to subscribe to
   * @param handler - Callback invoked for each message on this channel
   * @returns Unsubscribe function that removes the handler and sends an `unsubscribe` message
   */
  subscribe<T = unknown>(
    channel: string,
    handler: MessageHandler<T>
  ): () => void {
    if (!this.messageHandlers.has(channel)) {
      this.messageHandlers.set(channel, new Set());
    }

    const handlers = this.messageHandlers.get(channel)!;
    handlers.add(handler as MessageHandler);

    // Notify the server about the subscription
    this.send("subscribe", { channel });

    return () => {
      handlers.delete(handler as MessageHandler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(channel);
      }
      // Notify the server about the unsubscription
      this.send("unsubscribe", { channel });
    };
  }

  /**
   * Register a global message handler that receives all messages
   * regardless of channel.
   *
   * @param handler - Callback invoked for every incoming message
   * @returns Unsubscribe function that removes the handler
   */
  onMessage<T = unknown>(handler: MessageHandler<T>): () => void {
    this.globalHandlers.add(handler as MessageHandler);
    return () => {
      this.globalHandlers.delete(handler as MessageHandler);
    };
  }

  /**
   * Register a handler for connection status changes.
   *
   * @param handler - Callback invoked with the new status
   * @returns Unsubscribe function that removes the handler
   */
  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  /**
   * Get the current connection status.
   *
   * @returns The current ConnectionStatus
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  // =========================================
  // Private methods
  // =========================================

  /**
   * Update the connection status and notify all status handlers.
   */
  private setStatus(newStatus: ConnectionStatus): void {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.statusHandlers.forEach((handler) => {
      try {
        handler(newStatus);
      } catch (error) {
        console.error("[WebSocketManager] Status handler error:", error);
      }
    });
  }

  /**
   * Validate that parsed data conforms to the WebSocketMessage shape.
   */
  private isValidMessage(data: unknown): data is WebSocketMessage {
    return (
      typeof data === "object" &&
      data !== null &&
      typeof (data as Record<string, unknown>).type === "string" &&
      "payload" in data
    );
  }

  /**
   * Parse and dispatch an incoming WebSocket message to the appropriate handlers.
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const parsed: unknown = JSON.parse(event.data as string);

      if (!this.isValidMessage(parsed)) {
        console.warn("[WebSocketManager] Skipping invalid message:", parsed);
        return;
      }

      const message: WebSocketMessage = parsed;

      // Ignore heartbeat acknowledgements
      if (message.type === "pong") {
        return;
      }

      // Dispatch to global handlers
      this.globalHandlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error(
            "[WebSocketManager] Global message handler error:",
            error
          );
        }
      });

      // Dispatch to channel-specific handlers
      if (message.channel) {
        const channelHandlers = this.messageHandlers.get(message.channel);
        if (channelHandlers) {
          channelHandlers.forEach((handler) => {
            try {
              handler(message);
            } catch (error) {
              console.error(
                "[WebSocketManager] Channel message handler error:",
                error
              );
            }
          });
        }
      }
    } catch (error) {
      console.error("[WebSocketManager] Failed to parse message:", error);
    }
  }

  /**
   * Attempt to reconnect using exponential backoff.
   * The delay doubles with each attempt, capped at MAX_RECONNECT_DELAY.
   */
  private attemptReconnect(): void {
    if (!this.shouldReconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.warn(
        `[WebSocketManager] Max reconnect attempts (${this.config.maxReconnectAttempts}) reached`
      );
      this.setStatus("disconnected");
      return;
    }

    this.setStatus("reconnecting");

    const delay = Math.min(
      this.config.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY
    );

    console.log(
      `[WebSocketManager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.config.maxReconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Start sending periodic heartbeat (ping) messages to keep the connection alive.
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send("ping", {});
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop the heartbeat timer.
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Send all queued messages that were buffered while disconnected.
   */
  private flushQueue(): void {
    if (this.messageQueue.length === 0) return;

    const queue = [...this.messageQueue];
    this.messageQueue = [];

    queue.forEach((message) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      } else {
        // Re-queue if connection was lost during flush
        this.messageQueue.push(message);
      }
    });
  }

  /**
   * Clear the reconnect timer.
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Clear the connection timeout timer.
   */
  private clearConnectionTimeout(): void {
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }
  }
}
