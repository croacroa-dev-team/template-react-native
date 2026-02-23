/**
 * @fileoverview Database migration definitions
 * @module services/database/migrations
 */

import type { Migration } from "./types";

/**
 * Register new migrations by adding them to this array.
 * Migrations must have strictly increasing version numbers.
 */
export const migrations: Migration[] = [
  {
    version: 1,
    name: "initial_schema",
    up: `
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
    down: `DROP TABLE IF EXISTS _migrations;`,
  },
];
