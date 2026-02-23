/**
 * @fileoverview Mock database adapter for testing
 * @module services/database/adapters/mock
 */

import type { DatabaseAdapter, TransactionContext } from "../types";

export class MockDatabaseAdapter implements DatabaseAdapter {
  private tables: Record<string, Record<string, unknown>[]> = {};
  private nextId = 1;

  async initialize(): Promise<void> {
    // No-op
  }

  async execute(
    _sql: string,
    _params?: unknown[],
  ): Promise<void> {
    // No-op for mock
  }

  async query<T>(
    _sql: string,
    _params?: unknown[],
  ): Promise<T[]> {
    return [] as T[];
  }

  async insert(
    table: string,
    data: Record<string, unknown>,
  ): Promise<number> {
    if (!this.tables[table]) this.tables[table] = [];
    const id = this.nextId++;
    this.tables[table].push({ id, ...data });
    return id;
  }

  async update(
    table: string,
    data: Record<string, unknown>,
    _where: string,
    _params?: unknown[],
  ): Promise<number> {
    if (!this.tables[table]) return 0;
    this.tables[table] = this.tables[table].map((row) => ({
      ...row,
      ...data,
    }));
    return this.tables[table].length;
  }

  async delete(
    table: string,
    _where: string,
    _params?: unknown[],
  ): Promise<number> {
    const count = this.tables[table]?.length ?? 0;
    this.tables[table] = [];
    return count;
  }

  async transaction<T>(
    fn: (tx: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return fn({
      execute: async () => {},
      query: async () => [],
    });
  }

  async close(): Promise<void> {
    this.tables = {};
  }

  /** Test helper: get all rows from a table */
  getTable(name: string): Record<string, unknown>[] {
    return this.tables[name] ?? [];
  }
}
