/**
 * @fileoverview Mock remote config adapter for development/testing
 * @module services/config/adapters/mock
 */

import type { RemoteConfigAdapter } from "../types";

export class MockRemoteConfigAdapter implements RemoteConfigAdapter {
  private config: Record<string, unknown> = {};
  private listeners: Array<(keys: string[]) => void> = [];

  async initialize(): Promise<void> {
    // No-op for mock
  }

  getValue<T>(key: string, defaultValue: T): T {
    return (this.config[key] as T) ?? defaultValue;
  }

  getAll(): Record<string, unknown> {
    return { ...this.config };
  }

  async refresh(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  onConfigUpdate(callback: (keys: string[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /** Test helper: set a config value and notify listeners */
  setConfig(key: string, value: unknown): void {
    this.config[key] = value;
    this.listeners.forEach((l) => l([key]));
  }
}
