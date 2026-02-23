# Phase 9: Production Hardening — Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the remaining production-critical features to make the template enterprise-ready: structured logging, local database, retry strategies, session management, debug tooling, and DX improvements.

**Architecture:** All new services follow the existing adapter pattern (types.ts + facade + mock adapter). New hooks wrap services. Config goes in constants/config.ts. Barrel exports in index.ts files. i18n keys in all 5 locales.

**Tech Stack:** expo-sqlite, expo-application, expo-device (already present)

---

## Sub-Phase 9A — Foundations (Features 1-4)

### Feature 1: Logger Service

**Files:**
- Create: `services/logger/types.ts`
- Create: `services/logger/logger-adapter.ts`
- Create: `services/logger/adapters/console.ts`
- Create: `hooks/useLogger.ts`

**LoggerAdapter interface:**
```typescript
interface LoggerAdapter {
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

**Logger facade:**
- Module-level singleton with `setAdapter()`, delegates to active adapter
- Gated by `LOGGER.ENABLED`
- Built-in circular breadcrumb buffer (max `LOGGER.MAX_BREADCRUMBS`, default 100)
- `Logger.withContext(ctx)` returns scoped logger instance

**ConsoleLoggerAdapter:**
- Filters by `LOGGER.MIN_LEVEL` (default: `debug` in dev, `warn` in prod)
- Formats with timestamp, level, context
- Stores breadcrumbs in memory

**Config additions:**
```typescript
LOGGER: {
  ENABLED: true,
  MIN_LEVEL: IS_DEV ? 'debug' : 'warn',
  MAX_BREADCRUMBS: 100,
}
```

---

### Feature 2: Config Management

**Files:**
- Create: `services/config/types.ts`
- Create: `services/config/config-adapter.ts`
- Create: `services/config/adapters/mock.ts`
- Create: `hooks/useRemoteConfig.ts`
- Create: `docs/guides/config-firebase.md`

**RemoteConfigAdapter interface:**
```typescript
interface RemoteConfigAdapter {
  initialize(): Promise<void>;
  getValue<T>(key: string, defaultValue: T): T;
  getAll(): Record<string, unknown>;
  refresh(): Promise<void>;
  onConfigUpdate(callback: (keys: string[]) => void): () => void;
}
```

**MockRemoteConfigAdapter:**
- In-memory config map
- `setConfig(key, value)` test helper
- Simulates refresh delay

**Hook:** `useRemoteConfig<T>(key, defaultValue)` → `{ value, isLoading }`

---

### Feature 3: App Lifecycle

**Files:**
- Create: `hooks/useAppLifecycle.ts`

**Hook API:**
```typescript
useAppLifecycle({
  onForeground?: () => void;
  onBackground?: () => void;
  onInactive?: () => void;
}): { appState: AppStateStatus }
```

- Wraps `AppState.addEventListener`
- Tracks previous state to detect transitions
- Auto-logs breadcrumbs via Logger
- Cleans up on unmount

---

### Feature 4: Device Info

**Files:**
- Create: `utils/deviceInfo.ts`
- Create: `hooks/useDeviceInfo.ts`

**API:**
```typescript
interface DeviceDiagnostics {
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

function getDeviceDiagnostics(): Promise<DeviceDiagnostics>;
```

**Hook:** `useDeviceInfo()` → `DeviceDiagnostics` (fetched once on mount)

Uses: `expo-device`, `expo-application`, `expo-constants`, `Dimensions`

---

## Sub-Phase 9B — Infrastructure (Features 5-8)

### Feature 5: SQLite Database

**Files:**
- Create: `services/database/types.ts`
- Create: `services/database/database-adapter.ts`
- Create: `services/database/adapters/sqlite.ts`
- Create: `services/database/adapters/mock.ts`
- Create: `services/database/migrations.ts`
- Create: `hooks/useDatabase.ts`
- Create: `docs/guides/database-tables.md`

**DatabaseAdapter interface:**
```typescript
interface DatabaseAdapter {
  initialize(): Promise<void>;
  execute(sql: string, params?: unknown[]): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  insert(table: string, data: Record<string, unknown>): Promise<number>;
  update(table: string, data: Record<string, unknown>, where: string, params?: unknown[]): Promise<number>;
  delete(table: string, where: string, params?: unknown[]): Promise<number>;
  transaction<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
```

**Migration system:**
```typescript
interface Migration {
  version: number;
  name: string;
  up: string; // SQL
  down: string; // SQL
}
```
- Auto-runs on `initialize()`
- Tracks applied migrations in `_migrations` table
- Validates version ordering

**SQLiteAdapter:** Wraps `expo-sqlite` with typed helpers

**MockDatabaseAdapter:** In-memory array storage for tests

**Hook:** `useDatabase<T>(query, params, deps)` → `{ data, isLoading, error, refetch }`

**Config:**
```typescript
DATABASE: {
  ENABLED: true,
  NAME: 'app.db',
  VERSION: 1,
}
```

---

### Feature 6: Retry & Circuit Breaker

**Files:**
- Create: `services/api/retry.ts`
- Create: `services/api/circuit-breaker.ts`
- Create: `services/api/deduplicator.ts`

**Retry with exponential backoff + jitter:**
```typescript
interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitter: boolean;
  retryableStatuses: number[];
}

function withRetry<T>(fn: () => Promise<T>, config?: Partial<RetryConfig>): Promise<T>;
```

**Circuit Breaker:**
```typescript
class CircuitBreaker {
  constructor(options: { threshold: number; resetTimeoutMs: number });
  async execute<T>(fn: () => Promise<T>): Promise<T>;
  get state(): 'closed' | 'open' | 'half-open';
}
```
- `closed` → normal, counts failures
- `open` → rejects immediately, waits for reset timeout
- `half-open` → allows one test request

**Request Deduplicator:**
- Map of inflight requests by `method:url:bodyHash`
- Same key → returns same promise
- Cleaned up on resolve/reject

**Config:**
```typescript
RETRY: {
  MAX_ATTEMPTS: 3,
  BASE_DELAY_MS: 1000,
  MAX_DELAY_MS: 30000,
  JITTER: true,
}
CIRCUIT_BREAKER: {
  THRESHOLD: 5,
  RESET_TIMEOUT_MS: 30000,
}
```

---

### Feature 7: Session Management

**Files:**
- Create: `services/session/session-manager.ts`
- Create: `hooks/useSessionTimeout.ts`
- Create: `components/ui/SessionTimeoutModal.tsx`

**SessionManager:**
- Tracks last activity timestamp
- `touch()` — updates timestamp on user interaction
- `isExpired()` — checks against `SESSION.TIMEOUT_MS`
- `startMonitoring()` / `stopMonitoring()` — periodic check
- Events: `onWarning`, `onExpired`

**Hook:** `useSessionTimeout()` → `{ isWarning, isExpired, remainingSeconds, extend() }`
- Integrates with `useAppLifecycle` — pause monitoring on background
- Shows `SessionTimeoutModal` when `isWarning`

**SessionTimeoutModal:**
- "Your session is about to expire" with countdown
- "Continue" or "Log out" buttons
- Auto-logout on countdown end

**Config:**
```typescript
SESSION: {
  ENABLED: true,
  TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  WARNING_BEFORE_MS: 2 * 60 * 1000, // Warn 2 min before
}
```

**i18n keys:**
- `session.expiringSoon`, `session.expired`, `session.continue`, `session.logout`, `session.remainingTime`

---

### Feature 8: Request Interceptors

**Files:**
- Create: `services/api/interceptors.ts`

**API:**
```typescript
type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = (response: Response, config: RequestConfig) => Response | Promise<Response>;

interface InterceptorManager {
  addRequest(interceptor: RequestInterceptor): () => void;
  addResponse(interceptor: ResponseInterceptor): () => void;
}
```

**Built-in interceptors:**
- `correlationIdInterceptor` — adds `X-Correlation-ID` header (UUID)
- `userAgentInterceptor` — adds standardized `User-Agent` header
- `requestTimingInterceptor` — logs request duration via Logger
- `requestSigningInterceptor` — HMAC signature (when enabled)

Integration: Modify `ApiClient.request()` to run through interceptor pipeline

---

## Sub-Phase 9C — DX & Polish (Features 9-15)

### Feature 9: Debug Menu

**Files:**
- Create: `components/dev/DebugMenu.tsx`
- Create: `components/dev/DebugMenuProvider.tsx`
- Create: `components/dev/panels/NetworkPanel.tsx`
- Create: `components/dev/panels/StoragePanel.tsx`
- Create: `components/dev/panels/FeatureFlagsPanel.tsx`
- Create: `components/dev/panels/EnvPanel.tsx`

**DebugMenuProvider:**
- Wraps app in root layout (dev only, no-op in production)
- Detects shake gesture via accelerometer or `DeviceMotion`
- Opens full-screen modal with tab panels

**Panels:**
- **Network:** Lists last N API requests/responses (via Logger breadcrumbs)
- **Storage:** View/edit AsyncStorage and SecureStore keys
- **Feature Flags:** Toggle runtime flags on/off
- **Env Info:** Device diagnostics, build info, config values
- **Actions:** Force crash, clear cache, clear storage, trigger OTA check

---

### Feature 10: PII Scrubbing

**Files:**
- Create: `utils/piiScrubber.ts`

**API:**
```typescript
function scrub(data: unknown): unknown;
function scrubString(text: string): string;
```

**Patterns scrubbed:**
- Email addresses → `***@***.***`
- Phone numbers → `***-****`
- Credit card numbers → `****-****-****-1234`
- JWT tokens → `[TOKEN]`
- Password fields → `[REDACTED]`

Integration: Auto-applied in Logger before writing, and in Sentry `beforeSend`

---

### Feature 11: Permission Rationale

**Files:**
- Create: `components/ui/PermissionRationale.tsx`

**Component:**
```tsx
<PermissionRationale
  permission="camera"
  icon="camera-outline"
  title={t('permission.rationale.camera.title')}
  description={t('permission.rationale.camera.description')}
  onAllow={() => requestPermission()}
  onDeny={() => navigation.goBack()}
/>
```

- Full-screen modal with icon, title, description, allow/deny buttons
- Pre-configured for: camera, photos, location, contacts, microphone, notifications
- Analytics: tracks allow/deny rates per permission

**i18n keys:** `permission.rationale.{type}.title`, `permission.rationale.{type}.description`

---

### Feature 12: Network Quality

**Files:**
- Create: `hooks/useNetworkQuality.ts`

**Hook:** `useNetworkQuality()` → `{ quality, connectionType, isMetered }`
- Quality levels: `excellent` | `good` | `poor` | `offline`
- Based on `NetInfo.type` and `NetInfo.details.cellularGeneration`
- WiFi → `excellent`, 4G/5G → `good`, 3G → `poor`, 2G → `poor`, none → `offline`

---

### Feature 13: Analytics Session

**Files:**
- Create: `services/analytics/session.ts`

**AnalyticsSession:**
- Generate session ID on app launch (UUID)
- Track: start time, duration, event count, screens visited
- Auto-end on background (> 30 min gap = new session)
- Expose via `Analytics.getSessionId()`, `Analytics.getSessionDuration()`

---

### Feature 14: Build Metadata

**Files:**
- Create: `utils/buildInfo.ts`
- Modify: `app.config.ts`

**buildInfo:**
```typescript
const BUILD_INFO = {
  version: Application.nativeApplicationVersion,
  buildNumber: Application.nativeBuildVersion,
  bundleId: Application.applicationId,
  installTime: await Application.getInstallationTimeAsync(),
}
```

Integration: included in Logger context, debug menu, crash reports

---

### Feature 15: Version Gate

**Files:**
- Create: `utils/versionGate.ts`

**API:**
```typescript
function compareVersions(a: string, b: string): -1 | 0 | 1;
function isVersionAtLeast(current: string, minimum: string): boolean;
function parseVersion(version: string): { major: number; minor: number; patch: number };
```

Used by: `useForceUpdate`, feature flags (version-gated features)

---

## Dependencies

- `expo-sqlite` — Local database (new)
- `expo-application` — Build info (new)

## Version

Bump to **3.3.0** in package.json and CHANGELOG.
