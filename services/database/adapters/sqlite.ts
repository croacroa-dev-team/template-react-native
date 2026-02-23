/**
 * @fileoverview SQLite database adapter using expo-sqlite
 * @module services/database/adapters/sqlite
 */

import * as SQLite from "expo-sqlite";
import type { SQLiteBindParams } from "expo-sqlite";
import type { DatabaseAdapter, TransactionContext } from "../types";
import { migrations } from "../migrations";
import { DATABASE } from "@/constants/config";
import { Logger } from "@/services/logger/logger-adapter";

export class SQLiteAdapter implements DatabaseAdapter {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync(DATABASE.NAME);
    await this.runMigrations();
    Logger.info("Database initialized", { name: DATABASE.NAME });
  }

  private async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db)
      throw new Error("Database not initialized. Call initialize() first.");
    return this.db;
  }

  private async runMigrations(): Promise<void> {
    const db = await this.getDb();

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    const applied = await db.getAllAsync<{ version: number }>(
      "SELECT version FROM _migrations ORDER BY version"
    );
    const appliedVersions = new Set(applied.map((m) => m.version));

    const sorted = [...migrations].sort((a, b) => a.version - b.version);
    for (const migration of sorted) {
      if (!appliedVersions.has(migration.version)) {
        await db.execAsync(migration.up);
        await db.runAsync(
          "INSERT INTO _migrations (version, name) VALUES (?, ?)",
          [migration.version, migration.name]
        );
        Logger.info(
          `Migration applied: ${migration.name} (v${migration.version})`
        );
      }
    }
  }

  async execute(sql: string, params?: unknown[]): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(sql, (params ?? []) as SQLiteBindParams);
  }

  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const db = await this.getDb();
    return db.getAllAsync<T>(sql, (params ?? []) as SQLiteBindParams);
  }

  async insert(table: string, data: Record<string, unknown>): Promise<number> {
    const db = await this.getDb();
    const keys = Object.keys(data);
    const placeholders = keys.map(() => "?").join(", ");
    const values = Object.values(data);
    const result = await db.runAsync(
      `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`,
      values as SQLiteBindParams
    );
    return result.lastInsertRowId;
  }

  async update(
    table: string,
    data: Record<string, unknown>,
    where: string,
    params?: unknown[]
  ): Promise<number> {
    const db = await this.getDb();
    const sets = Object.keys(data)
      .map((k) => `${k} = ?`)
      .join(", ");
    const values = [...Object.values(data), ...(params ?? [])];
    const result = await db.runAsync(
      `UPDATE ${table} SET ${sets} WHERE ${where}`,
      values as SQLiteBindParams
    );
    return result.changes;
  }

  async delete(
    table: string,
    where: string,
    params?: unknown[]
  ): Promise<number> {
    const db = await this.getDb();
    const result = await db.runAsync(
      `DELETE FROM ${table} WHERE ${where}`,
      (params ?? []) as SQLiteBindParams
    );
    return result.changes;
  }

  async transaction<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T> {
    const db = await this.getDb();
    let result: T;
    await db.execAsync("BEGIN TRANSACTION");
    try {
      const txContext: TransactionContext = {
        execute: async (sql, params) => {
          await db.runAsync(sql, (params ?? []) as SQLiteBindParams);
        },
        query: async <R>(sql: string, params?: unknown[]) => {
          return db.getAllAsync<R>(sql, (params ?? []) as SQLiteBindParams);
        },
      };
      result = await fn(txContext);
      await db.execAsync("COMMIT");
    } catch (error) {
      await db.execAsync("ROLLBACK");
      throw error;
    }
    return result;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}
