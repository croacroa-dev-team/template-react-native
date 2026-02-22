/**
 * @fileoverview WebSocket and real-time communication type definitions
 * Provides shared types for the WebSocket manager and React hooks.
 * @module services/realtime/types
 */

/**
 * Possible states of a WebSocket connection.
 * - 'connecting': Initial connection attempt in progress
 * - 'connected': Connection is open and ready to send/receive
 * - 'disconnected': Connection is closed (either intentionally or due to error)
 * - 'reconnecting': Attempting to re-establish a lost connection
 */
export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

/**
 * A typed WebSocket message with metadata.
 * All messages sent or received through the WebSocket system use this envelope.
 *
 * @typeParam T - The shape of the message payload
 */
export interface WebSocketMessage<T = unknown> {
  /** Message type identifier (e.g. 'chat:message', 'presence_join') */
  type: string;
  /** Optional channel this message belongs to */
  channel?: string;
  /** The message payload */
  payload: T;
  /** ISO 8601 timestamp of when the message was created */
  timestamp: string;
}

/**
 * Configuration for the WebSocket connection.
 */
export interface WebSocketConfig {
  /** WebSocket server URL (ws:// or wss://) */
  url: string;
  /**
   * Async function that returns an auth token.
   * If provided, the token is appended as a query parameter on connect.
   */
  getToken?: () => Promise<string | null>;
  /**
   * Whether to automatically reconnect on unexpected disconnection.
   * @default true
   */
  autoReconnect?: boolean;
  /**
   * Maximum number of reconnection attempts before giving up.
   * @default 10
   */
  maxReconnectAttempts?: number;
  /**
   * Base delay in milliseconds for exponential backoff reconnection.
   * The actual delay is `min(baseDelay * 2^attempt, 30000)`.
   * @default 1000
   */
  reconnectBaseDelay?: number;
  /**
   * Interval in milliseconds between heartbeat (ping) messages.
   * @default 30000
   */
  heartbeatInterval?: number;
  /**
   * Timeout in milliseconds for the initial connection attempt.
   * @default 10000
   */
  connectionTimeout?: number;
}

/**
 * Handler callback for typed WebSocket messages.
 *
 * @typeParam T - The shape of the message payload
 */
export type MessageHandler<T = unknown> = (
  message: WebSocketMessage<T>
) => void;

/**
 * Handler callback for connection status changes.
 */
export type StatusHandler = (status: ConnectionStatus) => void;

/**
 * User presence information for real-time presence tracking.
 */
export interface PresenceUser {
  /** Unique user identifier */
  id: string;
  /** Optional display name */
  name?: string;
  /** ISO 8601 timestamp of the user's last known activity */
  lastSeen: string;
}
