/**
 * @fileoverview Database type definitions
 * @module services/database/types
 */

export interface TransactionContext {
  execute(sql: string, params?: unknown[]): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
}

export interface DatabaseAdapter {
  initialize(): Promise<void>;
  execute(sql: string, params?: unknown[]): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  insert(table: string, data: Record<string, unknown>): Promise<number>;
  update(
    table: string,
    data: Record<string, unknown>,
    where: string,
    params?: unknown[]
  ): Promise<number>;
  delete(table: string, where: string, params?: unknown[]): Promise<number>;
  transaction<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export interface Migration {
  version: number;
  name: string;
  up: string;
  down: string;
}
