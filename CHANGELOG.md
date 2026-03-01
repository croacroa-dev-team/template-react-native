# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_No unreleased changes._

---

## [3.6.0] - 2026-03-01

### Added — Phase 12: Code Review + Polish

- **HMAC Request Signing** — Replaced stub `generateRequestSignature()` with real SHA-256 digest via `expo-crypto`; interceptor now calls the real function with `METHOD:URL:BODY:TIMESTAMP` payload

### Fixed

- **Barrel Exports** — Added missing exports for `PermissionGate`, `Paywall`, `PurchaseButton` in `components/ui/index.ts`
- **ESLint DX** — Disabled `no-console` rule in `__tests__/**/*` override so test files can use `console.log` freely

### Tests

- 12 new test files (165 tests): circuit-breaker, retry, deduplicator, interceptors, session-manager, security, storage, force-update, logger, validation, versionGate, accessibility
- Total: 423 tests across 35 suites (up from 258 across 23)

---

## [3.5.0] - 2026-03-01

### Added — Phase 11: Party Game Infrastructure + Follow-ups

- **SoundManager** — Singleton audio service with `preload()`, `play()`, `stop()`, `setVolume()`, `unloadAll()` using `expo-av`
- **useSound / useSoundEffects** — React hooks for single and batched sound playback with automatic cleanup on unmount
- **useHaptics** — Impact, notification, and selection haptic feedback via `expo-haptics` with platform safety checks
- **useKeepAwake** — Prevent screen sleep during active game sessions via `expo-keep-awake` with tag-based activation
- **useCountdown** — Timer hook with start/pause/reset, `progress` (1→0), `isFinished`, and `onFinish` callback
- **CountdownTimer** — Visual countdown component with Reanimated-animated progress bar, size variants (sm/md/lg), urgent color
- **useScreenOrientation** — Read and lock screen orientation with auto-unlock on unmount via `expo-screen-orientation`
- **useShare** — Cross-platform sharing: `expo-sharing` for files, RN `Share` for text/URLs, `isAvailable` check
- **i18n** — `game.*` (12 keys) and `countdown.*` (4 keys) added to all 5 locales (en, fr, es, de, ar)
- **Storybook** — 12 new stories: Modal, Select, Checkbox, Avatar, Badge, Skeleton, SessionTimeoutModal, ForceUpdateScreen, AnimatedButton, AnimatedCard, CountdownTimer, BottomSheet
- **Storybook Preview** — Added `GestureHandlerRootView` wrapper and i18n initialization decorator

### Fixed

- **PII Scrubber** — Replaced exact-match `SENSITIVE_KEYS.has()` with suffix-aware `isSensitiveKey()` that catches compound keys like `api_token`, `refresh_token`, `auth_secret`, `api_key`
- **Session Timeout** — `useSessionTimeout` now accepts `options?: { enabled?: boolean }` to skip monitoring when user is unauthenticated; auth layout passes `{ enabled: isAuthenticated }`
- **Analytics Console** — Added comment explaining raw `console.log` in `consoleAdapter` is intentional (prevents circular dependency with Logger)

### Tests

- 9 new test files (86 tests): piiScrubber, sound-manager, useSound, useHaptics, useKeepAwake, useCountdown, useScreenOrientation, useShare, CountdownTimer
- Jest mock setup for 5 new Expo modules: expo-av, expo-haptics, expo-keep-awake, expo-screen-orientation, expo-sharing

---

## [3.4.0] - 2026-02-28

### Added — Phase 10: Wire Everything

- **Layout Integration** — `DebugMenuProvider` wired into root layout, `useUpdates()` OTA check on mount/foreground, `SessionTimeoutModal` with auto-signout in auth layout
- **Logger Migration** — All 117+ `console.*` calls across 28 source files migrated to structured `Logger` facade with PII scrubbing; only intentional console adapters and JSDoc examples remain
- **Sentry PII Scrubbing** — `beforeSend` now strips `user.email/username/ip_address`, deletes `Authorization`/`Cookie` headers, and runs `scrub()` on `event.extra`
- **OptimizedImage Fix** — Shimmer animation fixed: `useState` abuse replaced with proper `useEffect` + `withRepeat`/`cancelAnimation` for continuous animation with cleanup
- **Documentation** — README updated with accurate test count (172+), Phase 8/9 features, expanded project structure; Firebase Remote Config and SQLite database guides added

### Fixed

- `SkeletonLoader` shimmer now loops continuously instead of firing once
- `useAuth` test suite mocks updated for Logger compatibility
- `ApiClient` test suite config mock expanded with `LOGGER` constants
- TypeScript errors in Logger migration (context object types) resolved

---

## [3.3.0] - 2026-02-23

### Added — Phase 9: Production Hardening

- **Logger Service** — Structured logging with adapter pattern (`ConsoleLoggerAdapter`), breadcrumb buffer (max 100), scoped loggers via `Logger.withContext()`, `useLogger` hook
- **Remote Config** — `RemoteConfigAdapter` interface with `MockRemoteConfigAdapter`, `RemoteConfig` facade, `useRemoteConfig` hook with real-time updates
- **App Lifecycle** — `useAppLifecycle` hook wrapping `AppState.addEventListener` with transition detection and automatic Logger breadcrumbs
- **Device Info** — `getDeviceDiagnostics()` utility (OS, device, screen, emulator detection) using expo-device/expo-application, `useDeviceInfo` hook
- **SQLite Database** — `DatabaseAdapter` interface, `SQLiteAdapter` wrapping expo-sqlite with auto-migration system, `MockDatabaseAdapter`, `Database` facade, `useDatabase` hook
- **Retry & Circuit Breaker** — `withRetry()` (exponential backoff + jitter), `CircuitBreaker` class (closed/open/half-open states), request deduplicator
- **Session Management** — `SessionManager` with activity tracking and timeout monitoring, `useSessionTimeout` hook, `SessionTimeoutModal` component with i18n (5 locales)
- **Request Interceptors** — `InterceptorManager` pipeline with built-in interceptors: correlation ID, user agent, request timing, request signing
- **PII Scrubbing** — `scrub()` and `scrubString()` utilities for redacting emails, phone numbers, credit cards, JWTs, and sensitive fields
- **Permission Rationale** — `PermissionRationale` modal component for pre-permission dialogs with i18n (5 locales, 6 permission types)
- **Network Quality** — `useNetworkQuality` hook using NetInfo to derive quality levels (excellent/good/poor/offline)
- **Analytics Session** — `AnalyticsSession` manager tracking session ID, duration, events, screens visited with auto-renewal on 30min gaps
- **Build Metadata** — `getBuildInfo()` and `getExtendedBuildInfo()` utilities via expo-application
- **Version Gate** — `compareVersions()`, `isVersionAtLeast()`, `parseVersion()` semver utilities
- **Debug Menu** — Dev-only `DebugMenuProvider` with 4 panels: Environment info, Network requests, AsyncStorage viewer, Feature flags viewer

### Dependencies Added

- `expo-sqlite`
- `expo-application`

---

## [3.2.0] - 2026-02-23

### Added — Phase 8: Additional Features

- **Rate Limiting UI** — 429 response interception with `Retry-After` parsing, toast feedback, `useRateLimit` hook with countdown
- **App Force Update** — Version comparison service, `useForceUpdate` hook, non-dismissible `ForceUpdateScreen` component
- **In-App Review** — `useInAppReview` hook with session counting and throttle via AsyncStorage, powered by `expo-store-review`
- **Crash Recovery** — Enhanced `ErrorBoundary` with soft reset (re-render) and hard reset (clear stores + `Updates.reloadAsync()`), crash counter with Sentry context
- **Feature Flags + A/B Testing** — `FeatureFlagAdapter` interface, `FeatureFlags` facade with `setAdapter()`, `MockFeatureFlagAdapter`, `useFeatureFlag`/`useExperiment` hooks, `FeatureGate` component
- **Accessibility Tests** — 26 a11y tests for Button, Input, Checkbox, Modal, Card with reusable assertion helpers
- **HTTP ETag Caching** — In-memory ETag cache with LRU eviction in `ApiClient`, `If-None-Match`/304 handling
- **LaunchDarkly Integration Guide** — Complete adapter implementation guide

### Changed

- `Button` component now includes `accessibilityRole="button"` and `accessibilityState`

### Dependencies Added

- `expo-store-review`

---

## [3.1.0] - 2026-02-23

### Added — Phase 7: Polish & Documentation

- **Screen Internationalization** — All 6 screens (login, register, forgot-password, home, profile, settings) fully migrated to i18n with 56 strings replaced
- **i18n Completeness** — 23 new keys added to all 5 locales (en, fr, es, de, ar), including `forgotPassword.*` and `home.*` sections
- **Phase 6 Hook Tests** — 57 unit tests across 6 files covering all 13 Phase 6 hooks (permissions, payments, media, WebSocket, animations, analytics)
- **Integration Guides** — Copy-paste-ready adapter guides for Supabase (auth), RevenueCat (payments), PostHog (analytics)

---

## [3.0.0] - 2026-02-22

### Added — Phase 6: Template Completion

- **Permission Management** (turnkey)
  - Centralized `PermissionManager` service for all Expo permissions
  - `usePermission` hook with auto-refresh on app resume
  - `PermissionGate` component for declarative permission-gated UI
  - Support: camera, location, contacts, media library, microphone, notifications
- **Animations / UX Polish** (turnkey)
  - Animation presets (timing, spring) and entry animation configs
  - Screen transition presets for Expo Router (slide, fade, modal, etc.)
  - `useAnimatedEntry` and `useStaggeredEntry` hooks
  - `useParallax` hook for scroll parallax effects
  - `AnimatedScreen` and `AnimatedListItem` components
- **Social Login** (turnkey)
  - Google Sign-In via `expo-auth-session` with PKCE
  - Apple Sign-In via `expo-apple-authentication` (iOS)
  - `SocialAuth` orchestrator with configurable providers
  - `SocialLoginButtons` component with platform-aware display
- **Analytics** (adapter pattern)
  - `AnalyticsAdapter` interface following auth adapter pattern
  - Console adapter for development
  - `useTrackScreen` hook (auto-tracks Expo Router navigation)
  - `useTrackEvent` hook for custom events
  - `AnalyticsProvider` with automatic initialization
- **Payment Infrastructure** (adapter pattern)
  - `PaymentAdapter` interface with mock implementation
  - `useProducts`, `usePurchase`, `useSubscription` hooks
  - `Paywall` and `PurchaseButton` components
- **File Upload / Media**
  - Media picker service (camera + library)
  - Image compression service via `expo-image-manipulator`
  - Upload service with progress tracking, cancel, retry
  - `useImagePicker` and `useUpload` hooks
  - `ImagePickerButton` and `UploadProgress` components
- **WebSockets / Real-time**
  - `WebSocketManager` with auto-reconnect and exponential backoff
  - Heartbeat, offline queue, auth token injection
  - `useWebSocket`, `useChannel`, `usePresence` hooks

### Dependencies Added

- `expo-camera`
- `expo-location`
- `expo-contacts`
- `expo-media-library`
- `expo-auth-session`
- `expo-web-browser`
- `expo-apple-authentication`
- `expo-crypto`
- `expo-image-manipulator`

---

## [2.0.0] - 2025-01-01

### Added

- Auth adapter pattern for easy provider switching (Supabase, Firebase, etc.)
- Internationalization (i18n) support with expo-localization and i18next
  - 5 locales included (en, fr, es, de, ar)
  - Language detection and persistence
- New UI components:
  - `Select` - Dropdown/picker component
  - `Checkbox` and `CheckboxGroup` - Animated checkbox components
  - `BottomSheet` - Modal bottom sheet with @gorhom/bottom-sheet
  - `Avatar` and `AvatarGroup` - User avatar components
  - `Badge`, `Chip`, and `CountBadge` - Label/tag components
  - `OptimizedImage` - High-performance image component with expo-image
- Deep linking support with `useDeepLinking` hook
- Biometric authentication with `useBiometrics` hook
- Analytics adapter for multiple providers (Mixpanel, Amplitude, etc.)
- Rate limiting for API calls using Bottleneck
- E2E testing setup with Maestro
  - Login, registration, navigation, and offline flow tests
- Project documentation:
  - CONTRIBUTING.md
  - CHANGELOG.md
  - Architecture Decision Records (ADRs)
- GitHub Actions CI/CD workflows:
  - Lint, test, and build checks
  - Maestro Cloud E2E tests
  - EAS Build workflow (manual trigger)
  - EAS Update workflow (OTA on push to main)
- Onboarding screens with animated pagination
- OTA updates support with `useUpdates` hook
- Performance monitoring with `usePerformance` hook
- Comprehensive accessibility utilities:
  - Builder functions for all UI patterns (button, input, toggle, etc.)
  - Hooks for screen reader, reduce motion, and bold text preferences
  - Utility functions for announcements and focus management

### Changed

- Primary color changed from blue to emerald green (croacroa branding)
- API client now includes rate limiting protection

### Dependencies Added

- `@gorhom/bottom-sheet` ^4.6.0
- `bottleneck` ^2.19.5
- `expo-image` ~2.0.0
- `expo-local-authentication` ~15.0.0
- `expo-localization` ~15.0.0
- `i18next` ^23.0.0
- `react-i18next` ^14.0.0

## [1.0.0] - 2024-01-01

### Added

- Initial release
- Expo SDK 52 with React Native 0.76
- Expo Router for file-based navigation
- Authentication flow with secure token storage
- React Query for data fetching with offline support
- Zustand for state management
- NativeWind (Tailwind CSS) for styling
- React Hook Form with Zod validation
- Push notifications with Expo Notifications
- Error tracking with Sentry
- Storybook for component documentation
- Jest and Testing Library for unit tests
- Dark mode support
- Basic UI components (Button, Input, Card, Modal, Skeleton)
- Animated components with Reanimated
- Toast notifications with Burnt

### Infrastructure

- EAS Build configuration for dev/preview/production
- ESLint and Prettier setup
- Husky pre-commit hooks
- TypeScript strict mode

---

## Versioning Guide

### Version Format: MAJOR.MINOR.PATCH

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Changelog Categories

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Features to be removed
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
