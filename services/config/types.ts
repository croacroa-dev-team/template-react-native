/**
 * @fileoverview Remote config type definitions
 * @module services/config/types
 */

export interface RemoteConfigAdapter {
  initialize(): Promise<void>;
  getValue<T>(key: string, defaultValue: T): T;
  getAll(): Record<string, unknown>;
  refresh(): Promise<void>;
  onConfigUpdate(callback: (keys: string[]) => void): () => void;
}
