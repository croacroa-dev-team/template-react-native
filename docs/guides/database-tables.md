# SQLite Database & Migrations Guide

This guide explains the SQLite database system, how migrations work, and how to add your own tables.

## Architecture

The database layer follows the adapter pattern:

```
Database (facade) → DatabaseAdapter (interface) → SQLiteAdapter (production)
                                                 → MockDatabaseAdapter (testing)
```

- **`Database`** — Singleton facade (`services/database/database-adapter.ts`)
- **`SQLiteAdapter`** — Production adapter using `expo-sqlite` (`services/database/adapters/sqlite.ts`)
- **`MockDatabaseAdapter`** — In-memory adapter for tests

## Built-in Schema

### `_migrations` table

Tracks which migrations have been applied:

```sql
CREATE TABLE IF NOT EXISTS _migrations (
  version   INTEGER PRIMARY KEY,
  name      TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

This table is created by migration version 1 (`initial_schema`) and should never be modified manually.

## Adding a New Table

### Step 1: Add a Migration

Edit `services/database/migrations.ts` and append a new entry:

```typescript
export const migrations: Migration[] = [
  // ... existing migrations
  {
    version: 2,
    name: "create_cached_responses",
    up: `
      CREATE TABLE IF NOT EXISTS cached_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL UNIQUE,
        etag TEXT,
        body TEXT NOT NULL,
        cached_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_cached_responses_url ON cached_responses(url);
    `,
    down: `
      DROP INDEX IF EXISTS idx_cached_responses_url;
      DROP TABLE IF EXISTS cached_responses;
    `,
  },
];
```

### Step 2: Use It

```typescript
import { Database } from "@/services/database/database-adapter";

// Insert
const id = await Database.insert("cached_responses", {
  url: "/api/users",
  etag: '"abc123"',
  body: JSON.stringify(data),
  expires_at: new Date(Date.now() + 3600000).toISOString(),
});

// Query
const rows = await Database.query<CachedResponse>(
  "SELECT * FROM cached_responses WHERE url = ? AND expires_at > datetime('now')",
  ["/api/users"]
);

// Update
await Database.update(
  "cached_responses",
  { body: JSON.stringify(newData), etag: '"def456"' },
  "url = ?",
  ["/api/users"]
);

// Delete
await Database.delete("cached_responses", "expires_at < datetime('now')");

// Transaction
await Database.transaction(async (tx) => {
  await tx.execute(
    "DELETE FROM cached_responses WHERE expires_at < datetime('now')"
  );
  await tx.execute("INSERT INTO cached_responses (url, body) VALUES (?, ?)", [
    "/api/users",
    JSON.stringify(freshData),
  ]);
});
```

## Migration Rules

1. **Versions must be strictly increasing** — Each new migration gets the next integer
2. **Never modify existing migrations** — Once shipped, a migration is immutable
3. **Always provide `down`** — For development rollback support
4. **Use `IF NOT EXISTS` / `IF EXISTS`** — Makes migrations idempotent
5. **Keep migrations small** — One table or one significant change per migration

## Common Table Patterns

### User Preferences

```typescript
{
  version: 3,
  name: "create_user_preferences",
  up: `
    CREATE TABLE IF NOT EXISTS user_preferences (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
  down: `DROP TABLE IF EXISTS user_preferences;`,
}
```

### Offline Queue

```typescript
{
  version: 4,
  name: "create_offline_queue",
  up: `
    CREATE TABLE IF NOT EXISTS offline_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      body TEXT,
      headers TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      retry_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE INDEX IF NOT EXISTS idx_offline_queue_status ON offline_queue(status);
  `,
  down: `
    DROP INDEX IF EXISTS idx_offline_queue_status;
    DROP TABLE IF EXISTS offline_queue;
  `,
}
```

## Using the `useDatabase` Hook

```tsx
import { useDatabase } from "@/hooks/useDatabase";

function CacheManager() {
  const db = useDatabase();

  const clearExpired = async () => {
    await db.execute(
      "DELETE FROM cached_responses WHERE expires_at < datetime('now')"
    );
  };

  return <Button onPress={clearExpired}>Clear Expired Cache</Button>;
}
```

## Testing

Use `MockDatabaseAdapter` in tests:

```typescript
import { Database } from "@/services/database/database-adapter";
import { MockDatabaseAdapter } from "@/services/database/adapters/mock";

beforeEach(() => {
  Database.setAdapter(new MockDatabaseAdapter());
});
```
