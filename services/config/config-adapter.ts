/**
 * @fileoverview Remote config facade
 * @module services/config/config-adapter
 */

import type { RemoteConfigAdapter } from "./types";
import { MockRemoteConfigAdapter } from "./adapters/mock";

let adapter: RemoteConfigAdapter = new MockRemoteConfigAdapter();

export const RemoteConfig = {
  setAdapter(newAdapter: RemoteConfigAdapter): void {
    adapter = newAdapter;
  },

  async initialize(): Promise<void> {
    return adapter.initialize();
  },

  getValue<T>(key: string, defaultValue: T): T {
    return adapter.getValue(key, defaultValue);
  },

  getAll(): Record<string, unknown> {
    return adapter.getAll();
  },

  async refresh(): Promise<void> {
    return adapter.refresh();
  },

  onConfigUpdate(callback: (keys: string[]) => void): () => void {
    return adapter.onConfigUpdate(callback);
  },
};
