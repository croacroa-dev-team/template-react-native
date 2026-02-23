/**
 * @fileoverview Database facade
 * @module services/database/database-adapter
 */

import type { DatabaseAdapter, TransactionContext } from "./types";
import { SQLiteAdapter } from "./adapters/sqlite";
import { DATABASE } from "@/constants/config";

let adapter: DatabaseAdapter = new SQLiteAdapter();

export const Database = {
  setAdapter(newAdapter: DatabaseAdapter): void {
    adapter = newAdapter;
  },

  async initialize(): Promise<void> {
    if (!DATABASE.ENABLED) return;
    return adapter.initialize();
  },

  async execute(sql: string, params?: unknown[]): Promise<void> {
    return adapter.execute(sql, params);
  },

  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    return adapter.query<T>(sql, params);
  },

  async insert(
    table: string,
    data: Record<string, unknown>,
  ): Promise<number> {
    return adapter.insert(table, data);
  },

  async update(
    table: string,
    data: Record<string, unknown>,
    where: string,
    params?: unknown[],
  ): Promise<number> {
    return adapter.update(table, data, where, params);
  },

  async delete(
    table: string,
    where: string,
    params?: unknown[],
  ): Promise<number> {
    return adapter.delete(table, where, params);
  },

  async transaction<T>(
    fn: (tx: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return adapter.transaction(fn);
  },

  async close(): Promise<void> {
    return adapter.close();
  },
};
