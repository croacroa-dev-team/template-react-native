# Phase 9: Production Hardening — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 15 production-critical features: structured logging, config management, app lifecycle, device info, SQLite database, retry/circuit breaker, session management, request interceptors, debug menu, PII scrubbing, permission rationale, network quality, analytics session, build metadata, and version gate.

**Architecture:** All new services follow the existing adapter pattern (types.ts + facade + mock adapter). New hooks wrap services. Config goes in `constants/config.ts`. Barrel exports in index.ts files. i18n keys in all 5 locales.

**Tech Stack:** expo-sqlite, expo-application, expo-device (already present), expo-constants

**Design doc:** `docs/plans/2026-02-23-phase9-production-hardening-design.md`

---

## Task 1: Install Dependencies & Config Scaffolding

**Files:**
- Modify: `package.json` (version bump 3.2.0 → 3.3.0)
- Modify: `constants/config.ts` (add LOGGER, DATABASE, RETRY, CIRCUIT_BREAKER, SESSION sections)

**Step 1: Install expo-sqlite and expo-application**

```bash
npx expo install expo-sqlite expo-application
```

**Step 2: Bump version in package.json**

Change `"version": "3.2.0"` to `"version": "3.3.0"`.

**Step 3: Add config sections to `constants/config.ts`**

Add before the closing of the file (after SECURITY block at line 136):

```typescript
// Logger Configuration
export const LOGGER = {
  ENABLED: true,
  MIN_LEVEL: IS_DEV ? 'debug' : 'warn',
  MAX_BREADCRUMBS: 100,
} as const;

// Database Configuration
export const DATABASE = {
  ENABLED: true,
  NAME: 'app.db',
  VERSION: 1,
} as const;

// Retry Configuration
export const RETRY = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY_MS: 1000,
  MAX_DELAY_MS: 30000,
  JITTER: true,
} as const;

// Circuit Breaker Configuration
export const CIRCUIT_BREAKER = {
  THRESHOLD: 5,
  RESET_TIMEOUT_MS: 30000,
} as const;

// Session Configuration
export const SESSION = {
  ENABLED: true,
  TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  WARNING_BEFORE_MS: 2 * 60 * 1000, // Warn 2 min before
} as const;
```

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add package.json constants/config.ts
git commit -m "chore: install deps and add Phase 9 config sections"
```

---

## Task 2: Logger Service

**Files:**
- Create: `services/logger/types.ts`
- Create: `services/logger/logger-adapter.ts`
- Create: `services/logger/adapters/console.ts`
- Create: `hooks/useLogger.ts`
- Modify: `services/index.ts` (add Logger exports)
- Modify: `hooks/index.ts` (add useLogger export)

**Step 1: Create `services/logger/types.ts`**

```typescript
/**
 * @fileoverview Logger type definitions
 * @module services/logger/types
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface Breadcrumb {
  timestamp: number;
  category: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface LoggerAdapter {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  fatal(message: string, error?: Error, context?: Record<string, unknown>): void;
  addBreadcrumb(category: string, message: string, data?: Record<string, unknown>): void;
  getBreadcrumbs(): Breadcrumb[];
  setContext(key: string, value: unknown): void;
  clearContext(): void;
}
```

**Step 2: Create `services/logger/adapters/console.ts`**

```typescript
/**
 * @fileoverview Console-based logger adapter
 * @module services/logger/adapters/console
 */

import type { LoggerAdapter, LogLevel, Breadcrumb } from '../types';
import { LOGGER } from '@/constants/config';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

export class ConsoleLoggerAdapter implements LoggerAdapter {
  private breadcrumbs: Breadcrumb[] = [];
  private context: Record<string, unknown> = {};
  private minLevel: LogLevel;
  private maxBreadcrumbs: number;

  constructor(minLevel?: LogLevel, maxBreadcrumbs?: number) {
    this.minLevel = minLevel ?? (LOGGER.MIN_LEVEL as LogLevel);
    this.maxBreadcrumbs = maxBreadcrumbs ?? LOGGER.MAX_BREADCRUMBS;
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[this.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const merged = { ...this.context, ...context };
    const contextStr = Object.keys(merged).length > 0 ? ` ${JSON.stringify(merged)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;
    console.log(this.formatMessage('debug', message, context));
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (!this.shouldLog('error')) return;
    const ctx = error ? { ...context, errorMessage: error.message, stack: error.stack } : context;
    console.error(this.formatMessage('error', message, ctx));
  }

  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (!this.shouldLog('fatal')) return;
    const ctx = error ? { ...context, errorMessage: error.message, stack: error.stack } : context;
    console.error(this.formatMessage('fatal', message, ctx));
  }

  addBreadcrumb(category: string, message: string, data?: Record<string, unknown>): void {
    this.breadcrumbs.push({
      timestamp: Date.now(),
      category,
      message,
      data,
    });
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  setContext(key: string, value: unknown): void {
    this.context[key] = value;
  }

  clearContext(): void {
    this.context = {};
  }
}
```

**Step 3: Create `services/logger/logger-adapter.ts`**

```typescript
/**
 * @fileoverview Logger facade — singleton that delegates to the active adapter
 * @module services/logger/logger-adapter
 */

import type { LoggerAdapter, Breadcrumb } from './types';
import { ConsoleLoggerAdapter } from './adapters/console';
import { LOGGER } from '@/constants/config';

let adapter: LoggerAdapter = new ConsoleLoggerAdapter();

/**
 * Central Logger facade.
 * Module-level singleton gated by LOGGER.ENABLED.
 */
export const Logger = {
  setAdapter(newAdapter: LoggerAdapter): void {
    adapter = newAdapter;
  },

  debug(message: string, context?: Record<string, unknown>): void {
    if (!LOGGER.ENABLED) return;
    adapter.debug(message, context);
  },

  info(message: string, context?: Record<string, unknown>): void {
    if (!LOGGER.ENABLED) return;
    adapter.info(message, context);
  },

  warn(message: string, context?: Record<string, unknown>): void {
    if (!LOGGER.ENABLED) return;
    adapter.warn(message, context);
  },

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (!LOGGER.ENABLED) return;
    adapter.error(message, error, context);
  },

  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (!LOGGER.ENABLED) return;
    adapter.fatal(message, error, context);
  },

  addBreadcrumb(category: string, message: string, data?: Record<string, unknown>): void {
    if (!LOGGER.ENABLED) return;
    adapter.addBreadcrumb(category, message, data);
  },

  getBreadcrumbs(): Breadcrumb[] {
    return adapter.getBreadcrumbs();
  },

  setContext(key: string, value: unknown): void {
    adapter.setContext(key, value);
  },

  clearContext(): void {
    adapter.clearContext();
  },

  /**
   * Returns a scoped logger that merges the given context into every call.
   */
  withContext(ctx: Record<string, unknown>) {
    return {
      debug: (msg: string, extra?: Record<string, unknown>) =>
        Logger.debug(msg, { ...ctx, ...extra }),
      info: (msg: string, extra?: Record<string, unknown>) =>
        Logger.info(msg, { ...ctx, ...extra }),
      warn: (msg: string, extra?: Record<string, unknown>) =>
        Logger.warn(msg, { ...ctx, ...extra }),
      error: (msg: string, err?: Error, extra?: Record<string, unknown>) =>
        Logger.error(msg, err, { ...ctx, ...extra }),
      fatal: (msg: string, err?: Error, extra?: Record<string, unknown>) =>
        Logger.fatal(msg, err, { ...ctx, ...extra }),
    };
  },
};
```

**Step 4: Create `hooks/useLogger.ts`**

```typescript
import { useMemo } from 'react';
import { Logger } from '@/services/logger/logger-adapter';

/**
 * Hook that returns a scoped logger instance.
 * The component name is automatically included in all log context.
 */
export function useLogger(componentName: string) {
  return useMemo(() => Logger.withContext({ component: componentName }), [componentName]);
}
```

**Step 5: Add barrel exports**

In `services/index.ts`, add at the end:

```typescript
export { Logger } from "./logger/logger-adapter";
export { ConsoleLoggerAdapter } from "./logger/adapters/console";
export type { LoggerAdapter, LogLevel, Breadcrumb } from "./logger/types";
```

In `hooks/index.ts`, add at the end:

```typescript
export { useLogger } from "./useLogger";
```

**Step 6: Verify and commit**

```bash
npx tsc --noEmit
git add services/logger/ hooks/useLogger.ts services/index.ts hooks/index.ts
git commit -m "feat: add Logger service with adapter pattern"
```

---

## Task 3: Config Management Service

**Files:**
- Create: `services/config/types.ts`
- Create: `services/config/config-adapter.ts`
- Create: `services/config/adapters/mock.ts`
- Create: `hooks/useRemoteConfig.ts`
- Modify: `services/index.ts`
- Modify: `hooks/index.ts`

**Step 1: Create `services/config/types.ts`**

```typescript
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
```

**Step 2: Create `services/config/adapters/mock.ts`**

```typescript
/**
 * @fileoverview Mock remote config adapter for development/testing
 * @module services/config/adapters/mock
 */

import type { RemoteConfigAdapter } from '../types';

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
    // Simulate refresh delay
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
```

**Step 3: Create `services/config/config-adapter.ts`**

```typescript
/**
 * @fileoverview Remote config facade
 * @module services/config/config-adapter
 */

import type { RemoteConfigAdapter } from './types';
import { MockRemoteConfigAdapter } from './adapters/mock';

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
```

**Step 4: Create `hooks/useRemoteConfig.ts`**

```typescript
import { useState, useEffect } from 'react';
import { RemoteConfig } from '@/services/config/config-adapter';

/**
 * Hook to read a remote config value with real-time updates.
 */
export function useRemoteConfig<T>(key: string, defaultValue: T): { value: T; isLoading: boolean } {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setValue(RemoteConfig.getValue(key, defaultValue));
    setIsLoading(false);

    const unsubscribe = RemoteConfig.onConfigUpdate((keys) => {
      if (keys.includes(key)) {
        setValue(RemoteConfig.getValue(key, defaultValue));
      }
    });

    return unsubscribe;
  }, [key, defaultValue]);

  return { value, isLoading };
}
```

**Step 5: Add barrel exports**

In `services/index.ts`:
```typescript
export { RemoteConfig } from "./config/config-adapter";
export { MockRemoteConfigAdapter } from "./config/adapters/mock";
export type { RemoteConfigAdapter } from "./config/types";
```

In `hooks/index.ts`:
```typescript
export { useRemoteConfig } from "./useRemoteConfig";
```

**Step 6: Verify and commit**

```bash
npx tsc --noEmit
git add services/config/ hooks/useRemoteConfig.ts services/index.ts hooks/index.ts
git commit -m "feat: add RemoteConfig service with mock adapter"
```

---

## Task 4: App Lifecycle Hook

**Files:**
- Create: `hooks/useAppLifecycle.ts`
- Modify: `hooks/index.ts`

**Step 1: Create `hooks/useAppLifecycle.ts`**

```typescript
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Logger } from '@/services/logger/logger-adapter';

interface AppLifecycleCallbacks {
  onForeground?: () => void;
  onBackground?: () => void;
  onInactive?: () => void;
}

/**
 * Hook that tracks app lifecycle transitions and logs breadcrumbs.
 */
export function useAppLifecycle(callbacks?: AppLifecycleCallbacks): { appState: AppStateStatus } {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const previousState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const handleChange = (nextState: AppStateStatus) => {
      const prev = previousState.current;

      Logger.addBreadcrumb('lifecycle', `App state: ${prev} → ${nextState}`);

      if (prev !== 'active' && nextState === 'active') {
        callbacks?.onForeground?.();
      } else if (prev === 'active' && nextState === 'background') {
        callbacks?.onBackground?.();
      } else if (nextState === 'inactive') {
        callbacks?.onInactive?.();
      }

      previousState.current = nextState;
      setAppState(nextState);
    };

    const subscription = AppState.addEventListener('change', handleChange);
    return () => subscription.remove();
  }, [callbacks]);

  return { appState };
}
```

**Step 2: Add to `hooks/index.ts`:**

```typescript
export { useAppLifecycle } from "./useAppLifecycle";
```

**Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add hooks/useAppLifecycle.ts hooks/index.ts
git commit -m "feat: add useAppLifecycle hook with Logger breadcrumbs"
```

---

## Task 5: Device Info

**Files:**
- Create: `utils/deviceInfo.ts`
- Create: `hooks/useDeviceInfo.ts`
- Modify: `hooks/index.ts`

**Step 1: Create `utils/deviceInfo.ts`**

```typescript
/**
 * @fileoverview Device diagnostic information utility
 * @module utils/deviceInfo
 */

import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Dimensions, Platform } from 'react-native';

export interface DeviceDiagnostics {
  os: string;
  osVersion: string;
  deviceModel: string;
  appVersion: string;
  buildNumber: string;
  locale: string;
  timezone: string;
  isEmulator: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
}

/**
 * Collects device diagnostic information for debugging and crash reports.
 */
export async function getDeviceDiagnostics(): Promise<DeviceDiagnostics> {
  const { width, height } = Dimensions.get('window');
  const pixelRatio = Dimensions.get('window').scale ?? 1;

  return {
    os: Platform.OS,
    osVersion: Platform.Version?.toString() ?? 'unknown',
    deviceModel: Device.modelName ?? 'unknown',
    appVersion: Application.nativeApplicationVersion ?? 'unknown',
    buildNumber: Application.nativeBuildVersion ?? 'unknown',
    locale: Platform.select({ ios: 'en', android: 'en', default: 'en' }),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isEmulator: !Device.isDevice,
    screenWidth: width,
    screenHeight: height,
    pixelRatio,
  };
}
```

**Step 2: Create `hooks/useDeviceInfo.ts`**

```typescript
import { useState, useEffect } from 'react';
import { getDeviceDiagnostics, DeviceDiagnostics } from '@/utils/deviceInfo';

/**
 * Hook that fetches device diagnostics once on mount.
 */
export function useDeviceInfo(): DeviceDiagnostics | null {
  const [info, setInfo] = useState<DeviceDiagnostics | null>(null);

  useEffect(() => {
    getDeviceDiagnostics().then(setInfo);
  }, []);

  return info;
}
```

**Step 3: Add to `hooks/index.ts`:**

```typescript
export { useDeviceInfo } from "./useDeviceInfo";
```

**Step 4: Verify and commit**

```bash
npx tsc --noEmit
git add utils/deviceInfo.ts hooks/useDeviceInfo.ts hooks/index.ts
git commit -m "feat: add device info utility and hook"
```

---

## Task 6: SQLite Database Service

**Files:**
- Create: `services/database/types.ts`
- Create: `services/database/migrations.ts`
- Create: `services/database/adapters/sqlite.ts`
- Create: `services/database/adapters/mock.ts`
- Create: `services/database/database-adapter.ts`
- Create: `hooks/useDatabase.ts`
- Modify: `services/index.ts`
- Modify: `hooks/index.ts`

**Step 1: Create `services/database/types.ts`**

```typescript
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
  update(table: string, data: Record<string, unknown>, where: string, params?: unknown[]): Promise<number>;
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
```

**Step 2: Create `services/database/migrations.ts`**

```typescript
/**
 * @fileoverview Database migration definitions
 * @module services/database/migrations
 */

import type { Migration } from './types';

/**
 * Register new migrations by adding them to this array.
 * Migrations must have strictly increasing version numbers.
 */
export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
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
```

**Step 3: Create `services/database/adapters/sqlite.ts`**

```typescript
/**
 * @fileoverview SQLite database adapter using expo-sqlite
 * @module services/database/adapters/sqlite
 */

import * as SQLite from 'expo-sqlite';
import type { DatabaseAdapter, TransactionContext, Migration } from '../types';
import { migrations } from '../migrations';
import { DATABASE } from '@/constants/config';
import { Logger } from '@/services/logger/logger-adapter';

export class SQLiteAdapter implements DatabaseAdapter {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync(DATABASE.NAME);
    await this.runMigrations();
    Logger.info('Database initialized', { name: DATABASE.NAME });
  }

  private async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) throw new Error('Database not initialized. Call initialize() first.');
    return this.db;
  }

  private async runMigrations(): Promise<void> {
    const db = await this.getDb();

    // Ensure migrations table exists
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Get applied migrations
    const applied = await db.getAllAsync<{ version: number }>(
      'SELECT version FROM _migrations ORDER BY version'
    );
    const appliedVersions = new Set(applied.map((m) => m.version));

    // Run pending migrations in order
    const sorted = [...migrations].sort((a, b) => a.version - b.version);
    for (const migration of sorted) {
      if (!appliedVersions.has(migration.version)) {
        await db.execAsync(migration.up);
        await db.runAsync(
          'INSERT INTO _migrations (version, name) VALUES (?, ?)',
          [migration.version, migration.name]
        );
        Logger.info(`Migration applied: ${migration.name} (v${migration.version})`);
      }
    }
  }

  async execute(sql: string, params?: unknown[]): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(sql, params ?? []);
  }

  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const db = await this.getDb();
    return db.getAllAsync<T>(sql, params ?? []);
  }

  async insert(table: string, data: Record<string, unknown>): Promise<number> {
    const db = await this.getDb();
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const values = Object.values(data);
    const result = await db.runAsync(
      `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    return result.lastInsertRowId;
  }

  async update(table: string, data: Record<string, unknown>, where: string, params?: unknown[]): Promise<number> {
    const db = await this.getDb();
    const sets = Object.keys(data).map((k) => `${k} = ?`).join(', ');
    const values = [...Object.values(data), ...(params ?? [])];
    const result = await db.runAsync(
      `UPDATE ${table} SET ${sets} WHERE ${where}`,
      values
    );
    return result.changes;
  }

  async delete(table: string, where: string, params?: unknown[]): Promise<number> {
    const db = await this.getDb();
    const result = await db.runAsync(
      `DELETE FROM ${table} WHERE ${where}`,
      params ?? []
    );
    return result.changes;
  }

  async transaction<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T> {
    const db = await this.getDb();
    let result: T;
    await db.execAsync('BEGIN TRANSACTION');
    try {
      const txContext: TransactionContext = {
        execute: async (sql, params) => {
          await db.runAsync(sql, params ?? []);
        },
        query: async <R>(sql: string, params?: unknown[]) => {
          return db.getAllAsync<R>(sql, params ?? []);
        },
      };
      result = await fn(txContext);
      await db.execAsync('COMMIT');
    } catch (error) {
      await db.execAsync('ROLLBACK');
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
```

**Step 4: Create `services/database/adapters/mock.ts`**

```typescript
/**
 * @fileoverview Mock database adapter for testing
 * @module services/database/adapters/mock
 */

import type { DatabaseAdapter, TransactionContext } from '../types';

export class MockDatabaseAdapter implements DatabaseAdapter {
  private tables: Record<string, Record<string, unknown>[]> = {};
  private nextId = 1;

  async initialize(): Promise<void> {
    // No-op
  }

  async execute(_sql: string, _params?: unknown[]): Promise<void> {
    // No-op for mock
  }

  async query<T>(_sql: string, _params?: unknown[]): Promise<T[]> {
    return [] as T[];
  }

  async insert(table: string, data: Record<string, unknown>): Promise<number> {
    if (!this.tables[table]) this.tables[table] = [];
    const id = this.nextId++;
    this.tables[table].push({ id, ...data });
    return id;
  }

  async update(table: string, data: Record<string, unknown>, _where: string, _params?: unknown[]): Promise<number> {
    if (!this.tables[table]) return 0;
    this.tables[table] = this.tables[table].map((row) => ({ ...row, ...data }));
    return this.tables[table].length;
  }

  async delete(table: string, _where: string, _params?: unknown[]): Promise<number> {
    const count = this.tables[table]?.length ?? 0;
    this.tables[table] = [];
    return count;
  }

  async transaction<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T> {
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
```

**Step 5: Create `services/database/database-adapter.ts`**

```typescript
/**
 * @fileoverview Database facade
 * @module services/database/database-adapter
 */

import type { DatabaseAdapter, TransactionContext } from './types';
import { SQLiteAdapter } from './adapters/sqlite';
import { DATABASE } from '@/constants/config';

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

  async insert(table: string, data: Record<string, unknown>): Promise<number> {
    return adapter.insert(table, data);
  },

  async update(table: string, data: Record<string, unknown>, where: string, params?: unknown[]): Promise<number> {
    return adapter.update(table, data, where, params);
  },

  async delete(table: string, where: string, params?: unknown[]): Promise<number> {
    return adapter.delete(table, where, params);
  },

  async transaction<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T> {
    return adapter.transaction(fn);
  },

  async close(): Promise<void> {
    return adapter.close();
  },
};
```

**Step 6: Create `hooks/useDatabase.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { Database } from '@/services/database/database-adapter';

/**
 * Hook for declarative database queries with auto-refetch.
 */
export function useDatabase<T>(
  query: string,
  params?: unknown[],
  deps: unknown[] = []
): { data: T[]; isLoading: boolean; error: Error | null; refetch: () => void } {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await Database.query<T>(query, params);
      setData(result);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, JSON.stringify(params), ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
```

**Step 7: Add barrel exports**

In `services/index.ts`:
```typescript
export { Database } from "./database/database-adapter";
export { SQLiteAdapter } from "./database/adapters/sqlite";
export { MockDatabaseAdapter } from "./database/adapters/mock";
export type { DatabaseAdapter, TransactionContext, Migration } from "./database/types";
```

In `hooks/index.ts`:
```typescript
export { useDatabase } from "./useDatabase";
```

**Step 8: Verify and commit**

```bash
npx tsc --noEmit
git add services/database/ hooks/useDatabase.ts services/index.ts hooks/index.ts
git commit -m "feat: add SQLite database service with migrations"
```

---

## Task 7: Retry & Circuit Breaker

**Files:**
- Create: `services/api/retry.ts`
- Create: `services/api/circuit-breaker.ts`
- Create: `services/api/deduplicator.ts`
- Modify: `services/index.ts`

**Step 1: Create `services/api/retry.ts`**

```typescript
/**
 * @fileoverview Retry with exponential backoff and jitter
 * @module services/api/retry
 */

import { RETRY } from '@/constants/config';
import { Logger } from '@/services/logger/logger-adapter';

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitter: boolean;
  retryableStatuses: number[];
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: RETRY.MAX_ATTEMPTS,
  baseDelayMs: RETRY.BASE_DELAY_MS,
  maxDelayMs: RETRY.MAX_DELAY_MS,
  jitter: RETRY.JITTER,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponential = config.baseDelayMs * Math.pow(2, attempt);
  const capped = Math.min(exponential, config.maxDelayMs);
  if (!config.jitter) return capped;
  return capped * (0.5 + Math.random() * 0.5);
}

/**
 * Wraps a function with retry logic using exponential backoff + jitter.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  for (let attempt = 0; attempt < cfg.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLast = attempt === cfg.maxAttempts - 1;
      const status = (error as { status?: number }).status;
      const isRetryable = status ? cfg.retryableStatuses.includes(status) : true;

      if (isLast || !isRetryable) throw error;

      const delay = calculateDelay(attempt, cfg);
      Logger.warn(`Retry attempt ${attempt + 1}/${cfg.maxAttempts} in ${Math.round(delay)}ms`, {
        error: (error as Error).message,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Unreachable, but TypeScript requires it
  throw new Error('Retry exhausted');
}
```

**Step 2: Create `services/api/circuit-breaker.ts`**

```typescript
/**
 * @fileoverview Circuit breaker pattern for API resilience
 * @module services/api/circuit-breaker
 */

import { CIRCUIT_BREAKER } from '@/constants/config';
import { Logger } from '@/services/logger/logger-adapter';

type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private _state: CircuitState = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private threshold: number;
  private resetTimeoutMs: number;

  constructor(options?: { threshold?: number; resetTimeoutMs?: number }) {
    this.threshold = options?.threshold ?? CIRCUIT_BREAKER.THRESHOLD;
    this.resetTimeoutMs = options?.resetTimeoutMs ?? CIRCUIT_BREAKER.RESET_TIMEOUT_MS;
  }

  get state(): CircuitState {
    if (this._state === 'open') {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.resetTimeoutMs) {
        this._state = 'half-open';
      }
    }
    return this._state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      throw new Error('Circuit breaker is open — request rejected');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this._state === 'half-open') {
      Logger.info('Circuit breaker closed after successful test request');
    }
    this.failureCount = 0;
    this._state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this._state = 'open';
      Logger.warn(`Circuit breaker opened after ${this.failureCount} failures`);
    }
  }

  /** Reset the circuit breaker to closed state */
  reset(): void {
    this._state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}
```

**Step 3: Create `services/api/deduplicator.ts`**

```typescript
/**
 * @fileoverview Request deduplicator — prevents duplicate in-flight requests
 * @module services/api/deduplicator
 */

const inflight = new Map<string, Promise<unknown>>();

function hashBody(body?: unknown): string {
  if (!body) return '';
  try {
    return JSON.stringify(body);
  } catch {
    return '';
  }
}

/**
 * Generates a deduplication key from request parameters.
 */
export function getDeduplicationKey(method: string, url: string, body?: unknown): string {
  return `${method}:${url}:${hashBody(body)}`;
}

/**
 * Deduplicates concurrent identical requests — returns the same promise
 * if an identical request is already in flight.
 */
export function deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = fn().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return promise;
}

/** Get number of in-flight requests (for testing) */
export function getInflightCount(): number {
  return inflight.size;
}
```

**Step 4: Add barrel exports to `services/index.ts`:**

```typescript
export { withRetry } from "./api/retry";
export type { RetryConfig } from "./api/retry";
export { CircuitBreaker } from "./api/circuit-breaker";
export { deduplicate, getDeduplicationKey, getInflightCount } from "./api/deduplicator";
```

**Step 5: Verify and commit**

```bash
npx tsc --noEmit
git add services/api/retry.ts services/api/circuit-breaker.ts services/api/deduplicator.ts services/index.ts
git commit -m "feat: add retry, circuit breaker, and request deduplicator"
```

---

## Task 8: Session Management

**Files:**
- Create: `services/session/session-manager.ts`
- Create: `hooks/useSessionTimeout.ts`
- Create: `components/ui/SessionTimeoutModal.tsx`
- Modify: `services/index.ts`
- Modify: `hooks/index.ts`
- Modify: `components/ui/index.ts`
- Modify: i18n JSON files (5 locales)

**Step 1: Add i18n keys to all 5 locales**

Add to `i18n/locales/en.json` inside the top-level object:
```json
"session": {
  "expiringSoon": "Your session is about to expire",
  "expired": "Your session has expired",
  "continue": "Continue",
  "logout": "Log Out",
  "remainingTime": "Time remaining: {{seconds}}s"
}
```

Add to `i18n/locales/fr.json`:
```json
"session": {
  "expiringSoon": "Votre session est sur le point d'expirer",
  "expired": "Votre session a expiré",
  "continue": "Continuer",
  "logout": "Se déconnecter",
  "remainingTime": "Temps restant : {{seconds}}s"
}
```

Add to `i18n/locales/es.json`:
```json
"session": {
  "expiringSoon": "Tu sesión está a punto de expirar",
  "expired": "Tu sesión ha expirado",
  "continue": "Continuar",
  "logout": "Cerrar sesión",
  "remainingTime": "Tiempo restante: {{seconds}}s"
}
```

Add to `i18n/locales/de.json`:
```json
"session": {
  "expiringSoon": "Ihre Sitzung läuft bald ab",
  "expired": "Ihre Sitzung ist abgelaufen",
  "continue": "Fortfahren",
  "logout": "Abmelden",
  "remainingTime": "Verbleibende Zeit: {{seconds}}s"
}
```

Add to `i18n/locales/ar.json`:
```json
"session": {
  "expiringSoon": "جلستك على وشك الانتهاء",
  "expired": "انتهت جلستك",
  "continue": "متابعة",
  "logout": "تسجيل الخروج",
  "remainingTime": "الوقت المتبقي: {{seconds}} ثانية"
}
```

**Step 2: Create `services/session/session-manager.ts`**

```typescript
/**
 * @fileoverview Session timeout manager
 * @module services/session/session-manager
 */

import { SESSION } from '@/constants/config';
import { Logger } from '@/services/logger/logger-adapter';

type SessionCallback = () => void;

class SessionManagerClass {
  private lastActivity = Date.now();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private onWarningCallback: SessionCallback | null = null;
  private onExpiredCallback: SessionCallback | null = null;

  /** Update the last activity timestamp */
  touch(): void {
    this.lastActivity = Date.now();
  }

  /** Check if the session has expired */
  isExpired(): boolean {
    return Date.now() - this.lastActivity >= SESSION.TIMEOUT_MS;
  }

  /** Check if we should show the warning */
  isWarning(): boolean {
    const elapsed = Date.now() - this.lastActivity;
    return elapsed >= SESSION.TIMEOUT_MS - SESSION.WARNING_BEFORE_MS && !this.isExpired();
  }

  /** Remaining time in milliseconds */
  getRemainingMs(): number {
    return Math.max(0, SESSION.TIMEOUT_MS - (Date.now() - this.lastActivity));
  }

  /** Register event callbacks */
  onWarning(callback: SessionCallback): void {
    this.onWarningCallback = callback;
  }

  onExpired(callback: SessionCallback): void {
    this.onExpiredCallback = callback;
  }

  /** Start monitoring session activity */
  startMonitoring(): void {
    if (!SESSION.ENABLED || this.intervalId) return;

    this.lastActivity = Date.now();
    this.intervalId = setInterval(() => {
      if (this.isExpired()) {
        Logger.warn('Session expired');
        this.onExpiredCallback?.();
        this.stopMonitoring();
      } else if (this.isWarning()) {
        this.onWarningCallback?.();
      }
    }, 1000);

    Logger.info('Session monitoring started');
  }

  /** Stop monitoring */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const SessionManager = new SessionManagerClass();
```

**Step 3: Create `hooks/useSessionTimeout.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { SessionManager } from '@/services/session/session-manager';
import { useAppLifecycle } from './useAppLifecycle';
import { SESSION } from '@/constants/config';

/**
 * Hook for session timeout management.
 */
export function useSessionTimeout(): {
  isWarning: boolean;
  isExpired: boolean;
  remainingSeconds: number;
  extend: () => void;
} {
  const [isWarning, setIsWarning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.floor(SESSION.TIMEOUT_MS / 1000)
  );

  const extend = useCallback(() => {
    SessionManager.touch();
    setIsWarning(false);
    setIsExpired(false);
  }, []);

  // Pause monitoring on background
  useAppLifecycle({
    onBackground: () => SessionManager.stopMonitoring(),
    onForeground: () => {
      SessionManager.touch();
      SessionManager.startMonitoring();
    },
  });

  useEffect(() => {
    if (!SESSION.ENABLED) return;

    SessionManager.onWarning(() => setIsWarning(true));
    SessionManager.onExpired(() => setIsExpired(true));
    SessionManager.startMonitoring();

    const tick = setInterval(() => {
      setRemainingSeconds(Math.floor(SessionManager.getRemainingMs() / 1000));
    }, 1000);

    return () => {
      SessionManager.stopMonitoring();
      clearInterval(tick);
    };
  }, []);

  return { isWarning, isExpired, remainingSeconds, extend };
}
```

**Step 4: Create `components/ui/SessionTimeoutModal.tsx`**

```typescript
import React from 'react';
import { View, Text, Pressable, Modal as RNModal } from 'react-native';
import { useTranslation } from 'react-i18next';

interface SessionTimeoutModalProps {
  visible: boolean;
  remainingSeconds: number;
  onContinue: () => void;
  onLogout: () => void;
}

export function SessionTimeoutModal({
  visible,
  remainingSeconds,
  onContinue,
  onLogout,
}: SessionTimeoutModalProps) {
  const { t } = useTranslation();

  return (
    <RNModal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-gray-800">
          <Text className="mb-2 text-center text-lg font-bold text-gray-900 dark:text-white">
            {t('session.expiringSoon')}
          </Text>
          <Text className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {t('session.remainingTime', { seconds: remainingSeconds })}
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={onLogout}
              className="flex-1 items-center rounded-xl border border-gray-300 py-3 dark:border-gray-600"
              accessibilityRole="button"
              accessibilityLabel={t('session.logout')}
            >
              <Text className="font-semibold text-gray-700 dark:text-gray-300">
                {t('session.logout')}
              </Text>
            </Pressable>
            <Pressable
              onPress={onContinue}
              className="flex-1 items-center rounded-xl bg-blue-500 py-3"
              accessibilityRole="button"
              accessibilityLabel={t('session.continue')}
            >
              <Text className="font-semibold text-white">
                {t('session.continue')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </RNModal>
  );
}
```

**Step 5: Add barrel exports**

In `services/index.ts`:
```typescript
export { SessionManager } from "./session/session-manager";
```

In `hooks/index.ts`:
```typescript
export { useSessionTimeout } from "./useSessionTimeout";
```

In `components/ui/index.ts`:
```typescript
export { SessionTimeoutModal } from "./SessionTimeoutModal";
```

**Step 6: Verify and commit**

```bash
npx tsc --noEmit
git add services/session/ hooks/useSessionTimeout.ts components/ui/SessionTimeoutModal.tsx i18n/locales/ services/index.ts hooks/index.ts components/ui/index.ts
git commit -m "feat: add session timeout management with modal"
```

---

## Task 9: Request Interceptors

**Files:**
- Create: `services/api/interceptors.ts`
- Modify: `services/index.ts`

**Step 1: Create `services/api/interceptors.ts`**

```typescript
/**
 * @fileoverview Request/response interceptor pipeline
 * @module services/api/interceptors
 */

import { Logger } from '@/services/logger/logger-adapter';
import { SECURITY } from '@/constants/config';

export interface RequestConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
}

export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
export type ResponseInterceptor = (response: Response, config: RequestConfig) => Response | Promise<Response>;

const requestInterceptors: Array<{ id: number; fn: RequestInterceptor }> = [];
const responseInterceptors: Array<{ id: number; fn: ResponseInterceptor }> = [];
let nextId = 0;

export const InterceptorManager = {
  addRequest(interceptor: RequestInterceptor): () => void {
    const id = nextId++;
    requestInterceptors.push({ id, fn: interceptor });
    return () => {
      const idx = requestInterceptors.findIndex((i) => i.id === id);
      if (idx !== -1) requestInterceptors.splice(idx, 1);
    };
  },

  addResponse(interceptor: ResponseInterceptor): () => void {
    const id = nextId++;
    responseInterceptors.push({ id, fn: interceptor });
    return () => {
      const idx = responseInterceptors.findIndex((i) => i.id === id);
      if (idx !== -1) responseInterceptors.splice(idx, 1);
    };
  },

  async runRequest(config: RequestConfig): Promise<RequestConfig> {
    let current = config;
    for (const { fn } of requestInterceptors) {
      current = await fn(current);
    }
    return current;
  },

  async runResponse(response: Response, config: RequestConfig): Promise<Response> {
    let current = response;
    for (const { fn } of responseInterceptors) {
      current = await fn(current, config);
    }
    return current;
  },
};

// ============================================================================
// Built-in interceptors
// ============================================================================

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Adds X-Correlation-ID header to every request */
export const correlationIdInterceptor: RequestInterceptor = (config) => ({
  ...config,
  headers: { ...config.headers, 'X-Correlation-ID': generateUUID() },
});

/** Adds standardized User-Agent header */
export const userAgentInterceptor: RequestInterceptor = (config) => ({
  ...config,
  headers: { ...config.headers, 'X-Client': 'react-native-template/3.3.0' },
});

/** Logs request duration */
export const requestTimingInterceptor: ResponseInterceptor = (response, config) => {
  Logger.addBreadcrumb('http', `${config.method} ${config.url}`, {
    status: response.status,
  });
  return response;
};

/** HMAC request signing (when enabled) */
export const requestSigningInterceptor: RequestInterceptor = (config) => {
  if (!SECURITY.REQUEST_SIGNING.ENABLED) return config;
  // Placeholder — actual HMAC signing requires a shared secret
  return {
    ...config,
    headers: {
      ...config.headers,
      [SECURITY.REQUEST_SIGNING.HEADER_NAME]: 'placeholder-signature',
    },
  };
};
```

**Step 2: Add barrel exports to `services/index.ts`:**

```typescript
export { InterceptorManager, correlationIdInterceptor, userAgentInterceptor, requestTimingInterceptor, requestSigningInterceptor } from "./api/interceptors";
export type { RequestConfig, RequestInterceptor, ResponseInterceptor } from "./api/interceptors";
```

**Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add services/api/interceptors.ts services/index.ts
git commit -m "feat: add request/response interceptor pipeline"
```

---

## Task 10: PII Scrubbing

**Files:**
- Create: `utils/piiScrubber.ts`

**Step 1: Create `utils/piiScrubber.ts`**

```typescript
/**
 * @fileoverview PII scrubbing utility for logs and error reports
 * @module utils/piiScrubber
 */

const SENSITIVE_KEYS = new Set([
  'password', 'passwd', 'secret', 'token', 'authorization',
  'cookie', 'session', 'creditcard', 'credit_card', 'cardnumber',
  'card_number', 'cvv', 'cvc', 'ssn', 'social_security',
]);

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const CREDIT_CARD_REGEX = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
const JWT_REGEX = /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;

/**
 * Scrub PII patterns from a string.
 */
export function scrubString(text: string): string {
  return text
    .replace(EMAIL_REGEX, '***@***.***')
    .replace(CREDIT_CARD_REGEX, (match) => {
      const last4 = match.replace(/[-\s]/g, '').slice(-4);
      return `****-****-****-${last4}`;
    })
    .replace(PHONE_REGEX, '***-****')
    .replace(JWT_REGEX, '[TOKEN]');
}

/**
 * Recursively scrub PII from any data structure.
 */
export function scrub(data: unknown): unknown {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') return scrubString(data);

  if (Array.isArray(data)) return data.map(scrub);

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = scrub(value);
      }
    }
    return result;
  }

  return data;
}
```

**Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add utils/piiScrubber.ts
git commit -m "feat: add PII scrubbing utility"
```

---

## Task 11: Permission Rationale Component

**Files:**
- Create: `components/ui/PermissionRationale.tsx`
- Modify: `components/ui/index.ts`
- Modify: i18n JSON files (5 locales)

**Step 1: Add i18n keys to all 5 locales**

Add to `i18n/locales/en.json`:
```json
"permissionRationale": {
  "camera": {
    "title": "Camera Access",
    "description": "We need access to your camera to take photos and scan documents."
  },
  "photos": {
    "title": "Photo Library",
    "description": "We need access to your photos to let you select images."
  },
  "location": {
    "title": "Location Access",
    "description": "We need your location to show nearby results and improve your experience."
  },
  "contacts": {
    "title": "Contacts Access",
    "description": "We need access to your contacts to help you find friends."
  },
  "microphone": {
    "title": "Microphone Access",
    "description": "We need microphone access to record audio messages."
  },
  "notifications": {
    "title": "Notifications",
    "description": "We'd like to send you notifications about important updates and activity."
  },
  "allow": "Allow",
  "deny": "Not Now"
}
```

Add translated equivalents to `fr.json`, `es.json`, `de.json`, `ar.json` (same structure with translations).

**Step 2: Create `components/ui/PermissionRationale.tsx`**

```typescript
import React from 'react';
import { View, Text, Pressable, Modal as RNModal } from 'react-native';
import { useTranslation } from 'react-i18next';

interface PermissionRationaleProps {
  visible: boolean;
  permission: 'camera' | 'photos' | 'location' | 'contacts' | 'microphone' | 'notifications';
  onAllow: () => void;
  onDeny: () => void;
}

export function PermissionRationale({
  visible,
  permission,
  onAllow,
  onDeny,
}: PermissionRationaleProps) {
  const { t } = useTranslation();

  return (
    <RNModal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-gray-800">
          <Text className="mb-2 text-center text-lg font-bold text-gray-900 dark:text-white">
            {t(`permissionRationale.${permission}.title`)}
          </Text>
          <Text className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {t(`permissionRationale.${permission}.description`)}
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={onDeny}
              className="flex-1 items-center rounded-xl border border-gray-300 py-3 dark:border-gray-600"
              accessibilityRole="button"
              accessibilityLabel={t('permissionRationale.deny')}
            >
              <Text className="font-semibold text-gray-700 dark:text-gray-300">
                {t('permissionRationale.deny')}
              </Text>
            </Pressable>
            <Pressable
              onPress={onAllow}
              className="flex-1 items-center rounded-xl bg-blue-500 py-3"
              accessibilityRole="button"
              accessibilityLabel={t('permissionRationale.allow')}
            >
              <Text className="font-semibold text-white">
                {t('permissionRationale.allow')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </RNModal>
  );
}
```

**Step 3: Add to `components/ui/index.ts`:**

```typescript
export { PermissionRationale } from "./PermissionRationale";
```

**Step 4: Verify and commit**

```bash
npx tsc --noEmit
git add components/ui/PermissionRationale.tsx components/ui/index.ts i18n/locales/
git commit -m "feat: add PermissionRationale component with i18n"
```

---

## Task 12: Network Quality Hook

**Files:**
- Create: `hooks/useNetworkQuality.ts`
- Modify: `hooks/index.ts`

**Step 1: Create `hooks/useNetworkQuality.ts`**

```typescript
import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

export type NetworkQuality = 'excellent' | 'good' | 'poor' | 'offline';

interface NetworkQualityInfo {
  quality: NetworkQuality;
  connectionType: string;
  isMetered: boolean;
}

function deriveQuality(state: NetInfoState): NetworkQuality {
  if (!state.isConnected) return 'offline';

  if (state.type === NetInfoStateType.wifi || state.type === NetInfoStateType.ethernet) {
    return 'excellent';
  }

  if (state.type === NetInfoStateType.cellular) {
    const gen = (state.details as { cellularGeneration?: string })?.cellularGeneration;
    if (gen === '5g' || gen === '4g') return 'good';
    return 'poor';
  }

  return 'good';
}

/**
 * Hook that monitors network connection quality.
 */
export function useNetworkQuality(): NetworkQualityInfo {
  const [info, setInfo] = useState<NetworkQualityInfo>({
    quality: 'excellent',
    connectionType: 'unknown',
    isMetered: false,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setInfo({
        quality: deriveQuality(state),
        connectionType: state.type,
        isMetered: (state.details as { isConnectionExpensive?: boolean })?.isConnectionExpensive ?? false,
      });
    });

    return () => unsubscribe();
  }, []);

  return info;
}
```

**Step 2: Add to `hooks/index.ts`:**

```typescript
export { useNetworkQuality } from "./useNetworkQuality";
export type { NetworkQuality } from "./useNetworkQuality";
```

**Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add hooks/useNetworkQuality.ts hooks/index.ts
git commit -m "feat: add useNetworkQuality hook"
```

---

## Task 13: Analytics Session

**Files:**
- Create: `services/analytics/session.ts`
- Modify: `services/index.ts`

**Step 1: Create `services/analytics/session.ts`**

```typescript
/**
 * @fileoverview Analytics session tracking
 * @module services/analytics/session
 */

import { AppState, AppStateStatus } from 'react-native';
import { Logger } from '@/services/logger/logger-adapter';

const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minutes = new session

function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class AnalyticsSessionManager {
  private sessionId = generateSessionId();
  private startTime = Date.now();
  private eventCount = 0;
  private screensVisited = new Set<string>();
  private lastActiveTime = Date.now();
  private subscription: { remove: () => void } | null = null;

  /** Start tracking (call once at app launch) */
  start(): void {
    this.subscription = AppState.addEventListener('change', this.handleAppStateChange);
    Logger.info('Analytics session started', { sessionId: this.sessionId });
  }

  /** Stop tracking */
  stop(): void {
    this.subscription?.remove();
    this.subscription = null;
  }

  private handleAppStateChange = (state: AppStateStatus): void => {
    if (state === 'active') {
      const gap = Date.now() - this.lastActiveTime;
      if (gap >= SESSION_GAP_MS) {
        this.newSession();
      }
    }
    this.lastActiveTime = Date.now();
  };

  private newSession(): void {
    Logger.info('New analytics session (gap exceeded)', {
      previousSessionId: this.sessionId,
      previousDuration: this.getSessionDuration(),
      previousEventCount: this.eventCount,
    });
    this.sessionId = generateSessionId();
    this.startTime = Date.now();
    this.eventCount = 0;
    this.screensVisited.clear();
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getSessionDuration(): number {
    return Date.now() - this.startTime;
  }

  trackEvent(): void {
    this.eventCount++;
    this.lastActiveTime = Date.now();
  }

  trackScreen(name: string): void {
    this.screensVisited.add(name);
    this.lastActiveTime = Date.now();
  }

  getStats(): { sessionId: string; duration: number; eventCount: number; screens: string[] } {
    return {
      sessionId: this.sessionId,
      duration: this.getSessionDuration(),
      eventCount: this.eventCount,
      screens: Array.from(this.screensVisited),
    };
  }
}

export const AnalyticsSession = new AnalyticsSessionManager();
```

**Step 2: Add to `services/index.ts`:**

```typescript
export { AnalyticsSession } from "./analytics/session";
```

**Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add services/analytics/session.ts services/index.ts
git commit -m "feat: add analytics session tracking"
```

---

## Task 14: Build Metadata & Version Gate

**Files:**
- Create: `utils/buildInfo.ts`
- Create: `utils/versionGate.ts`

**Step 1: Create `utils/buildInfo.ts`**

```typescript
/**
 * @fileoverview Build metadata utility
 * @module utils/buildInfo
 */

import * as Application from 'expo-application';
import { Platform } from 'react-native';

export interface BuildInfo {
  version: string;
  buildNumber: string;
  bundleId: string;
  platform: string;
}

/**
 * Get static build metadata (synchronous).
 */
export function getBuildInfo(): BuildInfo {
  return {
    version: Application.nativeApplicationVersion ?? 'unknown',
    buildNumber: Application.nativeBuildVersion ?? 'unknown',
    bundleId: Application.applicationId ?? 'unknown',
    platform: Platform.OS,
  };
}

/**
 * Get extended build info including install time (async).
 */
export async function getExtendedBuildInfo(): Promise<BuildInfo & { installTime: Date | null }> {
  const base = getBuildInfo();
  let installTime: Date | null = null;

  if (Platform.OS === 'ios') {
    installTime = await Application.getInstallationTimeAsync();
  }

  return { ...base, installTime };
}
```

**Step 2: Create `utils/versionGate.ts`**

```typescript
/**
 * @fileoverview Semantic version comparison utilities
 * @module utils/versionGate
 */

export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Parse a semver string into components.
 */
export function parseVersion(version: string): ParsedVersion {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0] ?? 0,
    minor: parts[1] ?? 0,
    patch: parts[2] ?? 0,
  };
}

/**
 * Compare two version strings.
 * Returns -1 if a < b, 0 if equal, 1 if a > b.
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const va = parseVersion(a);
  const vb = parseVersion(b);

  if (va.major !== vb.major) return va.major < vb.major ? -1 : 1;
  if (va.minor !== vb.minor) return va.minor < vb.minor ? -1 : 1;
  if (va.patch !== vb.patch) return va.patch < vb.patch ? -1 : 1;
  return 0;
}

/**
 * Check if current version meets the minimum requirement.
 */
export function isVersionAtLeast(current: string, minimum: string): boolean {
  return compareVersions(current, minimum) >= 0;
}
```

**Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add utils/buildInfo.ts utils/versionGate.ts
git commit -m "feat: add build metadata and version gate utilities"
```

---

## Task 15: Debug Menu

**Files:**
- Create: `components/dev/DebugMenuProvider.tsx`
- Create: `components/dev/DebugMenu.tsx`
- Create: `components/dev/panels/EnvPanel.tsx`
- Create: `components/dev/panels/NetworkPanel.tsx`
- Create: `components/dev/panels/StoragePanel.tsx`
- Create: `components/dev/panels/FeatureFlagsPanel.tsx`

**Step 1: Create `components/dev/panels/EnvPanel.tsx`**

```typescript
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useDeviceInfo } from '@/hooks/useDeviceInfo';
import { getBuildInfo } from '@/utils/buildInfo';
import { IS_DEV, IS_PREVIEW, IS_PROD, API_URL } from '@/constants/config';

export function EnvPanel() {
  const deviceInfo = useDeviceInfo();
  const buildInfo = getBuildInfo();

  const envLabel = IS_DEV ? 'Development' : IS_PREVIEW ? 'Preview' : 'Production';

  const items = [
    { label: 'Environment', value: envLabel },
    { label: 'API URL', value: API_URL },
    { label: 'App Version', value: buildInfo.version },
    { label: 'Build Number', value: buildInfo.buildNumber },
    { label: 'Bundle ID', value: buildInfo.bundleId },
    { label: 'Platform', value: buildInfo.platform },
    ...(deviceInfo
      ? [
          { label: 'OS Version', value: deviceInfo.osVersion },
          { label: 'Device', value: deviceInfo.deviceModel },
          { label: 'Screen', value: `${deviceInfo.screenWidth}x${deviceInfo.screenHeight} @${deviceInfo.pixelRatio}x` },
          { label: 'Timezone', value: deviceInfo.timezone },
          { label: 'Emulator', value: deviceInfo.isEmulator ? 'Yes' : 'No' },
        ]
      : []),
  ];

  return (
    <ScrollView className="flex-1 p-4">
      {items.map(({ label, value }) => (
        <View key={label} className="mb-3 flex-row justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
          <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</Text>
          <Text className="text-sm text-gray-900 dark:text-white" selectable>{value}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
```

**Step 2: Create `components/dev/panels/NetworkPanel.tsx`**

```typescript
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Logger } from '@/services/logger/logger-adapter';

export function NetworkPanel() {
  const breadcrumbs = Logger.getBreadcrumbs()
    .filter((b) => b.category === 'http')
    .reverse()
    .slice(0, 50);

  return (
    <ScrollView className="flex-1 p-4">
      {breadcrumbs.length === 0 ? (
        <Text className="text-center text-sm text-gray-500 dark:text-gray-400">
          No network requests captured yet
        </Text>
      ) : (
        breadcrumbs.map((b, i) => (
          <View key={`${b.timestamp}-${i}`} className="mb-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
            <Text className="text-xs font-mono text-gray-900 dark:text-white">{b.message}</Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(b.timestamp).toLocaleTimeString()}
              {b.data?.status ? ` — ${b.data.status}` : ''}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
```

**Step 3: Create `components/dev/panels/StoragePanel.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function StoragePanel() {
  const [keys, setKeys] = useState<Array<{ key: string; value: string }>>([]);

  const loadKeys = async () => {
    const allKeys = await AsyncStorage.getAllKeys();
    const entries = await AsyncStorage.multiGet(allKeys as string[]);
    setKeys(entries.map(([key, value]) => ({ key, value: value ?? '' })));
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const clearAll = async () => {
    await AsyncStorage.clear();
    setKeys([]);
  };

  return (
    <ScrollView className="flex-1 p-4">
      <Pressable onPress={loadKeys} className="mb-3 items-center rounded-lg bg-blue-500 py-2">
        <Text className="text-sm font-semibold text-white">Refresh</Text>
      </Pressable>
      <Pressable onPress={clearAll} className="mb-4 items-center rounded-lg bg-red-500 py-2">
        <Text className="text-sm font-semibold text-white">Clear All</Text>
      </Pressable>
      {keys.length === 0 ? (
        <Text className="text-center text-sm text-gray-500 dark:text-gray-400">
          No stored data
        </Text>
      ) : (
        keys.map(({ key, value }) => (
          <View key={key} className="mb-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
            <Text className="text-xs font-bold text-gray-900 dark:text-white">{key}</Text>
            <Text className="text-xs font-mono text-gray-600 dark:text-gray-400" numberOfLines={3}>
              {value}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
```

**Step 4: Create `components/dev/panels/FeatureFlagsPanel.tsx`**

```typescript
import React from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { FEATURES } from '@/constants/config';

export function FeatureFlagsPanel() {
  const flags = Object.entries(FEATURES);

  return (
    <ScrollView className="flex-1 p-4">
      {flags.map(([key, value]) => (
        <View key={key} className="mb-3 flex-row items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
          <Text className="flex-1 text-sm text-gray-900 dark:text-white">{key}</Text>
          <Switch value={!!value} disabled />
        </View>
      ))}
      <Text className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
        Feature flags are read-only. Configure in constants/config.ts
      </Text>
    </ScrollView>
  );
}
```

**Step 5: Create `components/dev/DebugMenu.tsx`**

```typescript
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal as RNModal, SafeAreaView } from 'react-native';
import { EnvPanel } from './panels/EnvPanel';
import { NetworkPanel } from './panels/NetworkPanel';
import { StoragePanel } from './panels/StoragePanel';
import { FeatureFlagsPanel } from './panels/FeatureFlagsPanel';

const TABS = ['Env', 'Network', 'Storage', 'Flags'] as const;
type Tab = typeof TABS[number];

interface DebugMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function DebugMenu({ visible, onClose }: DebugMenuProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Env');

  return (
    <RNModal visible={visible} animationType="slide">
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">Debug Menu</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
            <Text className="text-base font-semibold text-blue-500">Close</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border-b border-gray-200 dark:border-gray-700">
          <View className="flex-row px-2 py-2">
            {TABS.map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`mr-2 rounded-full px-4 py-1.5 ${activeTab === tab ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <Text className={`text-sm font-medium ${activeTab === tab ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View className="flex-1">
          {activeTab === 'Env' && <EnvPanel />}
          {activeTab === 'Network' && <NetworkPanel />}
          {activeTab === 'Storage' && <StoragePanel />}
          {activeTab === 'Flags' && <FeatureFlagsPanel />}
        </View>
      </SafeAreaView>
    </RNModal>
  );
}
```

**Step 6: Create `components/dev/DebugMenuProvider.tsx`**

```typescript
import React, { useState, createContext, useContext, useCallback, ReactNode } from 'react';
import { DebugMenu } from './DebugMenu';
import { IS_DEV } from '@/constants/config';

interface DebugMenuContextValue {
  open: () => void;
}

const DebugMenuContext = createContext<DebugMenuContextValue>({ open: () => {} });

/**
 * Hook to programmatically open the debug menu.
 */
export function useDebugMenu(): DebugMenuContextValue {
  return useContext(DebugMenuContext);
}

/**
 * Provider that wraps the app and provides the debug menu in dev mode.
 * In production, this is a pass-through (no-op).
 */
export function DebugMenuProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  if (!IS_DEV) {
    return <>{children}</>;
  }

  return (
    <DebugMenuContext.Provider value={{ open }}>
      {children}
      <DebugMenu visible={visible} onClose={close} />
    </DebugMenuContext.Provider>
  );
}
```

**Step 7: Verify and commit**

```bash
npx tsc --noEmit
git add components/dev/
git commit -m "feat: add debug menu with env, network, storage, and flags panels"
```

---

## Task 16: Final Integration & Version Bump

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: Update CHANGELOG.md**

Add a new entry at the top for version 3.3.0 with all 15 features listed.

**Step 2: Run full verification**

```bash
npx tsc --noEmit
npx eslint . --max-warnings 100
npx jest --no-coverage --passWithNoTests
```

**Step 3: Final commit**

```bash
git add CHANGELOG.md
git commit -m "chore: update CHANGELOG for v3.3.0 — Phase 9 production hardening"
```

---

## Dependency Graph

```
Task 1 (Config)
  ├── Task 2 (Logger) ← foundation for all services
  │   ├── Task 4 (App Lifecycle) ← uses Logger
  │   ├── Task 6 (Database) ← uses Logger
  │   ├── Task 7 (Retry/CB) ← uses Logger
  │   ├── Task 8 (Session) ← uses Logger + App Lifecycle
  │   ├── Task 9 (Interceptors) ← uses Logger
  │   ├── Task 13 (Analytics Session) ← uses Logger
  │   └── Task 15 (Debug Menu) ← uses Logger + Device Info
  ├── Task 3 (Config Mgmt)
  ├── Task 5 (Device Info)
  ├── Task 10 (PII Scrubber)
  ├── Task 11 (Permission Rationale)
  ├── Task 12 (Network Quality)
  └── Task 14 (Build Info + Version Gate)
Task 16 (Final Integration)
```

**Execution order:** 1 → 2 → 3,4,5 (parallel-safe) → 6,7 → 8 → 9,10,11,12,13,14 (parallel-safe) → 15 → 16
